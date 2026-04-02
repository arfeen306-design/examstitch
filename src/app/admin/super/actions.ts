'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createSubject(payload: { name: string; slug: string; levels: string[] }) {
  const supabase = createAdminClient();

  if (!payload.name.trim() || !payload.slug.trim() || payload.levels.length === 0) {
    return { success: false, error: 'Name, slug, and at least one level are required.' };
  }

  // Check for duplicate slug
  const { data: existing } = await supabase
    .from('subjects')
    .select('id')
    .eq('slug', payload.slug.trim())
    .single();

  if (existing) return { success: false, error: `Subject with slug "${payload.slug}" already exists.` };

  const { error } = await supabase.from('subjects').insert({
    name: payload.name.trim(),
    slug: payload.slug.trim().toLowerCase().replace(/\s+/g, '-'),
    levels: payload.levels,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/super');
  return { success: true };
}

export async function assignSubjectToAdmin(userId: string, subjectId: string) {
  const supabase = createAdminClient();

  // Verify both exist
  const { data: user } = await supabase
    .from('student_accounts')
    .select('id, managed_subjects')
    .eq('id', userId)
    .single();

  if (!user) return { success: false, error: 'User not found.' };

  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', subjectId)
    .single();

  if (!subject) return { success: false, error: 'Subject not found.' };

  // Prevent duplicates
  const current: string[] = (user.managed_subjects as string[]) ?? [];
  if (current.includes(subjectId)) {
    return { success: false, error: 'Subject already assigned to this user.' };
  }

  const { error } = await supabase
    .from('student_accounts')
    .update({ managed_subjects: [...current, subjectId] })
    .eq('id', userId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/super');
  return { success: true };
}

export async function removeSubjectFromAdmin(userId: string, subjectId: string) {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from('student_accounts')
    .select('id, managed_subjects')
    .eq('id', userId)
    .single();

  if (!user) return { success: false, error: 'User not found.' };

  const current: string[] = (user.managed_subjects as string[]) ?? [];
  const updated = current.filter(id => id !== subjectId);

  const { error } = await supabase
    .from('student_accounts')
    .update({ managed_subjects: updated })
    .eq('id', userId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/super');
  return { success: true };
}
