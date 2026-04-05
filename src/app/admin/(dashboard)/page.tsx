import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import {
  Database, FolderTree, Eye, Users, FileText, Video,
  ArrowUpRight, Clock,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const supabase = createAdminClient();

  // Get admin profile for subject-aware stats
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

  // Fetch stats
  const [resourcesRes, categoriesRes, subscribersRes, studentsRes] = await Promise.all([
    supabase.from('resources').select('id, content_type, is_published, subject_id', { count: 'exact' }),
    supabase.from('categories').select('id', { count: 'exact' }),
    supabase.from('subscribers').select('id', { count: 'exact' }).eq('is_active', true),
    supabase.from('student_accounts').select('id', { count: 'exact' }).eq('role', 'student'),
  ]);

  const allResources = resourcesRes.data ?? [];
  // Filter by managed subjects if not super admin
  const resources = isSuperAdmin
    ? allResources
    : allResources.filter(r => managedSubjects.includes(r.subject_id));

  const totalResources = resources.length;
  const publishedResources = resources.filter(r => r.is_published).length;
  const totalVideos = resources.filter(r => r.content_type === 'video').length;
  const totalPDFs = resources.filter(r => r.content_type === 'pdf').length;
  const totalCategories = categoriesRes.count ?? 0;
  const totalSubscribers = subscribersRes.count ?? 0;
  const totalStudents = studentsRes.count ?? 0;

  const stats = [
    {
      label: 'Total Resources',
      value: totalResources.toString(),
      sub: `${publishedResources} published`,
      icon: Database,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Categories',
      value: totalCategories.toString(),
      sub: 'active modules',
      icon: FolderTree,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Videos',
      value: totalVideos.toString(),
      sub: `${totalPDFs} PDFs`,
      icon: Video,
      gradient: 'from-red-500 to-rose-600',
    },
    {
      label: isSuperAdmin ? 'Students' : 'Subscribers',
      value: isSuperAdmin ? totalStudents.toString() : totalSubscribers.toString(),
      sub: isSuperAdmin ? `${totalSubscribers} subscribers` : 'active leads',
      icon: Users,
      gradient: 'from-amber-500 to-orange-600',
    },
  ];

  const quickActions = [
    { label: 'Upload Resources', href: '/admin/resources', icon: FileText },
    { label: 'Manage Categories', href: '/admin/categories', icon: FolderTree },
    { label: 'View Subscribers', href: '/admin/subscribers', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          {isSuperAdmin ? 'System Overview' : 'Dashboard'}
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {isSuperAdmin
            ? 'Global platform statistics across all subjects.'
            : `Showing stats for your managed subjects.`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl p-5
                         bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-subtle)]
                         hover:border-white/[0.12] transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stat.value}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{stat.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl p-6 bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-subtle)]">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl
                           bg-[var(--bg-card)] border border-[var(--border-subtle)]
                           hover:bg-white/[0.08] hover:border-white/[0.12] transition-all group"
              >
                <Icon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-white/70 transition-colors" />
                <span className="text-sm font-medium text-[var(--text-muted)] group-hover:text-white/80 transition-colors flex-1">
                  {action.label}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity placeholder */}
      <div className="rounded-2xl p-6 bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-[var(--text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Recent Activity</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Resource uploads, category changes, and user activity will appear here.
        </p>
      </div>
    </div>
  );
}
