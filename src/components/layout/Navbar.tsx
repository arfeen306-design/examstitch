'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, GraduationCap, LogOut, User } from 'lucide-react';
import { mainNavItems } from '@/config/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="glass-navbar fixed top-0 left-0 right-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-navy-900" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Exam<span className="text-gold-500">Stitch</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {mainNavItems.map((item) => (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-white/75 hover:text-white transition-colors rounded-lg hover:bg-white/8 flex items-center gap-1"
                >
                  {item.label}
                  {item.children && <ChevronDown className="w-3.5 h-3.5" />}
                </Link>

                {/* Dropdown */}
                <AnimatePresence>
                  {item.children && openDropdown === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1 w-56 rounded-xl shadow-2xl overflow-hidden"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: '0 8px 32px var(--shadow-color)',
                      }}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-3 text-sm font-medium transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.color = 'var(--accent-text)';
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-subtle)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {!authLoading && (
              user ? (
                <>
                  <span className="flex items-center gap-1.5 px-3 py-2 text-sm text-white/70 rounded-lg">
                    <User className="w-3.5 h-3.5" />
                    {user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  Log In
                </Link>
              )
            )}
            <Link
              href="/demo"
              className="px-5 py-2 text-sm font-bold text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:shadow-[0_4px_20px_rgba(255,107,53,0.4)]"
              style={{ backgroundColor: '#FF6B35' }}
            >
              Book a Demo
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-white/80 hover:text-white"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-white/10"
            >
              <div className="py-4 space-y-1">
                {mainNavItems.map((item) => (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => !item.children && setMobileOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-white/80 hover:text-gold-500 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {item.label}
                    </Link>
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className="block pl-8 pr-4 py-2 text-sm text-white/60 hover:text-gold-500 transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ))}
                <div className="pt-4 px-4 border-t border-white/10 mt-4 space-y-2">
                  {user ? (
                    <>
                      <p className="text-xs text-white/50 px-1 pb-1">{user.email}</p>
                      <button
                        onClick={() => { handleSignOut(); setMobileOpen(false); }}
                        className="flex items-center gap-2 w-full text-center py-2.5 text-sm font-medium text-white/80 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <LogOut className="w-4 h-4 ml-auto" />
                        <span className="mr-auto">Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-2.5 text-sm font-medium text-white/80 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      Log In
                    </Link>
                  )}
                  <Link
                    href="/demo"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center py-2.5 text-sm font-bold text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#FF6B35' }}
                  >
                    Book a Demo
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
