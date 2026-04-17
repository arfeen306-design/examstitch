'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSession, requireSubjectAdmin } from '@/lib/supabase/guards';
import { fetchMergedCategoriesForSubject } from '@/lib/db/subject-provisioner';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { isValidModuleType } from '@/config/taxonomy';
import { MODULE_TYPES } from '@/lib/constants';
import { validateCategorySlugAgainstNavigation } from '@/lib/category-slug-policy';
import { assertResourceSyllabusBatch } from '@/lib/admin/resource-syllabus-guard';

const ALLOWED_URL = /^https?:\/\/(drive\.google\.com\/|youtu\.be\/[\w-]+|www\.youtube\.com\/watch\?v=[\w-]+)/;

/**
 * Revalidate all public-facing resource pages so new/updated content
 * appears instantly without a manual rebuild.
 */
function revalidateResourcePaths() {
  revalidateTag('resources');
  // Admin pages
  revalidatePath('/admin/resources');
  revalidatePath('/admin/cs');
  // O-Level resource pages
  revalidatePath('/olevel/[subject]/[grade]/past-papers', 'page');
  revalidatePath('/olevel/[subject]/[grade]/video-lectures', 'page');
  revalidatePath('/olevel/[subject]/[grade]/topical', 'page');
  // A-Level resource pages
  revalidatePath('/alevel/[subject]/as-level/[paper]/past-papers', 'page');
  revalidatePath('/alevel/[subject]/as-level/[paper]/video-lectures', 'page');
  revalidatePath('/alevel/[subject]/as-level/[paper]/topical', 'page');
  revalidatePath('/alevel/[subject]/a2-level/[paper]/past-papers', 'page');
  revalidatePath('/alevel/[subject]/a2-level/[paper]/video-lectures', 'page');
  revalidatePath('/alevel/[subject]/a2-level/[paper]/topical', 'page');
  // Subject landing pages (resource counts)
  revalidatePath('/olevel/[subject]', 'page');
  revalidatePath('/alevel/[subject]', 'page');
  // Subject grid pages (resource counts via API)
  revalidatePath('/olevel', 'page');
  revalidatePath('/alevel', 'page');
}

const ResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  content_type: z.enum(['video', 'pdf', 'worksheet']),
  source_url: z
    .string()
    .min(1, 'Source URL is required')
    .regex(ALLOWED_URL, 'Must be a YouTube or Google Drive URL'),
  is_locked: z.boolean().default(false),
  source_type: z.string().optional(),
  subject: z.string().optional(),
  subject_id: z.string().uuid('Invalid subject ID'),
  category_id: z.string().uuid('Invalid category ID'),
  syllabus_id: z.string().uuid('Invalid syllabus ID').optional(),
  parent_resource_id: z.string().uuid('Invalid parent resource ID').optional(),
  description: z.string().max(2000).optional(),
  topic: z.string().max(200).optional(),
  module_type: z.enum([MODULE_TYPES.VIDEO_TOPICAL, MODULE_TYPES.SOLVED_PAST_PAPER]).optional(),
  worksheet_url: z
    .string()
    .regex(ALLOWED_URL, 'Must be a YouTube or Google Drive URL')
    .nullable()
    .optional(),
  is_watermarked: z.boolean().optional(),
  is_published: z.boolean().optional(),
});

export type InsertResourceInput = z.infer<typeof ResourceSchema>;

export async function toggleResourceFlag(id: string, field: 'is_published' | 'is_locked' | 'is_watermarked', value: boolean) {
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .from('resources')
    .update({ [field]: value })
    .eq('id', id);

  if (error) {
    console.error(`Failed to toggle ${field} for resource ${id}`, error);
    return { success: false, error: error.message };
  }

  revalidateResourcePaths();
  return { success: true };
}

