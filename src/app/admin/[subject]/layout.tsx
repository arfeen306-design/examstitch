import Link from 'next/link';
import { Database, LogOut, ArrowLeft, FolderOpen, BarChart3, Upload } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SubjectSwitcher from '@/components/admin/SubjectSwitcher';
import AdminThemeButton from '@/components/admin/AdminThemeButton';
import { ROUTE_TO_PORTAL, SHARED_ADMIN_ROUTES } from '@/config/admin-portals';
import { resolveManagedSubjectsToSlugs } from '@/lib/admin/resolve-managed-subjects';

export default async function SubjectAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { subject: string };
}) {
  const portal = ROUTE_TO_PORTAL[params.subject];

  // If the segment isn't a known portal or is a shared route, let Next.js 404
  if (!portal || SHARED_ADMIN_ROUTES.has(params.subject)) {
    notFound();
  }

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
  let adminName = 'Admin';
  let resolvedManagedSlugs: string[] = [];
  if (adminCookie?.value) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('student_accounts')
      .select('is_super_admin, full_name, email, managed_subjects')
      .eq('id', adminCookie.value)
      .single();
    isSuperAdmin = profile?.is_super_admin ?? false;
    adminName = profile?.full_name || profile?.email?.split('@')[0] || 'Admin';
    const rawManaged = (profile?.managed_subjects as string[]) ?? [];
    resolvedManagedSlugs = await resolveManagedSubjectsToSlugs(rawManaged);
  }

  const navItems = [
    { label: `${portal.label}`, href: `/admin/${portal.routeSegment}`, icon: Database },
    { label: 'Categories', href: `/admin/${portal.routeSegment}/categories`, icon: FolderOpen },
    { label: 'Bulk Upload', href: `/admin/${portal.routeSegment}/bulk-upload`, icon: Upload },
    { label: 'Analytics', href: `/admin/${portal.routeSegment}/analytics`, icon: BarChart3 },
  ];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--bg-primary)] flex">
        {/* Sidebar */}
        <aside
          className="w-[260px] flex flex-col shrink-0 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, var(--hero-from) 0%, var(--hero-via) 40%, var(--hero-from) 100%)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Brand */}
          <div className="relative p-5 pb-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-br ${portal.gradient} flex items-center justify-center shadow-lg ring-1 ring-white/10`}
              >
                <Database className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                {portal.label.replace(' Resources', '')} Admin
              </h2>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-medium pl-[38px]">
              {portal.label.replace(' Resources', '')} Portal
            </p>
          </div>

          {/* Divider */}
          <div
            className="mx-4 h-px mb-4"
            style={{ background: `linear-gradient(90deg, transparent, ${portal.accentColor}40, transparent)` }}
          />

          {/* Profile badge — glass, low-contrast border (no harsh white bars) */}
          <div className="relative mx-4 mb-4 p-3 rounded-xl overflow-hidden border border-white/[0.06] bg-slate-950/35 backdrop-blur-md">
            <div className="relative flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${portal.gradient} flex items-center justify-center shrink-0 shadow-lg ring-1 ring-amber-500/20`}
              >
                <span className="text-sm font-bold text-white drop-shadow-sm">
                  {adminName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{adminName}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Subject Admin
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 space-y-1 relative">
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              Management
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                             text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.05] group-hover:bg-white/[0.1] transition-colors">
                    <Icon className="w-4 h-4 shrink-0 transition-colors" />
                  </div>
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer — Theme / nav / sign-out stack */}
          <div className="p-4 mt-auto flex flex-col gap-2 w-full">
            <div
              className="h-px mb-2"
              style={{ background: `linear-gradient(90deg, transparent, ${portal.accentColor}20, transparent)` }}
            />
            <AdminThemeButton tone="portal" />
            <Link
              href="/admin"
              className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all
                         text-slate-300/90 hover:text-amber-100/95 border border-transparent bg-white/[0.04] hover:border-amber-500/20 hover:bg-amber-500/[0.07]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
              Back to Main
            </Link>
            <form action={handleLogout} className="w-full">
              <button
                type="submit"
                className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all
                           text-slate-300/90 hover:text-slate-100 border border-transparent bg-white/[0.04] hover:border-white/10 hover:bg-white/[0.07]
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
              >
                <LogOut className="w-4 h-4 shrink-0" aria-hidden />
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header
            className="h-14 shrink-0 flex items-center justify-between px-6 relative z-[100]"
            style={{
              background: 'color-mix(in srgb, var(--bg-elevated) 80%, transparent)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, ${portal.accentColor}40, ${portal.accentColor}15, transparent 60%)` }}
            />
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/40 animate-pulse" />
              <h1 className="text-sm font-semibold text-white/70">
                {portal.label.replace(' Resources', '')}
              </h1>
            </div>
            <SubjectSwitcher isSuperAdmin={isSuperAdmin} managedSubjects={resolvedManagedSlugs} />
          </header>
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
