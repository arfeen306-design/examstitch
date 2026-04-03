import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/supabase/guards';
import { redirect } from 'next/navigation';
import {
  Globe, BookOpen, Users, Shield, TrendingUp, Video, FileText,
  AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react';
import nextDynamic from 'next/dynamic';
import { O_LEVEL_SUBJECTS, A_LEVEL_SUBJECTS } from '@/config/subjects';

const SuperAdminClient = nextDynamic(() => import('./SuperAdminClient'), { ssr: false });

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  const session = await requireSuperAdmin();
  if (!session) redirect('/admin/login');

  const supabase = createAdminClient();

  // ── Auto-sync: ensure all subjects from config exist in DB ──────────────
  const allConfigSubjectsRaw = [...O_LEVEL_SUBJECTS, ...A_LEVEL_SUBJECTS];
  // Deduplicate by name (e.g. "Computer Science" appears in both O and A level)
  const configByName = new Map<string, { name: string; slug: string; levels: string[] }>();
  for (const cs of allConfigSubjectsRaw) {
    const existing = configByName.get(cs.name);
    if (existing) {
      // Merge levels (e.g. "O Level" + "A Level")
      const mergedLevels = [...new Set([...existing.levels, cs.id.includes('9') ? 'A Level' : 'O Level'])];
      configByName.set(cs.name, { ...existing, levels: mergedLevels });
    } else {
      const level = cs.id.match(/^[a-z]+-(\d+)$/)?.[1];
      const isALevel = level && parseInt(level) >= 9000;
      configByName.set(cs.name, {
        name: cs.name,
        slug: cs.name.toLowerCase().replace(/\s+/g, '-'),
        levels: [isALevel ? 'A Level' : 'O Level'],
      });
    }
  }

  const { data: existingSubjects } = await supabase
    .from('subjects')
    .select('slug');
  const existingSlugs = new Set((existingSubjects ?? []).map(s => s.slug));

  const toInsert = [...configByName.values()].filter(s => !existingSlugs.has(s.slug));
  if (toInsert.length > 0) {
    await supabase.from('subjects').insert(toInsert);
  }
  // ────────────────────────────────────────────────────────────────────────

  // Fetch all subjects (now guaranteed complete)
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('name');

  // Fetch resource counts per subject
  const { data: resources } = await supabase
    .from('resources')
    .select('subject_id, content_type, is_published');

  // Fetch all admin accounts
  const { data: admins } = await supabase
    .from('student_accounts')
    .select('id, email, full_name, role, is_super_admin, managed_subjects')
    .eq('role', 'admin')
    .order('email');

  // Fetch all media widgets
  const { data: mediaWidgets } = await supabase
    .from('media_widgets')
    .select('*')
    .order('page_slug')
    .order('section_order', { ascending: true });

  // Compute stats
  const subjectList = subjects ?? [];
  const resourceList = resources ?? [];
  const adminList = admins ?? [];
  const mediaList = mediaWidgets ?? [];

  const totalResources = resourceList.length;
  const publishedResources = resourceList.filter(r => r.is_published).length;
  const totalVideos = resourceList.filter(r => r.content_type === 'video').length;
  const totalPDFs = resourceList.filter(r => r.content_type === 'pdf').length;

  const perSubject = subjectList.map(s => ({
    ...s,
    resourceCount: resourceList.filter(r => r.subject_id === s.id).length,
    publishedCount: resourceList.filter(r => r.subject_id === s.id && r.is_published).length,
  }));

  const totalAdmins = adminList.length;
  const superAdmins = adminList.filter(a => a.is_super_admin).length;

  // Identify empty subjects (in config but have 0 resources)
  const allConfigSubjects = [...O_LEVEL_SUBJECTS, ...A_LEVEL_SUBJECTS];
  const dbSubjectSlugs = subjectList.map(s => s.slug);
  const subjectsWithResources = new Set(
    resourceList.filter(r => r.subject_id).map(r => r.subject_id)
  );
  const emptySubjects = perSubject.filter(s => s.resourceCount === 0);
  const missingFromDB = allConfigSubjects.filter(
    cs => !dbSubjectSlugs.some(slug => cs.id.includes(slug) || slug.includes(cs.id.split('-')[0]))
  );

  const stats = [
    { label: 'Total Subjects', value: subjectList.length.toString(), sub: `${emptySubjects.length} empty`, icon: Globe, gradient: 'from-violet-500 to-purple-600' },
    { label: 'Total Resources', value: totalResources.toString(), sub: `${publishedResources} published`, icon: BookOpen, gradient: 'from-blue-500 to-indigo-600' },
    { label: 'Admin Users', value: totalAdmins.toString(), sub: `${superAdmins} super`, icon: Users, gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Super Admins', value: superAdmins.toString(), sub: 'full access', icon: Shield, gradient: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Super Admin Control Center</h2>
        <p className="text-sm text-white/40 mt-1">
          Welcome back, {session.email}. Global platform management.
        </p>
      </div>

      {/* Stats Grid — compact row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="relative overflow-hidden rounded-xl p-4
                                             bg-white/[0.04] backdrop-blur-xl border border-white/[0.06]
                                             hover:border-white/[0.12] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{stat.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Management Panels (primary content — always visible first) ═══ */}
      <SuperAdminClient
        subjects={subjectList}
        admins={adminList.map(a => ({
          id: a.id,
          email: a.email,
          full_name: a.full_name,
          is_super_admin: a.is_super_admin,
          managed_subjects: (a.managed_subjects as string[]) ?? [],
        }))}
        mediaWidgets={mediaList.map(m => ({
          id: m.id,
          page_slug: m.page_slug,
          section_order: m.section_order,
          media_type: m.media_type as 'youtube' | 'pdf',
          title: m.title,
          url: m.url,
          permissions: m.permissions as { allow_print: boolean; allow_download: boolean },
          is_active: m.is_active,
          view_count: (m as Record<string, unknown>).view_count as number ?? 0,
          created_at: m.created_at,
        }))}
      />

      {/* ═══ Status & Analytics (secondary — below management) ═══ */}

      {/* ── Global Status Card ── */}
      <div className="rounded-2xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-5 h-5 text-violet-400" />
          <h3 className="text-base font-semibold text-white">Global Status</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-400/70 font-medium uppercase tracking-wider">Papers Uploaded</p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{totalResources}</p>
            <p className="text-xs text-emerald-400/50 mt-0.5">{totalVideos} videos · {totalPDFs} PDFs</p>
          </div>
          <div className="rounded-xl p-4 bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-400/70 font-medium uppercase tracking-wider">Subjects Active</p>
            <p className="text-2xl font-bold text-blue-300 mt-1">{subjectList.length - emptySubjects.length}</p>
            <p className="text-xs text-blue-400/50 mt-0.5">of {subjectList.length} total in database</p>
          </div>
          <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-400/70 font-medium uppercase tracking-wider">Empty Subjects</p>
            <p className="text-2xl font-bold text-amber-300 mt-1">{emptySubjects.length}</p>
            <p className="text-xs text-amber-400/50 mt-0.5">need content uploads</p>
          </div>
        </div>

        {/* Empty subjects list */}
        {emptySubjects.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Subjects Needing Content</p>
            <div className="space-y-2">
              {emptySubjects.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl
                                           bg-white/[0.03] border border-white/[0.06]">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/70">{s.name}</p>
                    <p className="text-xs text-white/30">{s.levels?.join(' · ') || 'No levels'}</p>
                  </div>
                  <span className="text-xs text-amber-400/60 font-medium">0 resources</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subjects with content */}
        {perSubject.filter(s => s.resourceCount > 0).length > 0 && (
          <div className={emptySubjects.length > 0 ? 'mt-5' : ''}>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Active Subjects</p>
            <div className="space-y-2">
              {perSubject.filter(s => s.resourceCount > 0).map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl
                                           bg-white/[0.03] border border-white/[0.06]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/70">{s.name}</p>
                    <p className="text-xs text-white/30">{s.levels?.join(' · ') || 'No levels'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white/70">{s.resourceCount}</p>
                    <p className="text-[10px] text-white/30">{s.publishedCount} published</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Performing Content */}
      {mediaList.length > 0 && (
        <div className="rounded-2xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-semibold text-white">Top Performing Content</h3>
          </div>
          <div className="space-y-2">
            {[...mediaList]
              .sort((a, b) => ((b as Record<string, unknown>).view_count as number ?? 0) - ((a as Record<string, unknown>).view_count as number ?? 0))
              .slice(0, 10)
              .map((w, i) => {
                const views = (w as Record<string, unknown>).view_count as number ?? 0;
                const maxViews = Math.max(
                  ...mediaList.map(m => ((m as Record<string, unknown>).view_count as number) ?? 0),
                  1
                );
                return (
                  <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl
                                             bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-xs font-bold text-white/20 w-5 text-right shrink-0">
                      {i + 1}
                    </span>
                    {(w.media_type as string) === 'youtube' ? (
                      <Video className="w-4 h-4 text-red-400 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/70 truncate">{w.title}</p>
                      <div className="mt-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all"
                          style={{ width: `${maxViews > 0 ? (views / maxViews) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-white/70">
                        {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
                      </p>
                      <p className="text-[10px] text-white/30">views</p>
                    </div>
                  </div>
                );
              })}
            {mediaList.every(m => ((m as Record<string, unknown>).view_count as number ?? 0) === 0) && (
              <p className="text-sm text-white/30 py-4 text-center">No views recorded yet.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
