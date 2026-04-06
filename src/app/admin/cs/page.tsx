import { createAdminClient } from '@/lib/supabase/admin';
import { FileText, Video, BookOpen, TrendingUp } from 'lucide-react';
import CSResourceTable from './CSResourceTable';

export const dynamic = 'force-dynamic';

export default async function CSAdminPage() {
  const supabase = createAdminClient();

  // Resolve CS subject_id
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, levels')
    .eq('slug', 'computer-science')
    .single();

  if (!subject) {
    return (
      <div className="text-center py-20 text-[var(--text-muted)]">
        <p className="text-lg font-medium">Computer Science subject not configured.</p>
        <p className="text-sm mt-2">Run the database migration to set up the subjects table.</p>
      </div>
    );
  }

  // Fetch all CS resources with full fields needed by SubjectResourceManager
  const { data: resources, count } = await supabase
    .from('resources')
    .select('*, category:categories(id, name, slug)', { count: 'exact' })
    .eq('subject_id', subject.id)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  const csResources = (resources ?? []) as any[];
  const totalCount = count ?? 0;

  const pdfCount = csResources.filter(r => r.content_type === 'pdf').length;
  const videoCount = csResources.filter(r => r.content_type === 'video').length;
  const worksheetCount = csResources.filter(r => r.content_type === 'worksheet').length;

  const stats = [
    { label: 'Total CS Resources', value: totalCount.toString(), icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
    { label: 'Videos', value: videoCount.toString(), icon: Video, color: 'text-blue-400', bg: 'bg-blue-500/15' },
    { label: 'PDFs', value: pdfCount.toString(), icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { label: 'Worksheets', value: worksheetCount.toString(), icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/15' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Computer Science Dashboard</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Manage resources for {subject.levels?.join(', ')} levels.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm flex items-center gap-4">
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

      {/* CS Resource Manager — single consolidated manager */}
      <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-subtle)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">CS Resource Manager</h3>
        <CSResourceTable
          initialResources={csResources}
          subjectId={subject.id}
        />
      </div>
    </div>
  );
}
