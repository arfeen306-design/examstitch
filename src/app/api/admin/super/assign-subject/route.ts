import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/supabase/guards';
import { isStudentAccountAdminRole } from '@/lib/admin/student-account-role';

// ── POST /api/admin/super/assign-subject — Assign subject to an admin ───────
export async function POST(request: Request) {
  try {
    const session = await requireSuperAdmin();
    if (!session) return NextResponse.json({ error: 'Super-admin access required.' }, { status: 403 });

    const { user_id, subject_id } = await request.json() as {
      user_id?: string;
      subject_id?: string;
    };

    if (!user_id?.trim()) return NextResponse.json({ error: 'user_id is required.' }, { status: 400 });
    if (!subject_id?.trim()) return NextResponse.json({ error: 'subject_id is required.' }, { status: 400 });

    const supabase = createAdminClient();

    // Verify the subject exists
    const { data: subject } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('id', subject_id)
      .single();

    if (!subject) return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });

    // Verify the target user exists and is an admin
    const { data: targetUser } = await supabase
      .from('student_accounts')
      .select('id, email, role, managed_subjects')
      .eq('id', user_id)
      .single();

    if (!targetUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    if (!isStudentAccountAdminRole(targetUser.role)) {
      return NextResponse.json({ error: 'Target user must have admin role.' }, { status: 400 });
    }

    // Append subject_id if not already present
    const current: string[] = (targetUser.managed_subjects as string[]) ?? [];
    if (current.includes(subject_id)) {
      return NextResponse.json({
        message: `${targetUser.email} already manages ${subject.name}.`,
        managed_subjects: current,
      });
    }

    const updated = [...current, subject_id];
    const { error } = await supabase
      .from('student_accounts')
      .update({ managed_subjects: updated })
      .eq('id', user_id);

    if (error) {
      console.error('[super/assign-subject] Update error:', error);
      return NextResponse.json({ error: 'Failed to assign subject.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${subject.name} assigned to ${targetUser.email}.`,
      managed_subjects: updated,
    });
  } catch (err) {
    console.error('[super/assign-subject] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
