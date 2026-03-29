import { createAdminClient } from '@/lib/supabase/admin';
import ResourceGridClient from './ResourceGridClient';
import BulkUploadPreview from './BulkUploadPreview';
import { Database } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function AdminResourcesPage() {
  const supabase = createAdminClient();

  // Fetch all resources with joined category data
  const { data: resources, error } = await supabase
    .from('resources')
    .select(`
      *,
      category:categories(id, name, slug, parent_id),
      exam_series:exam_series(id, year, session, variant, paper_number)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch admin resources', error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-navy-900 tracking-tight">Resource Management</h2>
        <p className="text-sm text-navy-500">Manage all past papers, video lectures, and topical worksheets here.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-navy-50">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Bulk JSON Upload</h3>
        <BulkUploadPreview />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-navy-50">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Live Database Records</h3>
        <ResourceGridClient initialResources={resources || []} />
      </div>
    </div>
  );
}
