import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { revokeAdminSession } from '@/lib/admin/session-token';
import { invalidateAdminRoleCache } from '@/lib/admin/middleware-role-cache';

export async function POST() {
  try {
    const cookieStore = cookies();

    // Server-side revoke first — even if anything below errors, the session row
    // is gone, so middleware will reject this token immediately.
    const sessionToken = cookieStore.get('admin_session')?.value;
    if (sessionToken) {
      await revokeAdminSession(sessionToken);
      invalidateAdminRoleCache(sessionToken);
    }

    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    // Sign out of Supabase (clears auth cookies via setAll)
    await supabase.auth.signOut();

    // Clear admin cookies
    cookieStore.delete('admin_session');
    cookieStore.delete('admin_mode');
    cookieStore.delete('admin_landing');
    cookieStore.delete('admin_subjects');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/logout] Error:', err);
    return NextResponse.json({ error: 'Logout failed.' }, { status: 500 });
  }
}
