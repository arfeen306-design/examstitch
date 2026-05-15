'use client';

/**
 * AdminThemeButton — full-width sidebar control that toggles between
 * the two canonical brand themes:
 *
 *   Dark Forest & Beach   ←→   Light White & Purple
 *
 * Single-tap toggle, matches the height of the adjacent Sign Out
 * button so the bottom of every admin sidebar reads as a clean stack.
 */

import { Leaf, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';

const TRIGGER_VARIANTS = {
  navy:   `text-white/60 hover:text-white border-white/[0.08] hover:border-white/[0.18] hover:bg-white/[0.06]
           focus-visible:ring-white/25 focus-visible:ring-offset-[#0B1120]`,
  violet: `text-[var(--text-muted)] hover:text-[var(--text-primary)] border-white/[0.06] hover:border-violet-500/25 hover:bg-violet-500/5
           focus-visible:ring-violet-500/40`,
  indigo: `text-[var(--text-muted)] hover:text-[var(--text-primary)] border-white/[0.06] hover:border-indigo-500/25 hover:bg-indigo-500/5
           focus-visible:ring-indigo-500/40`,
  portal: `text-[var(--text-muted)] hover:text-[var(--text-primary)] border-transparent bg-white/[0.04] hover:border-amber-500/20 hover:bg-amber-500/[0.07]
           focus-visible:ring-amber-400/25 focus-visible:ring-offset-[var(--bg-primary)]`,
} as const;

export type AdminSidebarTone = keyof typeof TRIGGER_VARIANTS;

export default function AdminThemeButton({ tone = 'portal' }: { tone?: AdminSidebarTone }) {
  const { theme, setTheme } = useTheme();
  const isLight = theme === 'light';
  const toneClass = TRIGGER_VARIANTS[tone];

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? 'default' : 'light')}
      aria-pressed={isLight}
      title={isLight ? 'Switch to Dark Forest & Beach' : 'Switch to Light White & Purple'}
      className={`flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${toneClass}`}
    >
      {isLight ? (
        <>
          <Sparkles className="w-4 h-4 shrink-0" aria-hidden />
          <span>White &amp; Purple</span>
        </>
      ) : (
        <>
          <Leaf className="w-4 h-4 shrink-0" aria-hidden />
          <span>Forest &amp; Beach</span>
        </>
      )}
    </button>
  );
}
