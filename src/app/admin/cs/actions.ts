'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath, revalidateTag } from 'next/cache';

async function getCSSubjectId(): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('subjects')
    .select('id')
    .eq('slug', 'computer-science')
    .single();
  return data?.id ?? null;
}

export async function deleteCSResource(resourceId: string) {
  const csId = await getCSSubjectId();
  if (!csId) return { success: false, error: 'CS subject not configured.' };

  const supabase = createAdminClient();

  // Verify ownership before deleting
  const { data: resource } = await supabase
    .from('resources')
    .select('id, subject_id')
    .eq('id', resourceId)
    .single();

  if (!resource) return { success: false, error: 'Resource not found.' };
  if (resource.subject_id !== csId) return { success: false, error: 'Resource does not belong to CS.' };

  const { error } = await supabase.from('resources').delete().eq('id', resourceId);
  if (error) return { success: false, error: error.message };

  revalidateTag('resources');
  revalidatePath('/admin/cs');
  return { success: true };
}

export async function createCSResource(payload: {
  title: string;
  content_type: string;
  source_type: string;
  source_url: string;
  topic?: string;
  category_id: string;
}) {
  const csId = await getCSSubjectId();
  if (!csId) return { success: false, error: 'CS subject not configured.' };

  const supabase = createAdminClient();

  const { error } = await supabase.from('resources').insert({
    title: payload.title.trim(),
    content_type: payload.content_type,
    source_type: payload.source_type,
    source_url: payload.source_url.trim(),
    topic: payload.topic?.trim() || null,
    category_id: payload.category_id,
    subject: 'computer-science',
    subject_id: csId,
    is_published: true,
    is_locked: false,
    is_watermarked: false,
  });

  if (error) return { success: false, error: error.message };

  revalidateTag('resources');
  revalidatePath('/admin/cs');
  return { success: true };
}
