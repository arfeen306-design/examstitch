import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSession } from '@/lib/supabase/guards';
import { FileText, Video, BookOpen, TrendingUp, Database } from 'lucide-react';
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
    const session = await getAdminSession();
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="rounded-xl border border-slate-600/40 bg-slate-950/35 backdrop-blur-md p-6 text-left shadow-inner">
          <div className="flex items-center gap-2 text-amber-400/90 mb-2">
            <Database className="w-5 h-5 shrink-0" aria-hidden />
            <h2 className="text-lg font-semibold text-slate-100">Computer Science is not in the database yet</h2>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Expected slug <code className="text-amber-200/90 bg-slate-900/60 px-1.5 py-0.5 rounded text-xs font-mono">computer-science</code> in{' '}
            <code className="text-slate-300 text-xs font-mono">public.subjects</code>.
          </p>
          {session?.isSuperAdmin ? (
            <Link
              href="/admin/super"
              className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border border-amber-500/50 text-amber-200 bg-transparent hover:bg-amber-500/10 transition"
            >
              Open Super Admin
            </Link>
          ) : (
            <p className="mt-6 text-xs text-slate-500">Ask a super admin to run migrations or create the CS subject.</p>
          )}
        </div>
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
