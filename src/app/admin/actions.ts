'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSession } from '@/lib/supabase/guards';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { isValidModuleType } from '@/config/taxonomy';
import { validateCategorySlug } from '@/lib/supabase/validate-category-slug';

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
  subject_id: z.string().uuid('Invalid subject ID').optional(),
  category_id: z.string().uuid('Invalid category ID').optional(),
  description: z.string().max(2000).optional(),
  topic: z.string().max(200).optional(),
  module_type: z.enum(['video_topical', 'solved_past_paper']).optional(),
  worksheet_url: z
    .string()
    .regex(ALLOWED_URL, 'Must be a YouTube or Google Drive URL')
    .nullable()
    .optional(),
  is_watermarked: z.boolean().optional(),
  is_published: z.boolean().optional(),
});

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

export async function bulkInsertResources(resources: unknown[]) {
  // Validate every row before touching the database
  const parsed = z.array(ResourceSchema).safeParse(resources);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error: `Validation failed on row — ${firstIssue.path.join('.')}: ${firstIssue.message}`,
    };
  }

  // ── Subject ownership guard ────────────────────────────────────────────
  // Verify the calling admin has permission for every subject_id in the batch.
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: 'Not authenticated.' };
  }
  if (!session.isSuperAdmin) {
    const requestedSubjects = new Set(
      parsed.data.map(r => r.subject_id).filter(Boolean) as string[],
    );
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
  for (const res of parsed.data) {
    if (res.module_type && !isValidModuleType(res.module_type)) {
      return {
        success: false,
        error: `Invalid module_type "${res.module_type}". Must be "video_topical" or "solved_past_paper".`,
      };
    }
  }

  const supabase = createAdminClient();

  // Build clean payload — only include fields that have actual values
  const payload = parsed.data.map(res => {
    const item: Record<string, unknown> = {
      title: res.title,
      content_type: res.content_type,
      source_url: res.source_url,
      is_locked: res.is_locked,
    };

    if (res.source_type)               item.source_type   = res.source_type;
    if (res.subject)                   item.subject       = res.subject;
    if (res.subject_id)                item.subject_id    = res.subject_id;
    if (res.category_id)               item.category_id   = res.category_id;
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

export async function createResource(data: any) {
  const supabase = createAdminClient();
  
  const { error } = await supabase.from('resources').insert([data]);

  if (error) {
    console.error('Failed to create resource', error);
    return { success: false, error: error.message };
  }

  revalidateResourcePaths();
  return { success: true };
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

export async function createCategory(payload: {
  name: string;
  slug: string;
  subject_id: string;
  level?: 'olevel' | 'alevel';
  parent_id?: string | null;
}) {
  // Validate slug format before inserting.
  // Determine the slug type: if parent_id points to an A-Level section, it's a paper.
  // If no level hint is provided, infer from the slug pattern.
  const level = payload.level
    ?? (payload.slug.startsWith('grade-') ? 'olevel' as const : 'alevel' as const);

  const type = payload.parent_id ? 'paper' as const
    : (payload.slug === 'as-level' || payload.slug === 'a2-level') ? 'section' as const
    : undefined;

  const validation = validateCategorySlug(payload.slug, level, type);
  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid slug format: ${validation.error}${validation.expected ? ` Expected: ${validation.expected}` : ''}`,
    };
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from('categories').insert([{
    name: payload.name,
    slug: payload.slug,
    subject_id: payload.subject_id,
    parent_id: payload.parent_id ?? null,
    sort_order: 99,
  }]);

  if (error) {
    console.error('Failed to create category', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/', 'layout'); // Extreme cache flush for dynamic taxonomy
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

  revalidatePath('/admin/blog');
  revalidatePath('/');

  return { success: true };
}
