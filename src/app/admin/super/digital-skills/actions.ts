'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { Skill, SkillLesson, SkillPlaylist } from '@/lib/supabase/types';

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
  tagline?: string;
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

  const { data, error } = await supabase
    .from('skills')
    .insert({
      name: payload.name.trim(),
      slug,
      icon: payload.icon || 'Code2',
      tagline: payload.tagline?.trim() || null,
      description: payload.description?.trim() || null,
      gradient: payload.gradient || 'from-violet-600 to-indigo-700',
      glow_color: payload.glow_color || 'rgba(124,58,237,0.35)',
      sort_order: nextOrder,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) return { success: false, error: error.message };

  revalidateAll();
  return { success: true, skill: data as Skill };
}

export async function updateSkill(
  id: string,
  updates: {
    name?: string;
    icon?: string;
    tagline?: string;
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

  const { data, error } = await supabase
    .from('skill_playlists')
    .insert({
      skill_id: payload.skill_id,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      sort_order: (maxRow?.sort_order ?? 0) + 1,
    })
    .select('*')
    .single();

  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true, playlist: data as SkillPlaylist };
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
  notes_url?: string;
  exercises_url?: string;
  cheatsheet_url?: string;
  quiz_url?: string;
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

  const { data, error } = await supabase
    .from('skill_lessons')
    .insert({
      playlist_id: payload.playlist_id,
      title: payload.title.trim(),
      video_url: payload.video_url?.trim() || null,
      resource_url: payload.resource_url?.trim() || null,
      notes_url: payload.notes_url?.trim() || null,
      exercises_url: payload.exercises_url?.trim() || null,
      cheatsheet_url: payload.cheatsheet_url?.trim() || null,
      quiz_url: payload.quiz_url?.trim() || null,
      duration: payload.duration?.trim() || null,
      sort_order: (maxRow?.sort_order ?? 0) + 1,
      is_free: payload.is_free ?? false,
    })
    .select('*')
    .single();

  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true, lesson: data as SkillLesson };
}

export async function updateLesson(
  id: string,
  updates: {
    title?: string;
    video_url?: string | null;
    resource_url?: string | null;
    notes_url?: string | null;
    exercises_url?: string | null;
    cheatsheet_url?: string | null;
    quiz_url?: string | null;
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

// ═══════════════════════════════════════════════════════════════════════════
// REORDER
// ═══════════════════════════════════════════════════════════════════════════

export async function reorderPlaylists(ordered: { id: string; sort_order: number }[]) {
  const supabase = createAdminClient();
  for (const item of ordered) {
    const { error } = await supabase
      .from('skill_playlists')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id);
    if (error) return { success: false, error: error.message };
  }
  revalidateAll();
  return { success: true };
}

export async function reorderLessons(ordered: { id: string; sort_order: number }[]) {
  const supabase = createAdminClient();
  for (const item of ordered) {
    const { error } = await supabase
      .from('skill_lessons')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id);
    if (error) return { success: false, error: error.message };
  }
  revalidateAll();
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// FILE UPLOAD (Supabase Storage)
// ═══════════════════════════════════════════════════════════════════════════

const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50 MB

export async function uploadDigitalSkillAsset(formData: FormData) {
  const file = formData.get('file') as File | null;
  const folder = (formData.get('folder') as string) || 'cheatsheets';

  if (!file) return { success: false as const, error: 'No file provided' };

  // ── Server-side validation ──────────────────────────────────────────────
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    return { success: false as const, error: `Invalid file type: ${file.type}. Allowed: PDF, JPEG, PNG, WebP, GIF, SVG.` };
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return { success: false as const, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 50 MB.` };
  }

  const supabase = createAdminClient();

  // Generate a unique filename: folder/timestamp-originalname
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60);
  const path = `${folder}/${Date.now()}-${safeName}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('digital-skills-assets')
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[upload] Storage error:', uploadError);
    return { success: false as const, error: uploadError.message };
  }

  const SIGNED_URL_TTL_SEC = 60 * 60 * 24 * 365;
  const { data: signed, error: signError } = await supabase.storage
    .from('digital-skills-assets')
    .createSignedUrl(path, SIGNED_URL_TTL_SEC);

  if (signError || !signed?.signedUrl) {
    console.error('[upload] Signed URL error:', signError);
    return {
      success: false as const,
      error: signError?.message ?? 'Could not create signed URL for uploaded file.',
    };
  }

  revalidateAll();
  return { success: true as const, url: signed.signedUrl };
}
