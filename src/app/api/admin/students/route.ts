import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generatePassword, hashPassword } from '@/lib/password';
import { isStudentAccountAdminRole } from '@/lib/admin/student-account-role';
import { getAdminSession } from '@/lib/supabase/guards';
import { withApiHandler, ApiError, unauthorized, badRequest } from '@/lib/api/handler';

// POST — Create a new student account with auto-generated password
export const POST = withApiHandler(async (request) => {
  const session = await getAdminSession();
  if (!session) unauthorized();

  const { full_name, email, level } = (await request.json()) as {
    full_name?: string;
    email?: string;
    level?: string;
  };

  if (!full_name?.trim()) badRequest('Name is required.');
  if (!email?.trim()) badRequest('Email is required.');
  if (!level?.trim()) badRequest('Level is required.');

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('student_accounts')
    .select('id')
    .eq('email', email!.trim().toLowerCase())
    .single();

  if (existing) {
    throw new ApiError('conflict', 'A student with this email already exists.');
  }

  const password = generatePassword();
  const salt = crypto.randomUUID();
  const password_hash = await hashPassword(password, salt);

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: email!.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name!.trim(), role: 'student' },
  });

  if (authError || !authUser?.user) {
    throw new ApiError('internal', 'Failed to create student auth account.', authError);
  }

  const { data: student, error } = await supabase
    .from('student_accounts')
    .insert({
      id: authUser.user.id,
      full_name: full_name!.trim(),
      email: email!.trim().toLowerCase(),
      level,
      role: 'student',
      password_hash,
      salt,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) {
    throw new ApiError('internal', 'Failed to create student.', error);
  }

  return NextResponse.json({ student, password });
});

// PATCH — Update student (toggle active, reset password)
export const PATCH = withApiHandler(async (request) => {
  const session = await getAdminSession();
  if (!session) unauthorized();

  const body = (await request.json()) as {
    id: string;
    is_active?: boolean;
    reset_password?: boolean;
  };

  if (!body.id) badRequest('Student ID is required.');

  const supabase = createAdminClient();
  const { data: account } = await supabase
    .from('student_accounts')
    .select('role')
    .eq('id', body.id)
    .single();

  if (!account || isStudentAccountAdminRole(account.role)) {
    throw new ApiError('forbidden', 'Only student accounts can be changed here.');
  }

  if (body.reset_password) {
    const password = generatePassword();
    const salt = crypto.randomUUID();
    const password_hash = await hashPassword(password, salt);

    const { error } = await supabase
      .from('student_accounts')
      .update({ password_hash, salt })
      .eq('id', body.id);

    if (error) throw new ApiError('internal', 'Failed to reset password.', error);

    await supabase.auth.admin.updateUserById(body.id, { password }).catch(() => {});

    return NextResponse.json({ success: true, password });
  }

  if (typeof body.is_active === 'boolean') {
    const { error } = await supabase
      .from('student_accounts')
      .update({ is_active: body.is_active })
      .eq('id', body.id);

    if (error) throw new ApiError('internal', 'Failed to update student.', error);
    return NextResponse.json({ success: true });
  }

  badRequest('No valid action provided.');
});

// DELETE — Remove a student account
export const DELETE = withApiHandler(async (request) => {
  const session = await getAdminSession();
  if (!session) unauthorized();

  const { id } = (await request.json()) as { id: string };
  if (!id) badRequest('Student ID is required.');

  const supabase = createAdminClient();
  const { data: account } = await supabase
    .from('student_accounts')
    .select('role')
    .eq('id', id)
    .single();

  if (!account || isStudentAccountAdminRole(account.role)) {
    throw new ApiError('forbidden', 'Only student accounts can be deleted here.');
  }

  const { error } = await supabase.from('student_accounts').delete().eq('id', id);
  if (error) throw new ApiError('internal', 'Failed to delete student.', error);

  await supabase.auth.admin.deleteUser(id).catch(() => {});
  return NextResponse.json({ success: true });
});
