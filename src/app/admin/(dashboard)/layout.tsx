import Link from 'next/link';
import {
  Home, Database, FolderTree, Users, LogOut, Newspaper,
  CalendarCheck, GraduationCap, Shield, ChevronRight,
} from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import SubjectSwitcher from '@/components/admin/SubjectSwitcher';

async function getAdminProfile(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('student_accounts')
    .select('full_name, email, is_super_admin, managed_subjects')
    .eq('id', userId)
    .single();
  return data;
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
      <div className="min-h-screen bg-[#0B1120] flex">
        {/* ── Sidebar ── */}
        <aside className="w-[260px] flex flex-col shrink-0 border-r border-white/[0.06]
                          bg-[#0B1120]/80 backdrop-blur-2xl">
          {/* Brand */}
          <div className="p-5 pb-4">
            <h2 className="text-lg font-bold text-white tracking-tight">ExamStitch</h2>
            <p className="text-[11px] text-white/30 mt-0.5">Admin Control Panel</p>
          </div>

          {/* Admin profile badge */}
          <div className="mx-4 mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">{adminName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">{adminName}</p>
                <p className="text-[10px] text-white/30">
                  {isSuperAdmin ? 'Super Admin' : 'Subject Admin'}
                </p>
              </div>
            </div>
          </div>

          {/* Super Admin link */}
          {isSuperAdmin && (
            <Link
              href="/admin/super"
              className="mx-4 mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
                         bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20
                         text-violet-300 hover:text-violet-200 hover:border-violet-500/30 transition-all"
            >
              <Shield className="w-4 h-4" />
              <span className="flex-1">Super Admin Panel</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </Link>
          )}

          {/* Nav sections */}
          <nav className="flex-1 px-3 space-y-5 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/20">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium
                                   text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {'badge' in item && item.badge !== undefined && (
                          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full
                                           text-[10px] font-bold bg-orange-500 text-white leading-none">
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

          {/* Sign out */}
          <div className="p-4 mt-auto border-t border-white/[0.06]">
            <form action={handleLogout}>
              <button
                type="submit"
                className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium
                           text-white/40 hover:text-white/70 transition-colors rounded-lg
                           border border-white/[0.06] hover:bg-white/[0.04]"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 shrink-0 flex items-center justify-between px-6
                             bg-[#0B1120]/60 backdrop-blur-xl border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <h1 className="text-sm font-medium text-white/60">Dashboard</h1>
            </div>
            {isSuperAdmin && <SubjectSwitcher />}
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
