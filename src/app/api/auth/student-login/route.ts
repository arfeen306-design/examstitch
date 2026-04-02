import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPassword } from '@/lib/password';
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

    const normalizedEmail = email.trim().toLowerCase();
    const admin = createAdminClient();

    // ── Step 1: Look up student in student_accounts ─────────────────────────
    const { data: student, error: lookupError } = await admin
      .from('student_accounts')
      .select('id, email, full_name, password_hash, salt, level, role, is_active')
      .eq('email', normalizedEmail)
      .single();

    if (lookupError || !student) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 },
      );
    }

    // Only allow students through this endpoint (admins use /api/admin/login)
    if (student.role === 'admin') {
      return NextResponse.json(
        { error: 'Please use the admin login page.' },
        { status: 403 },
      );
    }

    if (!student.is_active) {
      return NextResponse.json(
        { error: 'Your account has been disabled. Contact your tutor.' },
        { status: 403 },
      );
    }

    // ── Step 2: Verify password against custom hash ─────────────────────────
    // Guard against null/missing hash or salt
    if (!student.password_hash || !student.salt) {
      console.error('[student-login] Missing hash or salt for:', normalizedEmail);
      return NextResponse.json(
        { error: 'Account not fully set up. Ask your tutor to reset your password.' },
        { status: 400 },
      );
    }

    let isValid = false;
    try {
      isValid = await verifyPassword(password, student.salt, student.password_hash);
    } catch (hashErr) {
      console.error('[student-login] Password verification threw:', hashErr);
      return NextResponse.json(
        { error: 'Unable to verify credentials. Please try again.' },
        { status: 500 },
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 },
      );
    }

    // ── Step 3: Ensure a Supabase Auth session ──────────────────────────────
    // Custom password is verified. Now we need a Supabase Auth session so the
    // middleware can identify the user via JWT cookies.

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
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Swallow if cookies are read-only (shouldn't happen in Route Handler)
            }
          },
        },
      },
    );

    // Clear any stale session first to avoid cookie conflicts
    await supabase.auth.signOut().catch(() => {});

    // Attempt 1: sign in directly
    let session = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    // If sign-in failed, sync the Supabase Auth user and retry
    if (session.error) {
      console.log('[student-login] Initial sign-in failed for', normalizedEmail, '— syncing auth user…');

      try {
        await syncAuthUser(admin, student, normalizedEmail, password);
      } catch (syncErr) {
        console.error('[student-login] Auth sync failed:', syncErr);
        // Fall through to retry — it might still work
      }

      // Attempt 2: retry after sync
      session = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
    }

    if (session.error || !session.data?.user) {
      console.error('[student-login] Final sign-in failed:', session.error?.message);
      return NextResponse.json(
        { error: 'Unable to create session. Please try again or contact support.' },
        { status: 500 },
      );
    }

    // ── Step 4: Update last_login timestamp (non-blocking) ──────────────────
    admin
      .from('student_accounts')
      .update({ last_login: new Date().toISOString() })
      .eq('id', student.id)
      .then(() => {});

    // ── Step 5: Determine redirect ──────────────────────────────────────────
    const redirectTo = '/dashboard';

    return NextResponse.json({ success: true, redirectTo });
  } catch (err) {
    console.error('[student-login] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * Ensure a Supabase Auth user exists with the correct password.
 * Handles three cases: user exists by ID, user exists by email, or user is new.
 */
async function syncAuthUser(
  admin: ReturnType<typeof createAdminClient>,
  student: { id: string; full_name: string },
  email: string,
  password: string,
) {
  // Case 1: Auth user exists with matching student_accounts ID
  const { data: byId } = await admin.auth.admin.getUserById(student.id);
  if (byId?.user) {
    await admin.auth.admin.updateUserById(student.id, { password });
    return;
  }

  // Case 2: Auth user exists with same email but different ID
  // Use listUsers — with only 3 total users this is safe
  const { data: allUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const matchByEmail = allUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email,
  );

  if (matchByEmail) {
    // Sync password on the existing auth user
    await admin.auth.admin.updateUserById(matchByEmail.id, { password });
    return;
  }

  // Case 3: No auth user at all — create one
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: student.full_name, role: 'student' },
  });

  if (createErr) {
    console.error('[student-login] createUser failed:', createErr.message);
    // If "already exists", just try updating by email again (race condition)
    const msg = createErr.message?.toLowerCase() || '';
    if (msg.includes('already') || msg.includes('exists') || msg.includes('duplicate')) {
      // Re-fetch users — the user may have just been created
      const { data: retry } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = retry?.users?.find((u) => u.email?.toLowerCase() === email);
      if (found) {
        await admin.auth.admin.updateUserById(found.id, { password });
        return;
      }
    }
    throw createErr;
  }
}
