import Link from 'next/link';
import { Database, BarChart3, LogOut, ArrowLeft, Monitor } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SubjectSwitcher from '@/components/admin/SubjectSwitcher';

export default async function CSAdminLayout({ children }: { children: React.ReactNode }) {
  async function handleLogout() {
    'use server';
    const supabase = createServerSupabase();
    await supabase.auth.signOut();
    (await cookies()).delete('admin_session');
    redirect('/admin/login');
  }

  // Check if current user is super admin
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('admin_session');
  let isSuperAdmin = false;
  if (adminCookie?.value) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('student_accounts')
      .select('is_super_admin')
      .eq('id', adminCookie.value)
      .single();
    isSuperAdmin = profile?.is_super_admin ?? false;
  }

  const navItems = [
    { label: 'CS Resources', href: '/admin/cs', icon: Database },
    { label: 'CS Analytics', href: '/admin/cs/analytics', icon: BarChart3 },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar — Indigo theme for Computer Science */}
        <aside className="w-64 text-white flex flex-col items-stretch shrink-0 bg-[#1e1b4b]">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Monitor className="w-5 h-5 text-indigo-300" />
              <h2 className="text-xl font-bold text-indigo-300 tracking-tight">CS Admin</h2>
            </div>
            <p className="text-xs text-indigo-400/70 mt-1">Computer Science Portal</p>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-100 hover:text-white hover:bg-indigo-900/60 transition-colors"
                >
                  <Icon className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 space-y-2 mt-auto">
            <Link
              href="/admin"
              className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-indigo-200 transition-colors border border-indigo-800 rounded-lg hover:bg-indigo-900/60"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Main
            </Link>
            <form action={handleLogout}>
              <button
                type="submit"
                className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-indigo-200 transition-colors border border-indigo-800 rounded-lg hover:bg-indigo-900/60"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-indigo-100 h-16 shrink-0 flex items-center justify-between px-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <h1 className="text-lg font-semibold text-gray-900">Computer Science</h1>
            </div>
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
