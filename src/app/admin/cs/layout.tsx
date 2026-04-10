import Link from 'next/link';
import { Database, BarChart3, LogOut, ArrowLeft, Monitor, Terminal, Palette, Upload } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SubjectSwitcher from '@/components/admin/SubjectSwitcher';
import AdminThemeButton from '@/components/admin/AdminThemeButton';

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

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('admin_session');
  let isSuperAdmin = false;
  let adminName = 'CS Admin';
  let managedSubjects: string[] = [];
  if (adminCookie?.value) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('student_accounts')
      .select('is_super_admin, full_name, email, managed_subjects')
      .eq('id', adminCookie.value)
      .single();
    isSuperAdmin = profile?.is_super_admin ?? false;
    adminName = profile?.full_name || profile?.email?.split('@')[0] || 'CS Admin';
    managedSubjects = (profile?.managed_subjects as string[]) ?? [];
  }

  const navItems = [
    { label: 'CS Resources', href: '/admin/cs', icon: Database },
    { label: 'Bulk Upload', href: '/admin/cs/bulk-upload', icon: Upload },
    { label: 'CS Analytics', href: '/admin/cs/analytics', icon: BarChart3 },
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
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-40 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 65%)' }}
          />
          <div className="absolute bottom-20 right-0 w-32 h-32 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 100% 50%, rgba(59,130,246,0.05) 0%, transparent 60%)' }}
          />

          {/* Brand */}
          <div className="relative p-5 pb-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/20">
                <Terminal className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-200 to-blue-300 bg-clip-text text-transparent">
                CS Admin
              </h2>
            </div>
            <p className="text-[11px] text-indigo-400/40 font-medium pl-[38px]">Computer Science Portal</p>
          </div>

          {/* Accent line */}
          <div className="mx-4 h-px mb-4"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), rgba(59,130,246,0.15), transparent)' }}
          />

          {/* Profile badge */}
          <div className="relative mx-4 mb-4 p-3 rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.04) 50%, rgba(99,102,241,0.06) 100%)',
              border: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            <div className="absolute inset-0 opacity-30"
              style={{ background: 'radial-gradient(circle at 80% 50%, rgba(99,102,241,0.12) 0%, transparent 50%)' }}
            />
            <div className="relative flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/20">
                <span className="text-sm font-bold text-white drop-shadow-sm">{adminName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-indigo-100 truncate">{adminName}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  <p className="text-[10px] font-semibold text-indigo-400/70 uppercase tracking-wider">Subject Admin</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 space-y-1 relative">
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-400/30">
              Management
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                             text-[var(--text-muted)] hover:text-indigo-100 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.05] group-hover:bg-indigo-500/10 transition-colors">
                    <Icon className="w-4 h-4 shrink-0 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 space-y-2 mt-auto">
            <div className="h-px mb-2"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent)' }}
            />
            <AdminThemeButton />
            <Link
              href="/admin"
              className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium
                         text-[var(--text-muted)] hover:text-indigo-300 transition-all rounded-xl
                         border border-white/[0.06] hover:border-indigo-500/20 hover:bg-indigo-500/5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Main
            </Link>
            <form action={handleLogout}>
              <button
                type="submit"
                className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium
                           text-[var(--text-muted)] hover:text-indigo-300 transition-all rounded-xl
                           border border-white/[0.06] hover:border-indigo-500/20 hover:bg-indigo-500/5"
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
              background: 'color-mix(in srgb, var(--bg-elevated) 80%, transparent)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.25), rgba(59,130,246,0.1), transparent 60%)' }}
            />
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/40 animate-pulse" />
              <h1 className="text-sm font-semibold text-white/70">Computer Science</h1>
            </div>
            <SubjectSwitcher isSuperAdmin={isSuperAdmin} managedSubjects={managedSubjects} />
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
