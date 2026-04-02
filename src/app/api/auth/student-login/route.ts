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
    // Strategy: try signInWithPassword first. If it works, the auth user
    // exists and the password is correct. If it fails, create or fix the
    // auth user, then sign in again.

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

    // First attempt: sign in directly (works if auth user exists with correct password)
    let { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      // Auth user may not exist, or password may be out of sync — fix it
      const { data: existingAuth } = await admin.auth.admin.getUserById(student.id);

      if (existingAuth?.user) {
        // Auth user exists with matching ID — sync password and retry
        await admin.auth.admin.updateUserById(student.id, { password });
      } else {
        // Try to create the auth user
        const { data: newAuth, error: createError } = await admin.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: { full_name: student.full_name, role: 'student' },
        });

        if (createError) {
          // User with this email may already exist in Auth — find and update
          const errMsg = createError.message?.toLowerCase() || '';
          if (errMsg.includes('already') || errMsg.includes('exists') || errMsg.includes('duplicate')) {
            // Fetch all auth users to find by email (paginated search)
            let found = false;
            for (let page = 1; page <= 10; page++) {
              const { data: batch } = await admin.auth.admin.listUsers({ page, perPage: 100 });
              const match = batch?.users?.find(u => u.email === normalizedEmail);
              if (match) {
                await admin.auth.admin.updateUserById(match.id, { password });
                // Remap student_accounts.id if needed
                if (match.id !== student.id) {
                  await admin.from('student_accounts').update({ id: match.id }).eq('id', student.id);
                  student.id = match.id;
                }
                found = true;
                break;
              }
              if (!batch?.users?.length || batch.users.length < 100) break;
            }
            if (!found) {
              console.error('[student-login] Auth user exists but could not be found:', createError);
              return NextResponse.json(
                { error: 'Login system error. Please contact support.' },
                { status: 500 },
              );
            }
          } else {
            console.error('[student-login] Failed to create auth user:', createError);
            return NextResponse.json(
              { error: 'Login system error. Please try again.' },
              { status: 500 },
            );
          }
        } else if (newAuth?.user && newAuth.user.id !== student.id) {
          // Remap student_accounts.id to match the new auth user's UUID
          await admin.from('student_accounts').update({ id: newAuth.user.id }).eq('id', student.id);
          student.id = newAuth.user.id;
        }
      }

      // Retry sign-in after fixing the auth user
      const retry = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (retry.error) {
        console.error('[student-login] Sign-in failed after auth fix:', retry.error);
        return NextResponse.json(
          { error: 'Login failed. Please try again.' },
          { status: 500 },
        );
      }
    }

    // ── Step 4: Update last_login timestamp ─────────────────────────────────
    await admin
      .from('student_accounts')
      .update({ last_login: new Date().toISOString() })
      .eq('id', student.id);

    // ── Step 5: Determine redirect ──────────────────────────────────────────
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
