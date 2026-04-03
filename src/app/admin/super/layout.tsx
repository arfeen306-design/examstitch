import Link from 'next/link';
import {
  Globe, LogOut, Shield, Home, Database, FolderTree,
  Newspaper, Users, CalendarCheck, GraduationCap, Monitor, Sparkles,
  ChevronRight, ArrowLeft,
} from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SubjectSwitcher from '@/components/admin/SubjectSwitcher';

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

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
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
  let adminName = 'Super Admin';
  if (adminCookie?.value) {
    const admin = createAdminClient();
    const { data } = await admin
      .from('student_accounts')
      .select('full_name, email')
      .eq('id', adminCookie.value)
      .single();
    adminName = data?.full_name || data?.email?.split('@')[0] || 'Super Admin';
  }

  const newBookings = await getNewBookingsCount();

  const navSections = [
    {
      label: 'Global',
      items: [
        { label: 'Control Center', href: '/admin/super', icon: Globe },
        { label: 'Digital Skills', href: '/admin/super/digital-skills', icon: Sparkles },
      ],
    },
    {
      label: 'Dashboards',
      items: [
        { label: 'Subject Dashboard', href: '/admin', icon: Home },
        { label: 'Resource Manager', href: '/admin/resources', icon: Database },
        { label: 'Taxonomy Manager', href: '/admin/categories', icon: FolderTree },
      ],
    },
    {
      label: 'Platform',
      items: [
        { label: 'Blog / Updates', href: '/admin/blog', icon: Newspaper },
        { label: 'Subscribers', href: '/admin/subscribers', icon: Users },
        { label: 'Bookings', href: '/admin/bookings', icon: CalendarCheck, badge: newBookings > 0 ? newBookings : undefined },
        { label: 'Students', href: '/admin/students', icon: GraduationCap },
      ],
    },
    {
      label: 'Subject Portals',
      items: [
        { label: 'CS Admin', href: '/admin/cs', icon: Monitor },
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
            <div className="flex items-center gap-2 mb-0.5">
              <Shield className="w-4.5 h-4.5 text-violet-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Super Admin</h2>
            </div>
            <p className="text-[11px] text-white/30">Global Platform Control</p>
          </div>

          {/* Profile badge */}
          <div className="mx-4 mb-4 p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">{adminName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-violet-200 truncate">{adminName}</p>
                <p className="text-[10px] text-violet-400/60">Full Access</p>
              </div>
            </div>
          </div>

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
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <h1 className="text-sm font-medium text-white/60">Super Admin</h1>
            </div>
            <SubjectSwitcher />
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
