import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { getRouteForSlug } from '@/config/taxonomy';
import { isStudentAccountAdminRole } from '@/lib/admin/student-account-role';
import { issueAdminSession } from '@/lib/admin/session-token';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 },
      );
    }

    const cookieStore = cookies();

    // Supabase client that writes auth tokens into response cookies
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

    if (profileError || !profile || !isStudentAccountAdminRole(profile.role)) {
      // Revoke Supabase session immediately — non-admin must not retain tokens.
      // Use the same generic error as bad-password to avoid leaking role info.
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 },
      );
    }

    // ── Step 3: Mint an opaque admin session token ───────────────────────────
    // Replaces the legacy "cookie value = user.id" pattern. This token is the
    // primary key in admin_sessions and can be revoked instantly on demotion.
    const userAgent = request.headers.get('user-agent') ?? null;
    const { token: sessionToken } = await issueAdminSession({
      userId: authData.user.id,
      userAgent,
    });

    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week — server can revoke earlier via DB row delete
    });

    // ── Step 4: Compute one-shot redirect target (not durable state) ─────────
    let redirectTo = '/admin';
    const managedSubjects = (profile.managed_subjects as string[]) ?? [];

    if (profile.is_super_admin) {
      redirectTo = '/admin/super';
    } else if (managedSubjects.length > 0) {
      const { data: subjectRows } = await adminSupabase
        .from('subjects')
        .select('slug')
        .in('id', managedSubjects);
      const firstSlug = subjectRows?.[0]?.slug;
      if (firstSlug) {
        const route = getRouteForSlug(firstSlug);
        if (route) redirectTo = `/admin/${route}`;
      }
    }

    // Client-readable flag so front-end components can hide lock badges.
    // NOT a security gate — actual content gating uses the opaque admin_session
    // cookie + DB role lookup.
    cookieStore.set('admin_mode', '1', {
      httpOnly: false,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    // NOTE: We deliberately no longer set `admin_landing` or `admin_subjects`
    // cookies. Middleware now reads role + managed_subjects from the live DB
    // (cached 60s) so demotion takes effect within one TTL — not 7 days.
    // The redirectTo response field below is a one-shot hint, not durable state.

    return NextResponse.json({ success: true, redirectTo });
  } catch (err) {
    console.error('[admin/login] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
