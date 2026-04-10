import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { ROUTE_TO_PORTAL, getPortalDbSubjectSlug } from '@/config/admin-portals';
import { BarChart3, Eye, FileText, Video, TrendingUp, Clock } from 'lucide-react';
import { CONTENT_TYPES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function SubjectAnalyticsPage({
  params,
}: {
  params: { subject: string };
}) {
  const portal = ROUTE_TO_PORTAL[params.subject];
  if (!portal) notFound();

  const supabase = createAdminClient();

  // Resolve subject
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('slug', getPortalDbSubjectSlug(portal))
    .single();

  if (!subject) {
    return (
      <div className="text-center py-20 text-[var(--text-muted)]">
        <p>Subject not configured.</p>
      </div>
    );
  }

  // Fetch all resources for this subject
  const { data: resources } = await supabase
    .from('resources')
    .select('id, title, content_type, module_type, is_published, created_at, category:categories(name)')
    .eq('subject_id', subject.id)
    .order('created_at', { ascending: false });

  const allResources = resources ?? [];
  const published = allResources.filter(r => r.is_published);
  const videos = allResources.filter(r => r.content_type === CONTENT_TYPES.VIDEO);
  const pdfs = allResources.filter(r => r.content_type === CONTENT_TYPES.PDF);

  // Fetch view counts (resource_views table may not exist yet — handle gracefully)
  let totalViews = 0;
  let viewsByResource: Record<string, number> = {};
  let weekViews = 0;
  let lastWeekViews = 0;

  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Total views for this subject
    const { count: total } = await supabase
      .from('resource_views')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', subject.id);
    totalViews = total ?? 0;

    // Views this week
    const { count: thisWeek } = await supabase
      .from('resource_views')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', subject.id)
      .gte('viewed_at', oneWeekAgo.toISOString());
    weekViews = thisWeek ?? 0;

    // Views last week
    const { count: prevWeek } = await supabase
      .from('resource_views')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', subject.id)
      .gte('viewed_at', twoWeeksAgo.toISOString())
      .lt('viewed_at', oneWeekAgo.toISOString());
    lastWeekViews = prevWeek ?? 0;

    // Top resources by views
    const { data: topViews } = await supabase
      .from('resource_views')
      .select('resource_id')
      .eq('subject_id', subject.id);

    if (topViews) {
      for (const v of topViews) {
        if (v.resource_id) {
          viewsByResource[v.resource_id] = (viewsByResource[v.resource_id] ?? 0) + 1;
        }
      }
    }
  } catch {
    // resource_views table may not exist yet — show zeros
  }

  // Top 5 most-viewed
  const topResources = Object.entries(viewsByResource)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => {
      const resource = allResources.find(r => r.id === id);
      return { id, title: resource?.title ?? 'Unknown', count };
    });

  // Recent 5
  const recent = allResources.slice(0, 5);

  const stats = [
    { label: 'Total Resources', value: allResources.length, icon: BarChart3, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
    { label: 'Published', value: published.length, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { label: 'Videos', value: videos.length, icon: Video, color: 'text-blue-400', bg: 'bg-blue-500/15' },
    { label: 'PDFs', value: pdfs.length, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/15' },
    { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-rose-400', bg: 'bg-rose-500/15' },
    { label: 'Views This Week', value: weekViews, icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  ];

  const viewDelta = weekViews - lastWeekViews;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{subject.name} Analytics</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">Resource stats and view analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)]">{stat.label}</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Week over week */}
      {totalViews > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Week over Week</h3>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{weekViews}</span>
            <span className="text-sm text-[var(--text-muted)]">views this week</span>
            {viewDelta !== 0 && (
              <span className={`text-sm font-medium ${viewDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {viewDelta > 0 ? '+' : ''}{viewDelta} vs last week
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-rose-400" /> Most Viewed
          </h3>
          {topResources.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">No view data yet.</p>
          ) : (
            <div className="space-y-2">
              {topResources.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-surface)]">
                  <span className="text-xs font-bold text-[var(--text-muted)] w-5 text-right">{i + 1}</span>
                  <p className="text-sm text-[var(--text-secondary)] flex-1 truncate">{r.title}</p>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">{r.count} views</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Additions */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" /> Recent Additions
          </h3>
          {recent.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">No resources yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-surface)]">
                  {r.content_type === 'video' ? (
                    <Video className="w-4 h-4 text-blue-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-secondary)] truncate">{r.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {(r.category as any)?.name ?? 'No category'} · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
