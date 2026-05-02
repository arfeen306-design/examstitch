/**
 * middleware-role-cache.ts — Edge-runtime-safe 60s role cache.
 *
 * Validates admin tokens on every /admin/* request. Caches the result for 60
 * seconds so we don't pound the DB, while still revoking demoted admins
 * within one TTL cycle (vs. the old 7-day cookie window).
 *
 * Edge runtime constraint: only standard Web APIs (Map, fetch). We do NOT
 * import next/headers, fs, or anything Node-specific here. The Supabase admin
 * client is fetch-based and runs fine at the Edge.
 *
 * AUDIT_REPORT.md → Finding C-10.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { isStudentAccountAdminRole } from '@/lib/admin/student-account-role';
import { getAllowedRouteSegments } from '@/config/taxonomy';

const TTL_MS = 60 * 1000;

export interface CachedAdminRole {
  userId: string;
  role: string;
  isSuperAdmin: boolean;
  managedSubjectIds: string[];
  /** Pre-computed admin route segments the user can access. */
  routeSegments: string[];
  /** Epoch ms when this entry was minted. */
  cachedAt: number;
}

const cache = new Map<string, CachedAdminRole>();

/**
 * Resolve an admin_session opaque token → cached role snapshot.
 * Returns null on token miss, expired session, or non-admin role.
 */
export async function resolveAdminRoleForMiddleware(token: string): Promise<CachedAdminRole | null> {
  if (!token) return null;

  const cached = cache.get(token);
  if (cached && Date.now() - cached.cachedAt < TTL_MS) {
    return cached;
  }

  const role = await fetchAdminRole(token);
  if (role) {
    cache.set(token, role);
  } else {
    // Negative result: clear any stale entry so we don't keep returning it.
    cache.delete(token);
  }
  return role;
}

async function fetchAdminRole(token: string): Promise<CachedAdminRole | null> {
  const admin = createAdminClient();

  // 1. token → admin_sessions row
  const { data: session, error: sErr } = await admin
    .from('admin_sessions')
    .select('user_id, expires_at')
    .eq('token', token)
    .single();

  if (sErr || !session) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) return null;

  // 2. user_id → student_accounts (live role + managed_subjects)
  const { data: profile, error: pErr } = await admin
    .from('student_accounts')
    .select('id, role, is_super_admin, managed_subjects')
    .eq('id', session.user_id)
    .single();

  if (pErr || !profile) return null;
  if (!isStudentAccountAdminRole(profile.role)) return null;

  // 3. Resolve managed subject UUIDs → DB slugs → portal route segments,
  //    so middleware can answer "is this admin allowed on /admin/<segment>?".
  const managedSubjectIds: string[] = (profile.managed_subjects as string[]) ?? [];
  let slugs: string[] = [];
  if (!profile.is_super_admin && managedSubjectIds.length > 0) {
    const { data: rows } = await admin
      .from('subjects')
      .select('slug')
      .in('id', managedSubjectIds);
    slugs = (rows ?? []).map((r) => r.slug as string);
  }

  const routeSegments = profile.is_super_admin
    ? [] // super admins are checked separately and bypass per-portal lists
    : Array.from(getAllowedRouteSegments(slugs));

  return {
    userId: profile.id,
    role: profile.role,
    isSuperAdmin: profile.is_super_admin ?? false,
    managedSubjectIds,
    routeSegments,
    cachedAt: Date.now(),
  };
}

/**
 * Pure check used by middleware after resolveAdminRoleForMiddleware.
 * Kept separate so callers can express intent ("is the cached snapshot still
 * an admin?") without re-implementing the role string check.
 */
export function isStillAdmin(role: CachedAdminRole | null): boolean {
  if (!role) return false;
  return isStudentAccountAdminRole(role.role);
}

/** Invalidate cache entry — used by logout and role mutations. */
export function invalidateAdminRoleCache(token: string): void {
  cache.delete(token);
}
