import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generatePassword, hashPassword } from '@/lib/password';

// POST — Create a new student account with auto-generated password
export async function POST(request: Request) {
  try {
    const { full_name, email, level } = await request.json() as {
      full_name?: string;
      email?: string;
      level?: string;
    };

    if (!full_name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    if (!level?.trim()) return NextResponse.json({ error: 'Level is required.' }, { status: 400 });

    const supabase = createAdminClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('student_accounts')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'A student with this email already exists.' }, { status: 409 });
    }

    const password = generatePassword();
    const salt = crypto.randomUUID();
    const password_hash = await hashPassword(password, salt);

    // Create Supabase Auth user first to get a stable UUID
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim(), role: 'student' },
    });

    if (authError || !authUser?.user) {
      console.error('[admin/students] Auth user creation failed:', authError);
      return NextResponse.json({ error: 'Failed to create student auth account.' }, { status: 500 });
    }

    const { data: student, error } = await supabase
      .from('student_accounts')
      .insert({
        id: authUser.user.id,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        level,
        role: 'student',
        password_hash,
        salt,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[admin/students] Insert error:', error);
      return NextResponse.json({ error: 'Failed to create student.' }, { status: 500 });
    }

    return NextResponse.json({ student, password });
  } catch (err) {
    console.error('[admin/students] API error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PATCH — Update student (toggle active, reset password)
export async function PATCH(request: Request) {
  try {
    const body = await request.json() as {
      id: string;
      is_active?: boolean;
      reset_password?: boolean;
    };

    if (!body.id) return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: account } = await supabase
      .from('student_accounts')
      .select('role')
      .eq('id', body.id)
      .single();
    if (!account || account.role === 'admin') {
      return NextResponse.json({ error: 'Only student accounts can be changed here.' }, { status: 403 });
    }

    // Reset password
    if (body.reset_password) {
      const password = generatePassword();
      const salt = crypto.randomUUID();
      const password_hash = await hashPassword(password, salt);

      const { error } = await supabase
        .from('student_accounts')
        .update({ password_hash, salt })
        .eq('id', body.id);

      if (error) return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 });

      // Sync password to Supabase Auth (if auth user exists)
      await supabase.auth.admin.updateUserById(body.id, { password }).catch(() => {});

      return NextResponse.json({ success: true, password });
    }

    // Toggle active
    if (typeof body.is_active === 'boolean') {
      const { error } = await supabase
        .from('student_accounts')
        .update({ is_active: body.is_active })
        .eq('id', body.id);

      if (error) return NextResponse.json({ error: 'Failed to update student.' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'No valid action provided.' }, { status: 400 });
  } catch (err) {
    console.error('[admin/students] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// DELETE — Remove a student account
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json() as { id: string };
    if (!id) return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: account } = await supabase
      .from('student_accounts')
      .select('role')
      .eq('id', id)
      .single();
    if (!account || account.role === 'admin') {
      return NextResponse.json({ error: 'Only student accounts can be deleted here.' }, { status: 403 });
    }
    const { error } = await supabase.from('student_accounts').delete().eq('id', id);

    if (error) return NextResponse.json({ error: 'Failed to delete student.' }, { status: 500 });

    // Also remove the Supabase Auth user
    await supabase.auth.admin.deleteUser(id).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/students] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
