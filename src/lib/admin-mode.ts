import { cookies } from 'next/headers';

/**
 * Server-side check: returns true when the request comes from an admin.
 * Checks the httpOnly admin_session cookie first, then the client-readable
 * admin_mode flag as a fallback (survives Supabase JWT expiry).
 */
export function isAdminRequest(): boolean {
  try {
    const cookieStore = cookies();
    if (cookieStore.get('admin_session')?.value) return true;
    if (cookieStore.get('admin_mode')?.value === '1') return true;
    return false;
  } catch {
    return false;
  }
}