export async function bulkInsertResources(
  resources: unknown[],
  options?: { expectedSubjectId?: string },
) {
  // Validate every row before touching the database
  const parsed = z.array(ResourceSchema).safeParse(resources);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error: `Validation failed on row — ${firstIssue.path.join('.')}: ${firstIssue.message}`,
    };
  }

  const supabase = createAdminClient();

  // Resolve subject_id + syllabus_id from category when omitted
  const allCategoryIds = [...new Set(parsed.data.map(r => r.category_id))];

  const categorySubjectById = new Map<string, string>();
  const categorySyllabusById = new Map<string, string>();
  if (allCategoryIds.length > 0) {
    const { data: catRows, error: catErr } = await supabase
      .from('categories')
      .select('id, subject_id, syllabus_id, syllabus_tier_id, parent_id')
      .in('id', allCategoryIds);
    if (catErr) {
      console.error('bulkInsertResources: failed to load categories', catErr);
      return { success: false, error: 'Could not load categories for this batch. Check category IDs.' };
    }
    for (const row of catRows ?? []) {
      if (row.subject_id) categorySubjectById.set(row.id, row.subject_id);
      if (row.syllabus_id) categorySyllabusById.set(row.id, row.syllabus_id);
    }
  }

  const enriched = parsed.data.map((res, index) => {
    const categorySubjectId = categorySubjectById.get(res.category_id);
    const subject_id = res.subject_id;
    const syllabus_id = res.syllabus_id ?? categorySyllabusById.get(res.category_id);
    return { ...res, subject_id, syllabus_id, _rowIndex: index };
  });

  for (const res of enriched) {
    const categorySubjectId = categorySubjectById.get(res.category_id);
    if (!res.subject_id) {
      return {
        success: false,
        error: `Missing subject_id (row ${res._rowIndex + 1}): set subject_id on the resource or use a category linked to a subject.`,
      };
    }
    if (!categorySubjectId) {
      return {
        success: false,
        error: `Invalid category_id on row ${res._rowIndex + 1}: category not found or missing subject linkage.`,
      };
    }
    if (categorySubjectId !== res.subject_id) {
      return {
        success: false,
        error: `Row ${res._rowIndex + 1}: subject_id does not match selected category.`,
      };
    }
    if (options?.expectedSubjectId && res.subject_id !== options.expectedSubjectId) {
      return {
        success: false,
        error: `Row ${res._rowIndex + 1}: payload subject does not match active portal subject.`,
      };
    }
  }

  const guard = await assertResourceSyllabusBatch(
    supabase,
    enriched.map(r => ({
      category_id: r.category_id,
      syllabus_id: r.syllabus_id,
      subject_id: r.subject_id,
      parent_resource_id: r.parent_resource_id,
      _rowIndex: r._rowIndex,
    })),
  );
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }
  for (const r of enriched) {
    const sid = guard.resolvedSyllabusIds.get(r._rowIndex);
    if (sid) (r as { syllabus_id?: string }).syllabus_id = sid;
  }

  const parentIds = [...new Set(enriched.map(r => r.parent_resource_id).filter(Boolean) as string[])];
  if (parentIds.length > 0) {
    const { data: parents, error: pErr } = await supabase
      .from('resources')
      .select('id, category_id, syllabus_id')
      .in('id', parentIds);
    if (pErr) {
      console.error('bulkInsertResources: parent lookup failed', pErr);
      return { success: false, error: 'Could not validate parent_resource_id rows.' };
    }
    const parentById = new Map((parents ?? []).map(p => [p.id, p]));
    for (const res of enriched) {
      if (!res.parent_resource_id) continue;
      const p = parentById.get(res.parent_resource_id);
      if (!p) {
        return {
          success: false,
          error: `Invalid parent_resource_id on row ${res._rowIndex + 1}: parent resource not found.`,
        };
      }
      if (res.category_id && p.category_id && res.category_id !== p.category_id) {
        return {
          success: false,
          error: `Row ${res._rowIndex + 1}: sub-resource must use the same category_id as its parent.`,
        };
      }
      if (res.syllabus_id && p.syllabus_id && res.syllabus_id !== p.syllabus_id) {
        return {
          success: false,
          error: `Row ${res._rowIndex + 1}: syllabus must match the parent resource (O-Level vs A-Level isolation).`,
        };
      }
    }
  }

  // ── Subject ownership guard ────────────────────────────────────────────
  // Verify the calling admin has permission for every subject_id in the batch.
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: 'Not authenticated.' };
  }
  if (!session.isSuperAdmin) {
    const requestedSubjects = new Set(enriched.map(r => r.subject_id).filter(Boolean) as string[]);
    for (const sid of requestedSubjects) {
      if (!session.managedSubjects.includes(sid)) {
        return {
          success: false,
          error: `Access denied: you do not manage subject ${sid}.`,
        };
      }
    }
  }

  // ── Validate module_type values ────────────────────────────────────────
  for (const res of enriched) {
    if (res.module_type && !isValidModuleType(res.module_type)) {
      return {
        success: false,
        error: `Invalid module_type "${res.module_type}". Must be "${MODULE_TYPES.VIDEO_TOPICAL}" or "${MODULE_TYPES.SOLVED_PAST_PAPER}".`,
      };
    }
  }

  // Build clean payload — only include fields that have actual values
  const payload = enriched.map(res => {
    const item: Record<string, unknown> = {
      title: res.title,
      content_type: res.content_type,
      source_url: res.source_url,
      is_locked: res.is_locked,
    };

    if (res.source_type)               item.source_type   = res.source_type;
    if (res.subject)                   item.subject       = res.subject;
    if (res.subject_id)                item.subject_id    = res.subject_id;
    if (res.syllabus_id)               item.syllabus_id   = res.syllabus_id;
    if (res.category_id)               item.category_id   = res.category_id;
    if (res.parent_resource_id)        item.parent_resource_id = res.parent_resource_id;
    if (res.description)               item.description   = res.description;
    if (res.topic)                     item.topic         = res.topic;
    if (res.module_type)               item.module_type   = res.module_type;
    if (res.worksheet_url !== undefined) item.worksheet_url = res.worksheet_url;
    if (res.is_watermarked !== undefined) item.is_watermarked = res.is_watermarked;
    if (res.is_published !== undefined)   item.is_published   = res.is_published;

    return item;
  });

  try {
    const { error } = await supabase.from('resources').insert(payload);

    if (error) {
      console.error('Bulk insert failed', error);
      return { success: false, error: `Insert failed: ${error.message}. Run the schema repair script in Supabase SQL Editor.` };
    }

    revalidateResourcePaths();
    return { success: true };
  } catch (err: unknown) {
    console.error('Bulk insert exception', err);
    return { success: false, error: 'Could not reach the database. Check your Supabase connection.' };
  }
}

