import { cookies } from 'next/headers';

/**
 * Server-side check: returns true when the request comes from an admin
 * who logged in via /admin/login (has a valid admin_session cookie).
 * Safe to call from any Server Component or Route Handler.
 */
export function isAdminRequest(): boolean {
  try {
    const adminCookie = cookies().get('admin_session');
    return !!adminCookie?.value;
  } catch {
    return false;
  }
}
