import { createAdminClient } from '@/lib/supabase/admin';
import { BarChart3, FileText, Video, TrendingUp, BookOpen, FolderOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CSAnalyticsPage() {
  const supabase = createAdminClient();

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, levels')
    .eq('slug', 'computer-science')
    .single();

  if (!subject) {
    return (
      <div className="text-center py-20 text-white/40">
        <p className="text-lg font-medium">Computer Science subject not configured.</p>
      </div>
    );
  }

  // Fetch all CS resources
  const { data: resources } = await supabase
    .from('resources')
    .select('id, title, content_type, created_at, category:categories(id, name, slug)')
    .eq('subject_id', subject.id)
    .order('created_at', { ascending: false });

  const csResources = resources ?? [];
  const total = csResources.length;

  // Content type breakdown
  const pdfCount = csResources.filter(r => r.content_type === 'pdf').length;
  const videoCount = csResources.filter(r => r.content_type === 'video').length;
  const worksheetCount = csResources.filter(r => r.content_type === 'worksheet').length;
  const otherCount = total - pdfCount - videoCount - worksheetCount;

  // Category breakdown
  const categoryMap = new Map<string, number>();
  csResources.forEach(r => {
    const catName = (r.category as { name?: string })?.name || 'Uncategorized';
    categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
  });
  const topCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Uploads over time (last 6 months)
  const now = new Date();
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    const start = d.toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    const count = csResources.filter(r => r.created_at >= start && r.created_at < end).length;
    months.push({ label, count });
  }
  const maxMonthCount = Math.max(...months.map(m => m.count), 1);

  // Recent uploads
  const recentUploads = csResources.slice(0, 5);

  const statCards = [
    { label: 'Total Resources', value: total, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'PDFs', value: pdfCount, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Videos', value: videoCount, icon: Video, color: 'text-blue-400', bg: 'bg-blue-500/15' },
    { label: 'Worksheets', value: worksheetCount, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          CS Analytics
        </h2>
        <p className="text-sm text-white/40 mt-1">
          Content overview for Computer Science · {subject.levels?.join(', ')}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-xs font-medium text-white/40 uppercase tracking-wide">{s.label}</p>
              </div>
              <p className="text-3xl font-bold text-white">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Timeline */}
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Uploads (Last 6 Months)</h3>
          <div className="flex items-end gap-2 h-32">
            {months.map(m => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-white/40">{m.count}</span>
                <div
                  className="w-full bg-indigo-500 rounded-t-md transition-all"
                  style={{ height: `${Math.max((m.count / maxMonthCount) * 100, 4)}%` }}
                />
                <span className="text-[10px] text-white/30">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Type Pie */}
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Content Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'PDFs', count: pdfCount, color: 'bg-emerald-500' },
              { label: 'Videos', count: videoCount, color: 'bg-blue-500' },
              { label: 'Worksheets', count: worksheetCount, color: 'bg-violet-500' },
              ...(otherCount > 0 ? [{ label: 'Other', count: otherCount, color: 'bg-gray-400' }] : []),
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                <span className="text-sm text-white/50 flex-1">{item.label}</span>
                <span className="text-sm font-semibold text-white">{item.count}</span>
                <span className="text-xs text-white/30 w-12 text-right">
                  {total > 0 ? Math.round((item.count / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
          {total === 0 && (
            <p className="text-xs text-white/30 text-center mt-4">No resources yet. Upload your first CS resource!</p>
          )}
        </div>

        {/* Top Categories */}
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-indigo-500" />
            Top Categories
          </h3>
          {topCategories.length > 0 ? (
            <div className="space-y-2">
              {topCategories.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white/60">{name}</span>
                      <span className="text-xs text-white/30">{count}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.max((count / total) * 100, 5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30 text-center py-4">No categories with resources yet.</p>
          )}
        </div>

        {/* Recent Uploads */}
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Uploads</h3>
          {recentUploads.length > 0 ? (
            <div className="space-y-3">
              {recentUploads.map(r => (
                <div key={r.id} className="flex items-center gap-3 py-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    r.content_type === 'pdf' ? 'bg-emerald-50 text-emerald-600'
                      : r.content_type === 'video' ? 'bg-blue-500/15 text-blue-400'
                      : 'bg-violet-50 text-violet-600'
                  }`}>
                    {r.content_type === 'pdf' ? <FileText className="w-4 h-4" /> :
                     r.content_type === 'video' ? <Video className="w-4 h-4" /> :
                     <BookOpen className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{r.title}</p>
                    <p className="text-[10px] text-white/30">
                      {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30 text-center py-4">No uploads yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
