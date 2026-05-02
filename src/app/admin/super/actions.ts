'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/supabase/guards';
import { provisionSubjectPortal } from '@/lib/db-init';
import { revalidatePath, revalidateTag } from 'next/cache';
import { PORTAL_ROUTE_SEGMENTS, SUBJECT_TAXONOMY, getPortalDbSubjectSlug } from '@/config/taxonomy';

export async function createSubject(payload: { name: string; slug: string; levels: string[] }) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, error: 'Unauthorized.' };

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

  revalidateTag('subjects');
  revalidatePath('/admin/super');
  revalidatePath('/olevel', 'page');
  revalidatePath('/alevel', 'page');
  return { success: true };
}

export async function assignSubjectToAdmin(userId: string, subjectId: string) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from('student_accounts')
    .select('id, managed_subjects')
    .eq('id', userId)
    .single();

  if (!user) return { success: false, error: 'User not found.' };

  // managed_subjects stores UUIDs from public.subjects.
  const { data: subjectExists } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', subjectId)
    .single();
  if (!subjectExists) return { success: false, error: 'Invalid subject selected.' };

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
  const session = await requireSuperAdmin();
  if (!session) return { success: false, error: 'Unauthorized.' };

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
  const session = await requireSuperAdmin();
  if (!session) return { success: false, error: 'Unauthorized.' };

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
  const session = await requireSuperAdmin();
  if (!session) return { success: false, error: 'Unauthorized.' };

  // Self-delete is irrecoverable from the current session — block it.
  if (session.userId === userId) {
    return { success: false, error: 'You cannot delete your own account.' };
  }

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
  const session = await requireSuperAdmin();
  if (!session) return { success: false, error: 'Unauthorized.' };

  // Block self-toggle: a super-admin cannot demote themselves (lockout risk),
  // and any non-super caller would already have been rejected above.
  if (session.userId === userId) {
    return { success: false, error: 'You cannot change your own super-admin status.' };
  }

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

  // If promoting to super admin, give access to all DB subjects (UUIDs)
  if (makeSuperAdmin) {
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id');
    if (subjectsError) return { success: false, error: subjectsError.message };
    updateData.managed_subjects = (subjects ?? []).map((s) => s.id);
  }

  const { error } = await supabase
    .from('student_accounts')
    .update(updateData)
    .eq('id', userId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/super');
  return { success: true };
}

/** Super-admin: provision syllabi + default category tree for a portal (Physics, CS, …). */
export async function provisionPortalHierarchy(portalRouteSegment: string) {
  const session = await requireSuperAdmin();
  if (!session) return { success: false as const, error: 'Unauthorized.' };
  if (!PORTAL_ROUTE_SEGMENTS.has(portalRouteSegment)) {
    return { success: false as const, error: 'Invalid portal segment.' };
  }

  const supabase = createAdminClient();
  const result = await provisionSubjectPortal(supabase, portalRouteSegment);

  if (result.success) {
    revalidatePath('/admin/super');
    revalidatePath('/admin/resources');
    revalidateTag('categories');
  }

  return result;
}

/**
 * Phase 4 Task 2: derive the seed list from SUBJECT_TAXONOMY so adding a new
 * subject (History, Business, Psychology, …) is a one-file edit. The 'maths'
 * primary slug is excluded because mathematics is seeded via a separate
 * historical path that long predates this list; it stays out to avoid double-
 * upsert conflicts. 'computer-science' similarly has its own provisioning
 * branch (provisionComputerScience). Every other subject in the taxonomy
 * comes through this seed.
 */
const DISCIPLINE_SUBJECT_SEED_EXCLUDED = new Set(['mathematics', 'computer-science']);

const DISCIPLINE_SUBJECT_SEED: { name: string; slug: string; levels: string[] }[] = Object
  .entries(SUBJECT_TAXONOMY)
  .filter(([key]) => !DISCIPLINE_SUBJECT_SEED_EXCLUDED.has(key))
  .map(([, tax]) => ({
    name: tax.name,
    // Use the canonical primary DB slug (not the URL slug or admin route segment).
    slug: getPortalDbSubjectSlug({
      routeSegment: tax.adminPortal.routeSegment,
      label: tax.adminPortal.label,
      gradient: tax.adminPortal.gradient,
      accentColor: tax.accentColor,
      dbSubjectSlugs: tax.adminPortal.dbSubjectSlugs,
      subjectPaperSlugPrefixes: tax.adminPortal.subjectPaperSlugPrefixes,
      taxonomyOLevelPaperSlug: tax.oLevelSlug,
      hasALevelSyllabus: tax.adminPortal.hasALevelSyllabus,
      active: tax.active,
    }),
    levels: tax.adminPortal.hasALevelSyllabus
      ? ['O Level', 'A Level', 'AS Level', 'A2 Level']
      : ['O Level', 'IGCSE'],
  }));

/**
 * Super-admin: upsert Physics, Chemistry, … parent rows in public.subjects
 * (same as migration 20260414). Use when the DB was never migrated remotely.
 */
export async function seedDisciplineSubjectsFromApp() {
  const session = await requireSuperAdmin();
  if (!session) return { success: false as const, error: 'Unauthorized.' };

  const supabase = createAdminClient();
  const { error } = await supabase.from('subjects').upsert(DISCIPLINE_SUBJECT_SEED, { onConflict: 'slug' });
  if (error) {
    return { success: false as const, error: error.message };
  }

  const { data: subjects, error: listErr } = await supabase.from('subjects').select('id');
  if (listErr) return { success: false as const, error: listErr.message };
  const ids = (subjects ?? []).map((s) => s.id);

  const { error: syncErr } = await supabase
    .from('student_accounts')
    .update({ managed_subjects: ids })
    .eq('is_super_admin', true);
  if (syncErr) return { success: false as const, error: syncErr.message };

  revalidatePath('/admin/super');
  revalidatePath('/admin/resources');
  revalidateTag('subjects');
  for (const seg of PORTAL_ROUTE_SEGMENTS) {
    revalidatePath(`/admin/${seg}`);
  }

  return { success: true as const };
}
