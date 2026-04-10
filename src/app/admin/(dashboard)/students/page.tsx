import { createAdminClient } from '@/lib/supabase/admin';
import type { StudentAccount } from '@/lib/supabase/types';
import StudentsClient from './StudentsClient';

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
  const supabase = createAdminClient();

  const { data: students, error } = await supabase
    .from('student_accounts')
    .select('*')
    .order('role', { ascending: false })
    .order('created_at', { ascending: false });

  const rows = (students as StudentAccount[] | null) ?? [];

  return <StudentsClient rows={rows} error={error?.message} />;
}
