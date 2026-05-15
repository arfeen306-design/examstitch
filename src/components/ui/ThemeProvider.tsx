'use client';

/**
 * ThemeProvider — toggles between the two canonical brand themes:
 *
 *   'default'  → Dark Forest & Beach
 *   'light'    → Light White & Purple
 *
 * Persists the choice in `localStorage` and writes `data-theme` on
 * <html> so the CSS variables in globals.css cascade correctly. The
 * `Theme` type union retains the legacy values (`dark`, `beach`,
 * `forest`) for source compatibility with old `theme === 'beach'`
 * style checks — they coerce to `'default'` at the runtime boundary
 * so legacy code paths stay sound.
 */

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'default' | 'light' | 'dark' | 'beach' | 'forest';

/** Only these two values actually drive distinct UI. */
const VALID_THEMES: ReadonlyArray<Theme> = ['default', 'light'];

const STORAGE_KEY = 'examstitch-theme';

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'default',
  setTheme: () => {},
});

function normalise(value: string | null): Theme {
  if (value && (VALID_THEMES as readonly string[]).includes(value)) {
    return value as Theme;
  }
  return 'default';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* SSR / locked-down storage — fall through to default */
    }
    const initial = normalise(saved);
    setThemeState(initial);
    document.documentElement.setAttribute('data-theme', initial);
    setMounted(true);
  }, []);

  function setTheme(next: Theme) {
    const safe = normalise(next);
    setThemeState(safe);
    try {
      localStorage.setItem(STORAGE_KEY, safe);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute('data-theme', safe);
  }

  // Prevent flash of unstyled themed content — children still render
  // because layout already set data-theme via the FOUC inline script.
  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
