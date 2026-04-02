import Link from 'next/link';
import { Home, Database, FolderTree, Users, LogOut, Newspaper, CalendarCheck, GraduationCap } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
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

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  async function handleLogout() {
    'use server';
    const supabase = createServerSupabase();
    await supabase.auth.signOut();
    (await cookies()).delete('admin_session');
    redirect('/admin/login');
  }

  const newBookings = await getNewBookingsCount();

  // Check if current user is a super admin (for subject switcher)
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('admin_session');
  let isSuperAdmin = false;
  if (adminCookie?.value) {
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('student_accounts')
      .select('is_super_admin')
      .eq('id', adminCookie.value)
      .single();
    isSuperAdmin = profile?.is_super_admin ?? false;
  }

  const navItems = [
    { label: 'Dashboard Overview', href: '/admin',             icon: Home },
    { label: 'Resource Manager',   href: '/admin/resources',   icon: Database },
    { label: 'Taxonomy Manager',   href: '/admin/categories',  icon: FolderTree },
    { label: 'Blog / Updates',     href: '/admin/blog',        icon: Newspaper },
    { label: 'Lead List',          href: '/admin/subscribers', icon: Users },
    { label: 'Bookings',           href: '/admin/bookings',    icon: CalendarCheck, badge: newBookings > 0 ? newBookings : undefined },
    { label: 'Students',           href: '/admin/students',    icon: GraduationCap },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-64 text-white flex flex-col items-stretch shrink-0"
               style={{ backgroundColor: 'var(--sidebar-bg, #1A2B56)' }}>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gold-500 tracking-tight">ExamStitch Admin</h2>
            <p className="text-xs text-navy-300 mt-1">Control Panel v1.0</p>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-100 hover:text-white hover:bg-navy-800 transition-colors"
                >
                  <Icon className="w-5 h-5 text-gold-500 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-orange-500 text-white leading-none">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-auto">
            <form action={handleLogout}>
              <button
                type="submit"
                className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-white transition-colors border border-navy-700 rounded-lg hover:bg-navy-800"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-navy-50 h-16 shrink-0 flex items-center justify-between px-8 shadow-sm">
            <h1 className="text-lg font-semibold text-navy-900">Dashboard</h1>
            {isSuperAdmin && <SubjectSwitcher />}
          </header>
          <div className="flex-1 overflow-y-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
