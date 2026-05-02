'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { validateCategorySlugAgainstNavigation } from '@/lib/category-slug-policy';
import { provisionSubjectPortal } from '@/lib/db/subject-provisioner';
import { requireSubjectAdmin } from '@/lib/supabase/guards';
import {
  ROUTE_TO_PORTAL,
  PORTAL_ROUTE_SEGMENTS,
  ADMIN_PORTALS,
} from '@/config/taxonomy';
import { resolveDisciplineSubjectIdForPortal } from '@/lib/admin/portal-resolver';

function normalizeCategorySlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '-');
}

export async function createSubjectCategory(payload: {
  name: string;
  slug: string;
  subject_id: string;
  parent_id?: string | null;
}) {
  if (!payload.subject_id) {
    return { success: false, error: 'Unauthorized.' };
  }

  const auth = await requireSubjectAdmin(payload.subject_id);
  if (!auth) {
    return { success: false, error: 'Unauthorized.' };
  }

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

  const { error } = await supabase.from('categories').insert({
    name: payload.name.trim(),
    slug: normalizedSlug,
    subject_id: payload.subject_id,
    parent_id: payload.parent_id ?? null,
    sort_order: 99,
  });

  if (error) return { success: false, error: error.message };

  revalidateTag('categories');
  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Idempotent: seeds O-Level grade folders, AS/A2 roots, and A-Level paper categories
 * (non-CS portals) so subject admins do not have to create slugs by hand.
 */
export async function seedPortalDefaultCategories(portalRouteSegment: string): Promise<
  | { success: true; categoriesCreated: number }
  | { success: false; error: string }
> {
  if (!PORTAL_ROUTE_SEGMENTS.has(portalRouteSegment)) {
    return { success: false, error: 'Invalid subject portal.' };
  }
  const portal = ROUTE_TO_PORTAL[portalRouteSegment];
  const supabase = createAdminClient();
  // Phase 2.1: tolerate both 'maths' and 'math' (and any other configured
  // legacy slug) so seedPortalDefaultCategories doesn't fail when the
  // production row uses a non-primary form.
  const disciplineSubjectId = await resolveDisciplineSubjectIdForPortal(supabase, portal);
  if (!disciplineSubjectId) {
    return { success: false, error: 'Subject not found in the database.' };
  }
  const auth = await requireSubjectAdmin(disciplineSubjectId);
  if (!auth) {
    return { success: false, error: 'Not authorised for this subject.' };
  }

  const result = await provisionSubjectPortal(supabase, portalRouteSegment);
  if (!result.success) {
    return { success: false, error: result.error ?? 'Provisioning failed.' };
  }

  revalidateTag('categories');
  /** Scope cache invalidation to this admin portal — avoid revalidatePath('/', 'layout') which can destabilise unrelated RSC trees after bulk inserts. */
  revalidatePath(`/admin/${portalRouteSegment}`);
  revalidatePath(`/admin/${portalRouteSegment}/categories`);
  return { success: true, categoriesCreated: result.categoriesCreated ?? 0 };
}

export async function renameCategory(categoryId: string, newName: string) {
  if (!categoryId) return { success: false, error: 'Unauthorized.' };
  if (!newName.trim()) return { success: false, error: 'Name is required.' };

  const supabase = createAdminClient();

  // Resolve subject_id from the target row before any mutation. Fail closed if
  // the row is missing or unlinked — never trust caller-supplied subject hints.
  const { data: catRow, error: lookupErr } = await supabase
    .from('categories')
    .select('subject_id')
    .eq('id', categoryId)
    .single();

  if (lookupErr || !catRow?.subject_id) {
    return { success: false, error: 'Unauthorized.' };
  }

  const auth = await requireSubjectAdmin(catRow.subject_id);
  if (!auth) {
    return { success: false, error: 'Unauthorized.' };
  }

  const { error } = await supabase
    .from('categories')
    .update({ name: newName.trim() })
    .eq('id', categoryId);

  if (error) return { success: false, error: error.message };

  revalidateTag('categories');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function deleteSubjectCategory(categoryId: string) {
  if (!categoryId) return { success: false, error: 'Unauthorized.' };

  const supabase = createAdminClient();

  // Resolve subject_id from the row, then verify the admin manages it.
  const { data: catRow, error: lookupErr } = await supabase
    .from('categories')
    .select('subject_id')
    .eq('id', categoryId)
    .single();

  if (lookupErr || !catRow?.subject_id) {
    return { success: false, error: 'Unauthorized.' };
  }

  const auth = await requireSubjectAdmin(catRow.subject_id);
  if (!auth) {
    return { success: false, error: 'Unauthorized.' };
  }

  const { count } = await supabase
    .from('resources')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete: category has ${count} resource${count > 1 ? 's' : ''}. Move or delete them first.`,
    };
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) return { success: false, error: error.message };

  revalidateTag('categories');
  revalidateTag('resources');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function quickSetupSubjectPortal(
  subjectId: string,
  portalRouteSegment: string,
): Promise<{ success: true; created: number } | { success: false; error: string }> {
  if (!PORTAL_ROUTE_SEGMENTS.has(portalRouteSegment)) {
    return { success: false, error: 'Invalid subject portal.' };
  }

  const auth = await requireSubjectAdmin(subjectId);
  if (!auth) {
    return { success: false, error: 'Not authorised for this subject.' };
  }

  const portal = ADMIN_PORTALS.find((p) => p.routeSegment === portalRouteSegment);
  if (!portal) {
    return { success: false, error: 'Invalid subject portal.' };
  }

  const supabase = createAdminClient();
  const portalSubjectId = await resolveDisciplineSubjectIdForPortal(supabase, portal);
  if (!portalSubjectId || portalSubjectId !== subjectId) {
    return {
      success: false,
      error: 'This dashboard subject does not match the portal route. Open the correct subject admin.',
    };
  }

  const result = await provisionSubjectPortal(supabase, portalRouteSegment);
  if (!result.success) {
    return { success: false, error: result.error ?? 'Provisioning failed.' };
  }

  const { data: verificationRows, error: verificationError } = await supabase
    .from('categories')
    .select('id')
    .eq('subject_id', subjectId)
    .limit(1);

  if (verificationError) {
    return { success: false, error: verificationError.message };
  }
  if (!verificationRows || verificationRows.length === 0) {
    return { success: false, error: 'Quick setup ran but no categories were found for this subject.' };
  }

  const { count: missingSyllabusCount, error: missingSyllabusErr } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', subjectId)
    .is('syllabus_id', null);

  if (missingSyllabusErr) {
    return { success: false, error: missingSyllabusErr.message };
  }
  if ((missingSyllabusCount ?? 0) > 0) {
    return {
      success: false,
      error:
        'Quick setup failed integrity check: one or more categories were created without syllabus_id. Run DB migrations and reprovision this subject.',
    };
  }

  revalidateTag('categories');
  revalidateTag('resources');
  revalidatePath(`/admin/${portalRouteSegment}`);
  revalidatePath(`/admin/${portalRouteSegment}/categories`);
  revalidatePath('/', 'layout');
  return { success: true, created: result.categoriesCreated ?? 0 };
}
