'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { MODULE_TYPES } from '@/lib/constants';

async function getCSSubjectId(): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('subjects')
    .select('id')
    .eq('slug', 'computer-science')
    .single();
  return data?.id ?? null;
}

/** Revalidate all CS-related public + admin paths */
function revalidateCSPaths() {
  revalidateTag('resources');
  revalidatePath('/admin/cs');
  revalidatePath('/olevel/[subject]/[grade]/video-lectures', 'page');
  revalidatePath('/olevel/[subject]/[grade]/past-papers', 'page');
  revalidatePath('/olevel/[subject]/[grade]/topical', 'page');
  revalidatePath('/alevel/[subject]/as-level/[paper]/video-lectures', 'page');
  revalidatePath('/alevel/[subject]/as-level/[paper]/past-papers', 'page');
  revalidatePath('/alevel/[subject]/a2-level/[paper]/video-lectures', 'page');
  revalidatePath('/alevel/[subject]/a2-level/[paper]/past-papers', 'page');
}

/** Verify a resource belongs to the CS subject before mutating */
async function verifyCSOwnership(resourceId: string) {
  const csId = await getCSSubjectId();
  if (!csId) return { ok: false as const, error: 'CS subject not configured.' };

  const supabase = createAdminClient();
  const { data: resource } = await supabase
    .from('resources')
    .select('id, subject_id')
    .eq('id', resourceId)
    .single();

  if (!resource) return { ok: false as const, error: 'Resource not found.' };
  if (resource.subject_id !== csId) return { ok: false as const, error: 'Resource does not belong to CS.' };

  return { ok: true as const, csId, supabase };
}

export async function deleteCSResource(resourceId: string) {
  const check = await verifyCSOwnership(resourceId);
  if (!check.ok) return { success: false, error: check.error };

  const { error } = await check.supabase.from('resources').delete().eq('id', resourceId);
  if (error) return { success: false, error: error.message };

  revalidateCSPaths();
  return { success: true };
}

export async function createCSResource(payload: {
  title: string;
  content_type: string;
  source_type: string;
  source_url: string;
  topic?: string;
  category_id: string;
  module_type?: typeof MODULE_TYPES.VIDEO_TOPICAL | typeof MODULE_TYPES.SOLVED_PAST_PAPER;
}) {
  const csId = await getCSSubjectId();
  if (!csId) return { success: false, error: 'CS subject not configured.' };

  // Validate module_type
  const validModuleTypes = [MODULE_TYPES.VIDEO_TOPICAL, MODULE_TYPES.SOLVED_PAST_PAPER] as const;
  const moduleType = payload.module_type && validModuleTypes.includes(payload.module_type)
    ? payload.module_type
    : MODULE_TYPES.VIDEO_TOPICAL;

  const supabase = createAdminClient();

  const { data, error } = await supabase.from('resources').insert({
    title: payload.title.trim(),
    content_type: payload.content_type,
    source_type: payload.source_type,
    source_url: payload.source_url.trim(),
    topic: payload.topic?.trim() || null,
    category_id: payload.category_id,
    module_type: moduleType,
    subject: 'computer-science',
    subject_id: csId,
    is_published: true,
    is_locked: false,
    is_watermarked: false,
  }).select('*, category:categories(id, name, slug)').single();

  if (error) return { success: false, error: error.message };

  revalidateCSPaths();
  return { success: true, resource: data };
}

export async function toggleCSResourceFlag(
  resourceId: string,
  field: 'is_published' | 'is_locked' | 'is_watermarked',
  value: boolean,
) {
  const check = await verifyCSOwnership(resourceId);
  if (!check.ok) return { success: false, error: check.error };

  const { error } = await check.supabase
    .from('resources')
    .update({ [field]: value })
    .eq('id', resourceId);

  if (error) return { success: false, error: error.message };

  revalidateCSPaths();
  return { success: true };
}

export async function updateCSResource(
  resourceId: string,
  updates: { title?: string; source_url?: string; worksheet_url?: string | null; sort_order?: number | null },
) {
  const check = await verifyCSOwnership(resourceId);
  if (!check.ok) return { success: false, error: check.error };

  const { error } = await check.supabase
    .from('resources')
    .update(updates)
    .eq('id', resourceId);

  if (error) return { success: false, error: error.message };

  revalidateCSPaths();
  return { success: true };
}
