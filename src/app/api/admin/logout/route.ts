import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/logout] Error:', err);
    return NextResponse.json({ error: 'Logout failed.' }, { status: 500 });
  }
}
