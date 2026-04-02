import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/supabase/guards';
import { redirect } from 'next/navigation';
import { Globe, BookOpen, Users, Shield, TrendingUp, Video, FileText } from 'lucide-react';
import nextDynamic from 'next/dynamic';
const SuperAdminClient = nextDynamic(() => import('./SuperAdminClient'), { ssr: false });

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  const session = await requireSuperAdmin();
  if (!session) redirect('/admin/login');

  const supabase = createAdminClient();

  // Fetch all subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('name');

  // Fetch resource counts per subject
  const { data: resources } = await supabase
    .from('resources')
    .select('subject_id');

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

  const totalResources = resourceList.length;
  const mediaList = mediaWidgets ?? [];

  const perSubject = subjectList.map(s => ({
    ...s,
    resourceCount: resourceList.filter(r => r.subject_id === s.id).length,
  }));

  const totalAdmins = adminList.length;
  const superAdmins = adminList.filter(a => a.is_super_admin).length;

  const stats = [
    { label: 'Total Subjects', value: subjectList.length.toString(), icon: Globe, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Total Resources', value: totalResources.toString(), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Admin Users', value: totalAdmins.toString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Super Admins', value: superAdmins.toString(), icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy-900 tracking-tight">Super Admin Control Center</h2>
        <p className="text-sm text-navy-500 mt-1">
          Welcome back, {session.email}. Global platform management.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-navy-50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-navy-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-navy-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subject Breakdown */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-navy-50">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Subject Overview</h3>
        <div className="grid gap-3">
          {perSubject.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="font-medium text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.levels?.join(' · ')}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{s.resourceCount}</p>
                <p className="text-xs text-gray-500">resources</p>
              </div>
            </div>
          ))}
          {perSubject.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">No subjects configured.</p>
          )}
        </div>
      </div>

      {/* Top Performing Content */}
      {mediaList.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-navy-50">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-semibold text-navy-900">Top Performing Content</h3>
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
                  <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-xs font-bold text-gray-400 w-5 text-right shrink-0">
                      {i + 1}
                    </span>
                    {(w.media_type as string) === 'youtube' ? (
                      <Video className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{w.title}</p>
                      <div className="mt-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all"
                          style={{ width: `${maxViews > 0 ? (views / maxViews) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
                      </p>
                      <p className="text-[10px] text-gray-500">views</p>
                    </div>
                  </div>
                );
              })}
            {mediaList.every(m => ((m as Record<string, unknown>).view_count as number ?? 0) === 0) && (
              <p className="text-sm text-gray-400 py-4 text-center">No views recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Client-side interactive panels */}
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
    </div>
  );
}
