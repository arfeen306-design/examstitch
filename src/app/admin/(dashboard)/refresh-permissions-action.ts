'use server';

/**
 * refresh-permissions-action.ts — Force-refresh stale admin permissions.
 *
 * Phase 2.1 Task 3 (audit C-10): when a super admin changes someone's
 * managed_subjects, the affected admin's session cache is invalidated within
 * one TTL cycle (60s). This action lets that admin trigger an immediate
 * refresh themselves — useful when they're staring at "0 resources" and
 * don't want to wait.
 *
 * Effects:
 *   • Invalidates the in-memory role cache for the calling token.
 *   • Deletes any leftover legacy cookies (`admin_subjects`, `admin_landing`)
 *     that pre-Phase-2 sessions may still carry.
 *   • Revalidates the admin layout so the next render re-reads the DB.
 *
 * Returns the freshly-resolved managed_subjects so the UI can confirm.
 */

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/supabase/guards';
import { invalidateAdminRoleCache } from '@/lib/admin/middleware-role-cache';

export interface RefreshResult {
  success: boolean;
  error?: string;
  managedSubjectIds?: string[];
  isSuperAdmin?: boolean;
}

export async function refreshAdminPermissions(): Promise<RefreshResult> {
  const session = await getAdminSession();
  if (!session) {
    return { success: false, error: 'Unauthorized.' };
  }

  const jar = await cookies();

  // 1. Drop the in-memory role cache for this token so the very next
  //    middleware call re-reads from DB.
  const token = jar.get('admin_session')?.value;
  if (token) invalidateAdminRoleCache(token);

  // 2. Clear any legacy cookies that pre-Phase-2 sessions may still carry.
  //    These were eliminated at the issuing layer in Phase 2 but may persist
  //    on long-lived sessions until natural expiry.
  jar.delete('admin_subjects');
  jar.delete('admin_landing');

  // 3. Revalidate the admin layout (sidebar + header) so the redrawn frame
  //    reflects the freshly-resolved permissions.
  revalidatePath('/admin', 'layout');

  return {
    success: true,
    managedSubjectIds: session.managedSubjects,
    isSuperAdmin: session.isSuperAdmin,
  };
}
