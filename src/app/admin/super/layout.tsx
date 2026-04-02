import Link from 'next/link';
import { Globe, LogOut, ArrowLeft, Shield } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ToastProvider } from '@/components/ui/Toast';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import SubjectSwitcher from '@/components/admin/SubjectSwitcher';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  async function handleLogout() {
    'use server';
    const supabase = createServerSupabase();
    await supabase.auth.signOut();
    (await cookies()).delete('admin_session');
    redirect('/admin/login');
  }

  const navItems = [
    { label: 'Control Center', href: '/admin/super', icon: Globe },
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

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-violet-100 hover:text-white hover:bg-violet-900/60 transition-colors"
                >
                  <Icon className="w-5 h-5 text-violet-400 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 space-y-2 mt-auto">
            <Link
              href="/admin"
              className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-violet-200 transition-colors border border-violet-800 rounded-lg hover:bg-violet-900/60"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Maths
            </Link>
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
