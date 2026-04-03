'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, GraduationCap, LogOut, User, Search, LayoutDashboard } from 'lucide-react';
import { mainNavItems } from '@/config/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

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

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
  };

  return (
    <header className="glass-navbar fixed top-0 left-0 right-0 z-[70]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-navy-900" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Exam<span className="text-gold-500">Stitch</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5 flex-nowrap">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-2.5 py-2 text-[13px] font-medium text-white/75 hover:text-white transition-colors rounded-lg hover:bg-white/[0.08] whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side — Search + Auth + Demo + Theme */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            {/* Search bar */}
            <div className="relative">
              <AnimatePresence>
                {searchOpen ? (
                  <motion.form
                    key="search-form"
                    initial={{ width: 36, opacity: 0.5 }}
                    animate={{ width: 220, opacity: 1 }}
                    exit={{ width: 36, opacity: 0.5 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    onSubmit={handleSearch}
                    className="flex items-center overflow-hidden rounded-lg"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <Search className="w-4 h-4 text-white/50 ml-2.5 shrink-0" />
                    <input
                      ref={searchRef}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search…"
                      className="bg-transparent text-sm text-white placeholder-white/40 outline-none px-2 py-2 w-full"
                      onBlur={() => {
                        if (!searchQuery.trim()) setSearchOpen(false);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); }
                      }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                        className="p-1.5 mr-1 text-white/40 hover:text-white/70 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.form>
                ) : (
                  <motion.button
                    key="search-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSearchOpen(true)}
                    className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
                    title="Search"
                  >
                    <Search className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {!authLoading && (
              user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white/60 hover:text-teal-400 transition-colors rounded-lg hover:bg-white/5"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </Link>
                  <span className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-white/60 rounded-lg">
                    <User className="w-3.5 h-3.5" />
                    {user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="px-3 py-2 text-xs font-medium text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  Log In
                </Link>
              )
            )}
            <Link
              href="/demo"
              className="px-4 py-2 text-xs font-bold text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:shadow-[0_4px_20px_rgba(255,107,53,0.4)]"
              style={{ backgroundColor: '#FF6B35' }}
            >
              Book a Demo
            </Link>
            <ThemeToggle />
          </div>

          {/* Mobile: search icon + hamburger */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-white/70 hover:text-white"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-white/80 hover:text-white"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSearch}
              className="lg:hidden overflow-hidden border-t border-white/10"
            >
              <div className="flex items-center gap-2 px-4 py-3">
                <Search className="w-4 h-4 text-white/50 shrink-0" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search resources…"
                  className="bg-transparent text-sm text-white placeholder-white/40 outline-none w-full"
                  autoFocus
                />
                {searchQuery && (
                  <button type="submit" className="text-xs font-semibold text-gold-400 shrink-0">Go</button>
                )}
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-white/10"
            >
              <div className="py-4 space-y-1">
                {mainNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-white/80 hover:text-gold-500 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 px-4 border-t border-white/10 mt-4 space-y-2">
                  {user ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 w-full py-2.5 text-sm font-semibold text-teal-400 border border-teal-500/30 rounded-lg hover:bg-teal-500/10 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 ml-auto" />
                        <span className="mr-auto">Dashboard</span>
                      </Link>
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
