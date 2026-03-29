'use client';

/**
 * ThemeProvider — sets data-theme on <html> and syncs with localStorage.
 * Wrap your layout with this component above everything else.
 */

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'default' | 'dark' | 'beach' | 'forest';

const STORAGE_KEY = 'examstitch-theme';

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'default',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read saved preference on first mount to avoid flash
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved && ['default', 'dark', 'beach', 'forest'].includes(saved)) {
      setThemeState(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
    setMounted(true);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    document.documentElement.setAttribute('data-theme', t);
  };

  // Prevent flash: render nothing until client has read localStorage
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
