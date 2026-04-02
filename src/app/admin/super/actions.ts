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

// ── Create a new admin account ──────────────────────────────────────────────

export async function createAdminAccount(payload: {
  email: string;
  full_name: string;
  password: string;
  managed_subjects: string[];
  is_super_admin: boolean;
}) {
  const supabase = createAdminClient();

  if (!payload.email.trim() || !payload.full_name.trim() || !payload.password) {
    return { success: false, error: 'Email, full name, and password are required.' };
  }

  if (payload.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  // Check if email already exists in student_accounts
  const { data: existing } = await supabase
    .from('student_accounts')
    .select('id')
    .eq('email', payload.email.trim().toLowerCase())
    .single();

  if (existing) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  // Step 1: Create Supabase Auth user (service role can create users directly)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || 'Failed to create auth user.' };
  }

  // Step 2: Create student_accounts row with admin role
  const { error: profileError } = await supabase
    .from('student_accounts')
    .insert({
      id: authData.user.id,
      email: payload.email.trim().toLowerCase(),
      full_name: payload.full_name.trim(),
      role: 'admin',
      password_hash: 'MANAGED_BY_SUPABASE_AUTH',
      salt: '',
      level: '',
      is_active: true,
      is_super_admin: payload.is_super_admin,
      managed_subjects: payload.managed_subjects,
    });

  if (profileError) {
    // Rollback: delete the auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: `Profile creation failed: ${profileError.message}` };
  }

  revalidatePath('/admin/super');
  return { success: true, userId: authData.user.id };
}

// ── Delete an admin account ─────────────────────────────────────────────────

export async function deleteAdminAccount(userId: string) {
  const supabase = createAdminClient();

  // Safety: prevent deleting yourself (arfeen306)
  const { data: target } = await supabase
    .from('student_accounts')
    .select('email, is_super_admin')
    .eq('id', userId)
    .single();

  if (!target) return { success: false, error: 'Account not found.' };

  // Don't allow deleting the primary super admin
  if (target.email === 'arfeen306@gmail.com') {
    return { success: false, error: 'Cannot delete the primary super admin account.' };
  }

  // Step 1: Delete from student_accounts
  const { error: profileError } = await supabase
    .from('student_accounts')
    .delete()
    .eq('id', userId);

  if (profileError) return { success: false, error: profileError.message };

  // Step 2: Delete from Supabase Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) {
    // Non-fatal — profile already deleted, auth user is orphaned
    console.error('[deleteAdminAccount] Auth cleanup failed:', authError.message);
  }

  revalidatePath('/admin/super');
  return { success: true };
}

// ── Toggle super admin status ───────────────────────────────────────────────

export async function toggleSuperAdmin(userId: string, makeSuperAdmin: boolean) {
  const supabase = createAdminClient();

  const { data: target } = await supabase
    .from('student_accounts')
    .select('email')
    .eq('id', userId)
    .single();

  if (!target) return { success: false, error: 'Account not found.' };

  // Prevent demoting the primary super admin
  if (target.email === 'arfeen306@gmail.com' && !makeSuperAdmin) {
    return { success: false, error: 'Cannot demote the primary super admin.' };
  }

  const updateData: Record<string, unknown> = { is_super_admin: makeSuperAdmin };

  // If promoting to super admin, give access to all subjects
  if (makeSuperAdmin) {
    const { data: allSubjects } = await supabase.from('subjects').select('id');
    updateData.managed_subjects = allSubjects?.map(s => s.id) ?? [];
  }

  const { error } = await supabase
    .from('student_accounts')
    .update(updateData)
    .eq('id', userId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/super');
  return { success: true };
}
