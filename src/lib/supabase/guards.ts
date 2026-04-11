/**
 * RBAC Guards — Server-side auth + subject-permission helpers.
 *
 * Used by API route handlers to enforce:
 *  - Valid Supabase session (JWT via cookie)
 *  - Admin role on student_accounts
 *  - Subject-level access via managed_subjects[]
 *  - Super-admin bypass via is_super_admin
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from './admin';
import { isStudentAccountAdminRole } from '@/lib/admin/student-account-role';

export interface AdminSession {
  userId: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  managedSubjects: string[];
}

/**
 * Verifies the current request has a valid admin session.
 * Returns the admin's profile or null if unauthorised.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = cookies();
  const adminCookie = cookieStore.get('admin_session');
  if (!adminCookie?.value) return null;

  // Verify the Supabase auth session is still valid
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* read-only in this context */ },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== adminCookie.value) return null;

  // Fetch the admin profile with subject permissions
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from('student_accounts')
    .select('id, email, role, is_super_admin, managed_subjects')
    .eq('id', user.id)
    .single();

  if (error || !profile || !isStudentAccountAdminRole(profile.role)) return null;

  return {
    userId: profile.id,
    email: profile.email,
    role: profile.role,
    isSuperAdmin: profile.is_super_admin ?? false,
    managedSubjects: (profile.managed_subjects as string[]) ?? [],
  };
}

/**
 * Verifies the caller is an admin with access to a specific subject.
 * Super-admins bypass the subject check.
 *
 * Returns the session if authorised, or null.
 */
export async function requireSubjectAdmin(
  subjectId: string,
): Promise<AdminSession | null> {
  const session = await getAdminSession();
  if (!session) return null;
  if (session.isSuperAdmin) return session;
  if (session.managedSubjects.includes(subjectId)) return session;
  return null;
}

/**
 * Verifies the caller is a super-admin.
 * Returns the session if authorised, or null.
 */
export async function requireSuperAdmin(): Promise<AdminSession | null> {
  const session = await getAdminSession();
  if (!session) return null;
  if (!session.isSuperAdmin) return null;
  return session;
}
