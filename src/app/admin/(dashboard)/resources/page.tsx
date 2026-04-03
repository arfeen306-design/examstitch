import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import ResourceGridClient from './ResourceGridClient';
import BulkUploadPreview from './BulkUploadPreview';

export const dynamic = 'force-dynamic';

export default async function AdminResourcesPage() {
  const supabase = createAdminClient();

  // Get admin profile for subject filtering
  const cookieStore = await cookies();
  const adminId = cookieStore.get('admin_session')?.value;
  let isSuperAdmin = false;
  let managedSubjects: string[] = [];

  if (adminId) {
    const { data: profile } = await supabase
      .from('student_accounts')
      .select('is_super_admin, managed_subjects')
      .eq('id', adminId)
      .single();
    isSuperAdmin = profile?.is_super_admin ?? false;
    managedSubjects = (profile?.managed_subjects as string[]) ?? [];
  }

  // Fetch resources — super admins see all, subject admins see their subjects
  let query = supabase
    .from('resources')
    .select(`
      *,
      category:categories(id, name, slug, parent_id)
    `)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (!isSuperAdmin && managedSubjects.length > 0) {
    query = query.in('subject_id', managedSubjects);
  } else if (!isSuperAdmin) {
    // Fallback: show Maths resources for legacy admins without managed_subjects
    query = query.or('subject.ilike.%math%,subject.ilike.%4024%,subject.ilike.%9709%');
  }

  const { data: resources, error } = await query;

  if (error) {
    console.error('Failed to fetch admin resources', error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Resource Management</h2>
        <p className="text-sm text-white/40 mt-1">
          {isSuperAdmin
            ? 'Manage all resources across all subjects.'
            : 'Manage resources for your assigned subjects.'}
        </p>
      </div>

      <div className="rounded-2xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Bulk JSON Upload</h3>
        <BulkUploadPreview />
      </div>

      <div className="rounded-2xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
          Live Database Records
          <span className="ml-2 text-xs font-normal text-white/30">({(resources || []).length} total)</span>
        </h3>
        <ResourceGridClient initialResources={resources || []} />
      </div>
    </div>
  );
}