export async function createResource(data: unknown) {
  return bulkInsertResources([data]);
}

export async function deleteResource(id: string) {
  const supabase = createAdminClient();
  
  const { error } = await supabase.from('resources').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete resource', error);
    return { success: false, error: error.message };
  }

  revalidateResourcePaths();
  return { success: true };
}

export async function updateResource(id: string, updates: { title?: string; source_url?: string; worksheet_url?: string | null; content_type?: string; sort_order?: number | null; question_mapping?: any | null }) {
  const supabase = createAdminClient();
  
  const { error } = await supabase.from('resources').update(updates).eq('id', id);

  if (error) {
    console.error('Failed to update resource', error);
    return { success: false, error: error.message };
  }

  revalidateResourcePaths();
  return { success: true };
}

function normalizeCategorySlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '-');
}

export async function createCategory(payload: {
  name: string;
  slug: string;
  subject_id: string;
  parent_id?: string | null;
}) {
  const supabase = createAdminClient();

  if (!payload.name.trim() || !payload.slug.trim()) {
    return { success: false, error: 'Name and slug are required.' };
  }

  const normalizedSlug = normalizeCategorySlug(payload.slug);

  const { data: subjectRow, error: subjectErr } = await supabase
    .from('subjects')
    .select('slug')
    .eq('id', payload.subject_id)
    .single();

  if (subjectErr || !subjectRow?.slug) {
    return { success: false, error: 'Subject not found for category.' };
  }

  let parentCategorySlug: string | null = null;
  if (payload.parent_id) {
    const { data: parentCat, error: parentErr } = await supabase
      .from('categories')
      .select('slug')
      .eq('id', payload.parent_id)
      .single();
    if (parentErr || !parentCat?.slug) {
      return { success: false, error: 'Parent category not found.' };
    }
    parentCategorySlug = parentCat.slug;
  }

  const policyError = validateCategorySlugAgainstNavigation({
    normalizedSlug,
    parentSubjectSlug: subjectRow.slug,
    parentCategorySlug,
  });
  if (policyError) {
    return { success: false, error: policyError };
  }

  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('subject_id', payload.subject_id)
    .eq('slug', normalizedSlug)
    .maybeSingle();

  if (existing) {
    return { success: false, error: `Slug "${normalizedSlug}" already exists for this subject.` };
  }

  const { error } = await supabase.from('categories').insert([{
    name: payload.name.trim(),
    slug: normalizedSlug,
    subject_id: payload.subject_id,
    parent_id: payload.parent_id ?? null,
    sort_order: 99,
  }]);

  if (error) {
    console.error('Failed to create category', error);
    return { success: false, error: error.message };
  }

  revalidateTag('categories');
  revalidatePath('/admin/categories');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function deleteCategoryWithAction(categoryId: string, action: 'cascade' | 'reassign', reassignToId?: string) {
  const supabase = createAdminClient();
  
  if (action === 'reassign' && reassignToId) {
    // 1. Move all resources to new category
    const { error: moveError } = await supabase
      .from('resources')
      .update({ category_id: reassignToId })
      .eq('category_id', categoryId);
      
    if (moveError) {
      return { success: false, error: moveError.message };
    }
  } else if (action === 'cascade') {
    // 1. Delete all resources in this category
    const { error: cascadeError } = await supabase
      .from('resources')
      .delete()
      .eq('category_id', categoryId);
      
    if (cascadeError) {
      return { success: false, error: cascadeError.message };
    }
  }
  
  // 2. Delete the category itself
  const { error: deleteError } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);
    
  if (deleteError) {
    return { success: false, error: deleteError.message };
  }
  
  // Revalidate ALL paths since category hierarchy changed
  revalidateTag('categories');
  revalidateTag('resources');
  revalidatePath('/', 'layout');

  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Blog / Announcements
// ─────────────────────────────────────────────────────────────────────────────

export async function createBlogPost(formData: FormData) {
  const supabase = createAdminClient();

  const title = formData.get('title')?.toString().trim() ?? '';
  const content = formData.get('content')?.toString().trim() ?? '';
  const image_url = formData.get('image_url')?.toString().trim() || null;

  if (!title) return { success: false, error: 'Title is required' };

  const { data, error } = await supabase
    .from('blogs')
    .insert({ title, content: content || null, image_url, is_published: true })
    .select()
    .single();

  if (error) {
    console.error('createBlogPost:', error);
    return { success: false, error: error.message };
  }

  revalidateTag('blog');
  revalidatePath('/admin/blog');
  revalidatePath('/');

  return { success: true, post: data };
}

export async function deleteBlogPost(id: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('blogs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteBlogPost:', error);
    return { success: false, error: error.message };
  }

  revalidateTag('blog');
  revalidatePath('/admin/blog');
  revalidatePath('/');

  return { success: true };
}

/** Subject-scoped merged categories (service role). Use from client admin UIs instead of anon Supabase queries. */
export async function listMergedCategoriesForSubjectAdmin(subjectId: string): Promise<
  | {
      ok: true;
      categories: {
        id: string;
        name: string;
        slug: string;
        parent_id: string | null;
        sort_order: number | null;
      }[];
    }
  | { ok: false; error: string }
> {
  const session = await requireSubjectAdmin(subjectId);
  if (!session) {
    return { ok: false, error: 'Not authorised for this subject.' };
  }
  const supabase = createAdminClient();
  const { data, error } = await fetchMergedCategoriesForSubject(supabase, subjectId);
  if (error) {
    return { ok: false, error };
  }
  return {
    ok: true,
    categories: (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parent_id: c.parent_id,
      sort_order: c.sort_order,
    })),
  };
}
