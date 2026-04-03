import Link from 'next/link';
import {
  Globe, LogOut, Shield, Home, Database, FolderTree,
  Newspaper, Users, CalendarCheck, GraduationCap, Monitor, Sparkles,
  ChevronRight, Crown, Palette,
} from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SubjectSwitcher from '@/components/admin/SubjectSwitcher';
import AdminThemeButton from '@/components/admin/AdminThemeButton';

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
        <aside className="w-[260px] flex flex-col shrink-0 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #110d20 0%, #0B1120 35%, #0e0c1c 100%)',
            borderRight: '1px solid rgba(139,92,246,0.1)',
          }}
        >
          {/* Ambient glow top-right */}
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 100% 0%, rgba(139,92,246,0.1) 0%, transparent 60%)' }}
          />
          {/* Ambient glow bottom-left */}
          <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 0% 100%, rgba(168,85,247,0.06) 0%, transparent 60%)' }}
          />

          {/* Brand */}
          <div className="relative p-5 pb-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25 ring-1 ring-violet-400/20">
                <Crown className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-200 to-purple-300 bg-clip-text text-transparent">
                Super Admin
              </h2>
            </div>
            <p className="text-[11px] text-violet-400/40 font-medium pl-[38px]">Global Platform Control</p>
          </div>

          {/* Accent line */}
          <div className="mx-4 h-px mb-4"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.35), rgba(168,85,247,0.15), transparent)' }}
          />

          {/* Profile badge */}
          <div className="relative mx-4 mb-4 p-3 rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(168,85,247,0.05) 50%, rgba(139,92,246,0.08) 100%)',
              border: '1px solid rgba(139,92,246,0.18)',
            }}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 opacity-40"
              style={{ background: 'radial-gradient(circle at 20% 80%, rgba(168,85,247,0.15) 0%, transparent 50%)' }}
            />
            <div className="relative flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30 ring-2 ring-violet-400/25">
                <span className="text-sm font-bold text-white drop-shadow-sm">{adminName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-violet-100 truncate">{adminName}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400/50" />
                  <p className="text-[10px] font-semibold text-violet-400/70 uppercase tracking-wider">Full Access</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nav sections */}
          <nav className="flex-1 px-3 space-y-5 overflow-y-auto relative">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-violet-400/30">
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
                                   text-slate-400 hover:text-violet-100 transition-all group"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.03] group-hover:bg-violet-500/10 transition-colors">
                          <Icon className="w-4 h-4 shrink-0 group-hover:text-violet-400 transition-colors" />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {'badge' in item && item.badge !== undefined && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full
                                           text-[10px] font-bold bg-gradient-to-r from-violet-500 to-purple-500 text-white leading-none shadow-md shadow-violet-500/30">
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

          {/* Theme & Sign out */}
          <div className="p-4 mt-auto space-y-2">
            <div className="h-px mb-2"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.15), transparent)' }}
            />
            <AdminThemeButton />
            <form action={handleLogout}>
              <button
                type="submit"
                className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium
                           text-slate-500 hover:text-violet-300 transition-all rounded-xl
                           border border-white/[0.06] hover:border-violet-500/20 hover:bg-violet-500/5"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 shrink-0 flex items-center justify-between px-6 relative z-[100]"
            style={{
              background: 'linear-gradient(90deg, rgba(11,17,32,0.8) 0%, rgba(11,17,32,0.6) 100%)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(139,92,246,0.08)',
            }}
          >
            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.25), rgba(168,85,247,0.1), transparent 60%)' }}
            />
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-violet-400 shadow-lg shadow-violet-400/40 animate-pulse" />
              <h1 className="text-sm font-semibold text-white/70">Super Admin</h1>
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
