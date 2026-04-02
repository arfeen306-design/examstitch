import Link from 'next/link';
import {
  Globe, LogOut, Shield, Home, Database, FolderTree,
  Newspaper, Users, CalendarCheck, GraduationCap, Monitor, Sparkles,
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
    (await cookies()).delete('admin_session');
    redirect('/admin/login');
  }

  const newBookings = await getNewBookingsCount();

  const navItems = [
    // Super Admin
    { label: 'Control Center',     href: '/admin/super',        icon: Globe,          section: 'super' },
    // Maths Dashboard
    { label: 'Maths Dashboard',    href: '/admin',              icon: Home,           section: 'maths' },
    { label: 'Resource Manager',   href: '/admin/resources',    icon: Database,       section: 'maths' },
    { label: 'Taxonomy Manager',   href: '/admin/categories',   icon: FolderTree,     section: 'maths' },
    { label: 'Blog / Updates',     href: '/admin/blog',         icon: Newspaper,      section: 'maths' },
    { label: 'Lead List',          href: '/admin/subscribers',  icon: Users,          section: 'maths' },
    { label: 'Bookings',           href: '/admin/bookings',     icon: CalendarCheck,  section: 'maths', badge: newBookings > 0 ? newBookings : undefined },
    { label: 'Students',           href: '/admin/students',     icon: GraduationCap,  section: 'maths' },
    // CS Dashboard
    { label: 'CS Dashboard',       href: '/admin/cs',           icon: Monitor,        section: 'cs' },
    // Digital Skills
    { label: 'Digital Skills',     href: '/admin/super/digital-skills', icon: Sparkles, section: 'skills' },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar — Violet theme for Super Admin */}
        <aside className="w-64 text-white flex flex-col items-stretch shrink-0 bg-[#1e1033]">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-violet-300" />
              <h2 className="text-xl font-bold text-violet-300 tracking-tight">Super Admin</h2>
            </div>
            <p className="text-xs text-violet-400/70 mt-1">Global Platform Control</p>
          </div>

          <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
            {(['super', 'maths', 'cs', 'skills'] as const).map((section) => {
              const items = navItems.filter(i => i.section === section);
              const sectionLabel = section === 'super' ? 'Global' : section === 'maths' ? 'Mathematics' : section === 'cs' ? 'Computer Science' : 'Digital Skills';
              return (
                <div key={section} className={section !== 'super' ? 'pt-4' : ''}>
                  <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-500">
                    {sectionLabel}
                  </p>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-violet-100 hover:text-white hover:bg-violet-900/60 transition-colors"
                      >
                        <Icon className="w-4.5 h-4.5 text-violet-400 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-orange-500 text-white leading-none">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          <div className="p-4 mt-auto">
            <form action={handleLogout}>
              <button
                type="submit"
                className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-violet-200 transition-colors border border-violet-800 rounded-lg hover:bg-violet-900/60"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-violet-100 h-16 shrink-0 flex items-center justify-between px-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <h1 className="text-lg font-semibold text-gray-900">Super Admin</h1>
            </div>
            <SubjectSwitcher />
          </header>
          <div className="flex-1 overflow-y-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
