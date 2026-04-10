import Link from 'next/link';
import {
  Home, Database, FolderTree, Users, LogOut, Newspaper,
  CalendarCheck, GraduationCap, Shield, ChevronRight, Zap,
} from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import SubjectSwitcher from '@/components/admin/SubjectSwitcher';
import AdminThemeButton from '@/components/admin/AdminThemeButton';
import { getPortalsForSubjects } from '@/config/admin-portals';
import { resolveManagedSubjectsToSlugs } from '@/lib/admin/resolve-managed-subjects';

async function getAdminProfile(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('student_accounts')
    .select('full_name, email, is_super_admin, managed_subjects')
    .eq('id', userId)
    .single();
  return data;
}

function subjectPortalNavEntries(managedSlugs: string[]): { label: string; href: string }[] {
  return getPortalsForSubjects(managedSlugs).map((p) => ({
    label: p.label,
    href: `/admin/${p.routeSegment}`,
  }));
}

async function getNewBookingsCount(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('demo_bookings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  async function handleLogout() {
    'use server';
    const supabase = createServerSupabase();
    await supabase.auth.signOut();
    const jar = await cookies();
    jar.delete('admin_session');
    jar.delete('admin_mode');
    jar.delete('admin_landing');
    redirect('/admin/login');
  }

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('admin_session');
  const profile = adminCookie?.value ? await getAdminProfile(adminCookie.value) : null;
  const isSuperAdmin = profile?.is_super_admin ?? false;
  const adminName = profile?.full_name || profile?.email?.split('@')[0] || 'Admin';
  const managedSubjects: string[] = (profile?.managed_subjects as string[]) ?? [];
  const resolvedManagedSlugs = await resolveManagedSubjectsToSlugs(managedSubjects);
  const subjectPortals = isSuperAdmin ? [] : subjectPortalNavEntries(resolvedManagedSlugs);
  const newBookings = await getNewBookingsCount();

  const navSections = [
    {
      label: 'Main',
      items: [
        { label: 'Dashboard', href: '/admin', icon: Home },
        { label: 'Resources', href: '/admin/resources', icon: Database },
        { label: 'Categories', href: '/admin/categories', icon: FolderTree },
      ],
    },
    {
      label: 'Content',
      items: [
        { label: 'Blog / Updates', href: '/admin/blog', icon: Newspaper },
        { label: 'Subscribers', href: '/admin/subscribers', icon: Users },
        { label: 'Bookings', href: '/admin/bookings', icon: CalendarCheck, badge: newBookings > 0 ? newBookings : undefined },
      ],
    },
    {
      label: 'Users',
      items: [
        { label: 'Students', href: '/admin/students', icon: GraduationCap },
      ],
    },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--bg-primary)] flex">
        {/* ── Sidebar ── */}
        <aside className="w-[260px] flex flex-col shrink-0 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, var(--hero-from) 0%, var(--hero-via) 40%, var(--hero-from) 100%)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Ambient glow top */}
          <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% -20%, var(--accent), transparent 70%)', opacity: 0.07 }}
          />

          {/* Brand */}
          <div className="relative p-5 pb-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)' }}>
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">ExamStitch</h2>
            </div>
            <p className="text-[11px] text-white/30 font-medium pl-[38px]">Admin Control Panel</p>
          </div>

          {/* Accent line */}
          <div className="mx-4 h-px mb-4"
            style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 40%, transparent), color-mix(in srgb, var(--accent) 15%, transparent), transparent)' }}
          />

          {/* Admin profile badge */}
          <div className="relative mx-4 mb-4 p-3 rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, transparent) 0%, color-mix(in srgb, var(--accent) 5%, transparent) 100%)',
              border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
            }}
          >
            <div className="absolute inset-0 opacity-30"
              style={{ background: 'radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 60%)' }}
            />
            <div className="relative flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent), 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                <span className="text-sm font-bold text-white drop-shadow-sm">{adminName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{adminName}</p>
                <p className="text-[10px] font-medium text-white/40">
                  {isSuperAdmin ? 'Super Admin' : 'Subject Admin'}
                </p>
              </div>
            </div>
          </div>

          {/* Super Admin link */}
          {isSuperAdmin && (
            <Link
              href="/admin/super"
              className="mx-4 mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(168,85,247,0.08) 100%)',
                border: '1px solid rgba(139,92,246,0.2)',
                color: '#c4b5fd',
              }}
            >
              <Shield className="w-4 h-4 text-violet-400" />
              <span className="flex-1">Super Admin Panel</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {/* Subject portal links — only for non-super admins with assigned subjects */}
          {!isSuperAdmin && subjectPortals.length > 0 && (
            <div className="mx-3 mb-3 space-y-0.5">
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/20">
                My Subjects
              </p>
              {subjectPortals.map(portal => (
                <Link
                  key={portal.href}
                  href={portal.href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                             text-indigo-300/80 hover:text-indigo-200"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.04) 100%)',
                    border: '1px solid rgba(99,102,241,0.15)',
                  }}
                >
                  <Database className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="flex-1">{portal.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          )}

          {/* Nav sections */}
          <nav className="flex-1 px-3 space-y-5 overflow-y-auto relative">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/20">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                                   text-white/50 hover:text-white transition-all group"
                        style={{
                          // Hover handled by Tailwind classes below
                        }}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.05] group-hover:bg-white/[0.1] transition-colors">
                          <Icon className="w-4 h-4 shrink-0 group-hover:text-white transition-colors" />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {'badge' in item && item.badge !== undefined && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full
                                           text-[10px] font-bold text-white leading-none shadow-md"
                                           style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', boxShadow: '0 2px 8px color-mix(in srgb, var(--accent) 40%, transparent)' }}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Theme & Sign out — full-width stack, equal vertical rhythm */}
          <div className="p-4 mt-auto flex flex-col gap-2 w-full items-stretch justify-end">
            <div
              className="h-px mb-2 shrink-0"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }}
            />
            <div className="flex flex-col gap-2 w-full min-w-0 [&>div]:w-full [&>form]:w-full [&_button]:min-h-[42px]">
              <AdminThemeButton tone="navy" />
              <form action={handleLogout} className="w-full flex">
                <button
                  type="submit"
                  className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all
                             text-white/50 hover:text-white/85 border border-white/[0.08] hover:border-white/[0.18] hover:bg-white/[0.06]
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]"
                >
                  <LogOut className="w-4 h-4 shrink-0" aria-hidden />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 shrink-0 flex items-center justify-between px-6 relative z-[100]"
            style={{
              background: 'color-mix(in srgb, var(--bg-elevated) 80%, transparent)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 25%, transparent), color-mix(in srgb, var(--accent) 10%, transparent), transparent 60%)' }}
            />
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40 animate-pulse" />
              <h1 className="text-sm font-semibold text-[var(--text-primary)]">Dashboard</h1>
            </div>
            <SubjectSwitcher isSuperAdmin={isSuperAdmin} managedSubjects={resolvedManagedSlugs} />
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
