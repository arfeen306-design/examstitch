'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const REVALIDATE_PATHS = ['/admin/super/digital-skills', '/digital-skills'];

function revalidateAll() {
  REVALIDATE_PATHS.forEach(p => revalidatePath(p));
}

// ═══════════════════════════════════════════════════════════════════════════
// SKILLS
// ═══════════════════════════════════════════════════════════════════════════

export async function createSkill(payload: {
  name: string;
  slug: string;
  icon: string;
  description?: string;
  gradient?: string;
  glow_color?: string;
}) {
  const supabase = createAdminClient();

  if (!payload.name.trim() || !payload.slug.trim()) {
    return { success: false, error: 'Name and slug are required.' };
  }

  const slug = payload.slug.trim().toLowerCase().replace(/\s+/g, '-');

  const { data: existing } = await supabase
    .from('skills')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) return { success: false, error: `Skill with slug "${slug}" already exists.` };

  // Get max sort_order
  const { data: maxRow } = await supabase
    .from('skills')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { error } = await supabase.from('skills').insert({
    name: payload.name.trim(),
    slug,
    icon: payload.icon || 'Code2',
    description: payload.description?.trim() || null,
    gradient: payload.gradient || 'from-violet-600 to-indigo-700',
    glow_color: payload.glow_color || 'rgba(124,58,237,0.35)',
    sort_order: nextOrder,
    is_active: true,
  });

  if (error) return { success: false, error: error.message };

  revalidateAll();
  return { success: true };
}

export async function updateSkill(
  id: string,
  updates: {
    name?: string;
    icon?: string;
    description?: string;
    gradient?: string;
    glow_color?: string;
    is_active?: boolean;
    sort_order?: number;
  },
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('skills').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}

export async function deleteSkill(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('skills').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYLISTS
// ═══════════════════════════════════════════════════════════════════════════

export async function createPlaylist(payload: {
  skill_id: string;
  title: string;
  description?: string;
}) {
  const supabase = createAdminClient();

  if (!payload.title.trim()) return { success: false, error: 'Title is required.' };

  const { data: maxRow } = await supabase
    .from('skill_playlists')
    .select('sort_order')
    .eq('skill_id', payload.skill_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabase.from('skill_playlists').insert({
    skill_id: payload.skill_id,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    sort_order: (maxRow?.sort_order ?? 0) + 1,
  });

  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}

export async function updatePlaylist(
  id: string,
  updates: { title?: string; description?: string; sort_order?: number },
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('skill_playlists').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}

export async function deletePlaylist(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('skill_playlists').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// LESSONS
// ═══════════════════════════════════════════════════════════════════════════

export async function createLesson(payload: {
  playlist_id: string;
  title: string;
  video_url?: string;
  resource_url?: string;
  duration?: string;
  is_free?: boolean;
}) {
  const supabase = createAdminClient();

  if (!payload.title.trim()) return { success: false, error: 'Title is required.' };

  const { data: maxRow } = await supabase
    .from('skill_lessons')
    .select('sort_order')
    .eq('playlist_id', payload.playlist_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabase.from('skill_lessons').insert({
    playlist_id: payload.playlist_id,
    title: payload.title.trim(),
    video_url: payload.video_url?.trim() || null,
    resource_url: payload.resource_url?.trim() || null,
    duration: payload.duration?.trim() || null,
    sort_order: (maxRow?.sort_order ?? 0) + 1,
    is_free: payload.is_free ?? false,
  });

  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}

export async function updateLesson(
  id: string,
  updates: {
    title?: string;
    video_url?: string | null;
    resource_url?: string | null;
    duration?: string | null;
    sort_order?: number;
    is_free?: boolean;
  },
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('skill_lessons').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}

export async function deleteLesson(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('skill_lessons').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT ACCESS
// ═══════════════════════════════════════════════════════════════════════════

export async function grantStudentAccess(studentId: string, skillId: string, grantedBy?: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.from('student_skill_access').insert({
    student_id: studentId,
    skill_id: skillId,
    granted_by: grantedBy || null,
  });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Student already has access to this skill.' };
    return { success: false, error: error.message };
  }

  revalidateAll();
  return { success: true };
}

export async function revokeStudentAccess(studentId: string, skillId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('student_skill_access')
    .delete()
    .eq('student_id', studentId)
    .eq('skill_id', skillId);

  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}
