'use client';

/**
 * ThemeProvider — used to be a multi-theme switcher (default / dark /
 * beach / forest). After the brand consolidation it is reduced to a
 * single canonical theme: **Dark Forest & Beach**.
 *
 * The component is retained as a thin compatibility shim so existing
 * `useTheme()` callers continue to compile, but the value is now
 * effectively immutable and `setTheme` is a no-op.
 */

import { createContext, useContext, useEffect } from 'react';

/**
 * Type union preserved for source compatibility with legacy callers
 * that compare `theme === 'beach'` etc. The runtime value is always
 * `'default'` post-brand-consolidation, so those checks evaluate to
 * `false` — no consumer needs to be touched.
 */
export type Theme = 'default' | 'dark' | 'beach' | 'forest';

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'default',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Ensure the <html> attribute stays in the canonical state even if a
    // legacy value was persisted in localStorage from the old theme
    // switcher. We can also opportunistically clear that key.
    document.documentElement.setAttribute('data-theme', 'default');
    try {
      localStorage.removeItem('examstitch-theme');
    } catch {
      /* SSR / locked-down localStorage — harmless to ignore */
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'default', setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
