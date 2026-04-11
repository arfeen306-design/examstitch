'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { isStudentAccountAdminRole } from '@/lib/admin/student-account-role';
import { requireSuperAdmin } from '@/lib/supabase/guards';

function mapTutorDbError(error: { message: string; code?: string }): string {
  const m = error.message ?? '';
  if (/does not exist|schema cache|Could not find the table/i.test(m)) {
    return 'Tutor storage is not set up on this database. Apply the Supabase migration that creates public.tutors, then try again.';
  }
  if (error.code === '23505' || /duplicate key|unique constraint/i.test(m)) {
    return 'A tutor with this slug already exists. Change the slug or edit the existing profile.';
  }
  return m || 'Database error.';
}

export interface TutorPayload {
  id?: string;
  full_name: string;
  slug: string;
  thumbnail_url: string;
  hook_intro: string;
  detailed_bio: string;
  video_intro_url: string;
  video_demo_url: string;
  specialties: string[];
  locations: string[];
  is_verified: boolean;
}

function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function upsertTutorProfile(payload: TutorPayload) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const supabase = createAdminClient();

  if (!payload.full_name.trim()) return { success: false, error: 'Full name is required.' };
  const slug = normalizeSlug(payload.slug || payload.full_name);
  if (!slug) return { success: false, error: 'Slug is required.' };

  const row = {
    full_name: payload.full_name.trim(),
    slug,
    thumbnail_url: payload.thumbnail_url.trim() || null,
    hook_intro: payload.hook_intro.trim() || null,
    detailed_bio: payload.detailed_bio.trim() || null,
    video_intro_url: payload.video_intro_url.trim() || null,
    video_demo_url: payload.video_demo_url.trim() || null,
    specialties: payload.specialties,
    locations: payload.locations,
    is_verified: payload.is_verified,
  };

  if (payload.id) {
    const { error } = await supabase.from('tutors').update(row).eq('id', payload.id);
    if (error) return { success: false, error: mapTutorDbError(error) };
  } else {
    const { error } = await supabase.from('tutors').insert(row);
    if (error) return { success: false, error: mapTutorDbError(error) };
  }

  revalidatePath('/admin/super');
  revalidatePath('/tutors');
  revalidatePath(`/tutors/${slug}`);
  return { success: true };
}

export async function deleteTutorProfile(tutorId: string) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const supabase = createAdminClient();

  await supabase.from('student_accounts').update({ tutor_id: null }).eq('tutor_id', tutorId);
  const { error } = await supabase.from('tutors').delete().eq('id', tutorId);
  if (error) return { success: false, error: mapTutorDbError(error) };

  revalidatePath('/admin/super');
  revalidatePath('/tutors');
  return { success: true };
}

export async function assignTutorToAdminUser(userId: string, tutorId: string | null) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const supabase = createAdminClient();

  const { data: adminUser, error: adminErr } = await supabase
    .from('student_accounts')
    .select('id, role')
    .eq('id', userId)
    .single();
  if (adminErr || !adminUser) return { success: false, error: 'Admin user not found.' };
  if (!isStudentAccountAdminRole(adminUser.role)) return { success: false, error: 'Tutor can only be assigned to sub-admin users.' };

  if (tutorId) {
    const { data: tutor, error: tutorErr } = await supabase
      .from('tutors')
      .select('id')
      .eq('id', tutorId)
      .single();
    if (tutorErr || !tutor) return { success: false, error: 'Tutor profile not found.' };
  }

  const { error } = await supabase
    .from('student_accounts')
    .update({ tutor_id: tutorId })
    .eq('id', userId);
  if (error) return { success: false, error: mapTutorDbError(error) };

  revalidatePath('/admin/super');
  revalidatePath('/tutors');
  return { success: true };
}
