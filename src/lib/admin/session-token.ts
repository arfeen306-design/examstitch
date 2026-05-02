/**
 * session-token.ts — Opaque admin session lifecycle helpers.
 *
 * Replaces the old "admin_session cookie value = user.id" model with
 * server-issued random tokens stored in public.admin_sessions. Logout / role
 * revocation deletes the row → instant invalidation.
 *
 * AUDIT_REPORT.md → Finding C-10.
 */

import { createAdminClient } from '@/lib/supabase/admin';

const ONE_WEEK_MS = 60 * 60 * 24 * 7 * 1000;

/** 256 bits of randomness, base64url-encoded → 43 char opaque string. */
export function generateOpaqueToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  // base64url: replace +/ with -_, drop padding
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = typeof btoa !== 'undefined'
    ? btoa(bin)
    : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface IssueAdminSessionInput {
  userId: string;
  userAgent?: string | null;
}

/**
 * Mint a new admin session row and return the opaque token.
 * The caller (login route) sets the token as the admin_session httpOnly cookie.
 */
export async function issueAdminSession({
  userId,
  userAgent,
}: IssueAdminSessionInput): Promise<{ token: string; expiresAt: Date }> {
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + ONE_WEEK_MS);

  const supabase = createAdminClient();
  const { error } = await supabase.from('admin_sessions').insert({
    token,
    user_id: userId,
    expires_at: expiresAt.toISOString(),
    user_agent: userAgent ?? null,
  });

  if (error) {
    throw new Error(`Failed to issue admin session: ${error.message}`);
  }

  return { token, expiresAt };
}

/**
 * Revoke a single admin session (logout). Idempotent.
 */
export async function revokeAdminSession(token: string): Promise<void> {
  if (!token) return;
  const supabase = createAdminClient();
  await supabase.from('admin_sessions').delete().eq('token', token);
}

/**
 * Revoke EVERY admin session for a user (e.g. on role demotion or password
 * reset). Returns the number of rows deleted.
 */
export async function revokeAllAdminSessionsForUser(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('admin_sessions')
    .delete()
    .eq('user_id', userId)
    .select('token');
  if (error) return 0;
  return data?.length ?? 0;
}

export interface AdminSessionRow {
  token: string;
  user_id: string;
  expires_at: string;
}

/**
 * Resolve a token → session row, or null if expired/missing.
 * Does NOT touch student_accounts; the caller is responsible for the role check.
 */
export async function lookupAdminSession(token: string): Promise<AdminSessionRow | null> {
  if (!token) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('admin_sessions')
    .select('token, user_id, expires_at')
    .eq('token', token)
    .single();
  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    // Stale row — best-effort GC.
    void supabase.from('admin_sessions').delete().eq('token', token);
    return null;
  }
  return data;
}
