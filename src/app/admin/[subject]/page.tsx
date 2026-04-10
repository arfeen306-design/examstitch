import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { ROUTE_TO_PORTAL, getPortalDbSubjectSlug } from '@/config/admin-portals';
import { FileText, Video, BookOpen, TrendingUp } from 'lucide-react';
import SubjectResourceManager from '@/components/admin/SubjectResourceManager';

export const dynamic = 'force-dynamic';

export default async function SubjectAdminPage({
  params,
}: {
  params: { subject: string };
}) {
  const portal = ROUTE_TO_PORTAL[params.subject];
  if (!portal) notFound();

  const supabase = createAdminClient();

  // Resolve the parent subject from the subjects table
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, levels')
    .eq('slug', getPortalDbSubjectSlug(portal))
    .single();

  if (!subject) {
    return (
      <div className="text-center py-20 text-[var(--text-muted)]">
        <p className="text-lg font-medium">{portal.label.replace(' Resources', '')} subject not configured.</p>
        <p className="text-sm mt-2">Run the database migration to set up the subjects table.</p>
      </div>
    );
  }

  // Fetch all resources for this subject
  const { data: resources, count } = await supabase
    .from('resources')
    .select('*, category:categories(id, name, slug)', { count: 'exact' })
    .eq('subject_id', subject.id)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  const allResources = (resources ?? []) as any[];
  const totalCount = count ?? 0;

  const pdfCount = allResources.filter(r => r.content_type === 'pdf').length;
  const videoCount = allResources.filter(r => r.content_type === 'video').length;
  const worksheetCount = allResources.filter(r => r.content_type === 'worksheet').length;

  const stats = [
    { label: 'Total Resources', value: totalCount.toString(), icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
    { label: 'Videos', value: videoCount.toString(), icon: Video, color: 'text-blue-400', bg: 'bg-blue-500/15' },
    { label: 'PDFs', value: pdfCount.toString(), icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { label: 'Worksheets', value: worksheetCount.toString(), icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/15' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          {subject.name} Dashboard
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Manage resources for {subject.levels?.join(', ')} levels.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm flex items-center gap-4"
            >
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)]">{stat.label}</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resource Manager */}
      <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-subtle)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          {subject.name} Resource Manager
        </h3>
        <SubjectResourceManager
          initialResources={allResources}
          subjectSlug={portal.taxonomyOLevelPaperSlug}
          subjectId={subject.id}
          accentColor={portal.accentColor}
          showModuleTypeFilter={true}
        />
      </div>
    </div>
  );
}
