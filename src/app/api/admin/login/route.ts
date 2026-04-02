import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 },
      );
    }

    const cookieStore = cookies();

    // Supabase client that writes auth tokens into response cookies
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

    // ── Step 1: Authenticate with Supabase Auth ──────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 },
      );
    }

    // ── Step 2: Verify admin role (service-role bypasses RLS) ────────────────
    const adminSupabase = createAdminClient();
    const { data: profile, error: profileError } = await adminSupabase
      .from('student_accounts')
      .select('role, is_super_admin, managed_subjects')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      // Revoke session immediately — non-admin must not retain tokens
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 },
      );
    }

    // ── Step 3: Set admin session cookie (value = user ID for middleware) ─────
    cookieStore.set('admin_session', authData.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // ── Step 4: Determine smart redirect based on role ───────────────────────
    let redirectTo = '/admin';
    if (profile.is_super_admin) {
      redirectTo = '/admin/super';
    } else {
      // Resolve subject slugs to determine the right dashboard
      const subjects = (profile.managed_subjects as string[]) ?? [];
      if (subjects.length > 0) {
        const { data: subjectRows } = await adminSupabase
          .from('subjects')
          .select('slug')
          .in('id', subjects);
        const slugs = subjectRows?.map(s => s.slug) ?? [];

        if (slugs.length === 1 && slugs[0] === 'computer-science') {
          redirectTo = '/admin/cs';
        }
        // Default /admin for Maths-only or multi-subject admins
      }
    }

    return NextResponse.json({ success: true, redirectTo });
  } catch (err) {
    console.error('[admin/login] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
