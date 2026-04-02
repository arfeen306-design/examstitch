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
    const isValid = await verifyPassword(password, student.salt, student.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 },
      );
    }

    // ── Step 3: Ensure a Supabase Auth user exists (lazy migration) ─────────
    // Students created before this fix won't have an Auth user. We create one
    // on first successful login so middleware/session guards work correctly.
    const { data: existingAuth } = await admin.auth.admin.getUserById(student.id);

    if (!existingAuth?.user) {
      // No auth user with this ID — check by email
      const { data: byEmail } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      const emailMatch = byEmail?.users?.find(u => u.email === normalizedEmail);

      if (emailMatch) {
        // Auth user exists with different ID — update password and remap
        await admin.auth.admin.updateUserById(emailMatch.id, { password });
        // Update student_accounts to use the auth user's ID
        await admin
          .from('student_accounts')
          .update({ id: emailMatch.id })
          .eq('id', student.id);
        student.id = emailMatch.id;
      } else {
        // Create a brand-new Supabase Auth user with the student's ID
        const { data: newAuth, error: createError } = await admin.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: { full_name: student.full_name, role: 'student' },
        });

        if (createError || !newAuth?.user) {
          console.error('[student-login] Failed to create auth user:', createError);
          return NextResponse.json(
            { error: 'Login system error. Please try again.' },
            { status: 500 },
          );
        }

        // Update student_accounts.id to match the auth user's UUID
        if (newAuth.user.id !== student.id) {
          await admin
            .from('student_accounts')
            .update({ id: newAuth.user.id })
            .eq('id', student.id);
          student.id = newAuth.user.id;
        }
      }
    } else {
      // Auth user exists — ensure password is in sync
      await admin.auth.admin.updateUserById(student.id, { password });
    }

    // ── Step 4: Sign in via cookie-writing server client ────────────────────
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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      console.error('[student-login] Supabase sign-in failed:', signInError);
      return NextResponse.json(
        { error: 'Login failed. Please try again.' },
        { status: 500 },
      );
    }

    // ── Step 5: Update last_login timestamp ─────────────────────────────────
    await admin
      .from('student_accounts')
      .update({ last_login: new Date().toISOString() })
      .eq('id', student.id);

    // ── Step 6: Determine redirect ──────────────────────────────────────────
    const redirectTo = student.level ? '/dashboard' : '/';

    return NextResponse.json({ success: true, redirectTo });
  } catch (err) {
    console.error('[student-login] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
