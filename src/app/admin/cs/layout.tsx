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
    const jar = await cookies();
    jar.delete('admin_session');
    jar.delete('admin_mode');
    jar.delete('admin_landing');
    redirect('/admin/login');
  }

  // Check if current user is super admin
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('admin_session');
  let isSuperAdmin = false;
  let adminName = 'CS Admin';
  if (adminCookie?.value) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('student_accounts')
      .select('is_super_admin, full_name, email')
      .eq('id', adminCookie.value)
      .single();
    isSuperAdmin = profile?.is_super_admin ?? false;
    adminName = profile?.full_name || profile?.email?.split('@')[0] || 'CS Admin';
  }

  const navItems = [
    { label: 'CS Resources', href: '/admin/cs', icon: Database },
    { label: 'CS Analytics', href: '/admin/cs/analytics', icon: BarChart3 },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0B1120] flex">
        {/* ── Sidebar ── */}
        <aside className="w-[260px] flex flex-col shrink-0 border-r border-white/[0.06]
                          bg-[#0B1120]/80 backdrop-blur-2xl">
          <div className="p-5 pb-4">
            <div className="flex items-center gap-2 mb-0.5">
              <Monitor className="w-4.5 h-4.5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">CS Admin</h2>
            </div>
            <p className="text-[11px] text-white/30">Computer Science Portal</p>
          </div>

          {/* Profile badge */}
          <div className="mx-4 mb-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">{adminName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-indigo-200 truncate">{adminName}</p>
                <p className="text-[10px] text-indigo-400/60">Subject Admin</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 space-y-0.5">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/20">
              Management
            </p>
            {navItems.map((item) => {
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
                </Link>
              );
            })}
          </nav>

          <div className="p-4 space-y-2 mt-auto border-t border-white/[0.06]">
            <Link
              href="/admin"
              className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium
                         text-white/40 hover:text-white/70 transition-colors rounded-lg
                         border border-white/[0.06] hover:bg-white/[0.04]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Main
            </Link>
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
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <h1 className="text-sm font-medium text-white/60">Computer Science</h1>
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
