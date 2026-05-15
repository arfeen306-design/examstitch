'use client';

/**
 * Public navbar theme toggle — flips between the two canonical brand
 * themes. No dropdown, no list — a single tap switches.
 */

import { Leaf, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? 'default' : 'light')}
      title={isLight ? 'Switch to Dark Forest & Beach' : 'Switch to Light White & Purple'}
      aria-label={isLight ? 'Switch to Dark Forest & Beach' : 'Switch to Light White & Purple'}
      aria-pressed={isLight}
      className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-colors"
    >
      {isLight ? (
        <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden />
      ) : (
        <Leaf className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden />
      )}
    </button>
  );
}
