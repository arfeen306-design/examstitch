'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/supabase/guards';
import { revalidatePath } from 'next/cache';

const PAGE_TARGETS = ['home', 'blog', 'pre-o-level'] as const;

export async function getMediaWidgets() {
  const session = await requireSuperAdmin();
  if (!session) return { success: false as const, error: 'Unauthorized' };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('media_widgets')
    .select('*')
    .order('page_slug')
    .order('section_order', { ascending: true });

  if (error) return { success: false as const, error: error.message };
  return { success: true as const, data: data ?? [] };
}

export async function createMediaWidget(payload: {
  page_slug: string;
  media_type: 'youtube' | 'pdf';
  title: string;
  url: string;
  permissions: { allow_print: boolean; allow_download: boolean };
}) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false as const, error: 'Unauthorized' };

  if (!payload.title.trim() || !payload.url.trim()) {
    return { success: false as const, error: 'Title and URL are required.' };
  }

  // Auto-extract YouTube video ID if full URL is pasted
  let processedUrl = payload.url.trim();
  if (payload.media_type === 'youtube') {
    const match = processedUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&#?\s]+)/
    );
    if (match) processedUrl = match[1];
  }

  const supabase = createAdminClient();

  // Determine next section_order for this page
  const { data: existing } = await supabase
    .from('media_widgets')
    .select('section_order')
    .eq('page_slug', payload.page_slug)
    .order('section_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].section_order + 1 : 0;

  const { error } = await supabase.from('media_widgets').insert({
    page_slug: payload.page_slug,
    section_order: nextOrder,
    media_type: payload.media_type,
    title: payload.title.trim(),
    url: processedUrl,
    permissions: payload.permissions,
  });

  if (error) return { success: false as const, error: error.message };

  revalidatePath('/admin/super');
  revalidatePath('/');
  revalidatePath('/pre-olevel');
  revalidatePath('/blog');
  return { success: true as const };
}

export async function deleteMediaWidget(widgetId: string) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false as const, error: 'Unauthorized' };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('media_widgets')
    .delete()
    .eq('id', widgetId);

  if (error) return { success: false as const, error: error.message };

  revalidatePath('/admin/super');
  revalidatePath('/');
  revalidatePath('/pre-olevel');
  revalidatePath('/blog');
  return { success: true as const };
}

export async function toggleMediaWidget(widgetId: string, isActive: boolean) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false as const, error: 'Unauthorized' };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('media_widgets')
    .update({ is_active: isActive })
    .eq('id', widgetId);

  if (error) return { success: false as const, error: error.message };

  revalidatePath('/admin/super');
  revalidatePath('/');
  revalidatePath('/pre-olevel');
  revalidatePath('/blog');
  return { success: true as const };
}
