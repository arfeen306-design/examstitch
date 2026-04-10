'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { validateCategorySlugAgainstNavigation } from '@/lib/category-slug-policy';

function normalizeCategorySlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '-');
}

export async function createSubjectCategory(payload: {
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

export async function renameCategory(categoryId: string, newName: string) {
  const supabase = createAdminClient();

  if (!newName.trim()) {
    return { success: false, error: 'Name is required.' };
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
  const supabase = createAdminClient();

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
