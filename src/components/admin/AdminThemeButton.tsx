'use client';

import { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, type Theme } from '@/components/ui/ThemeProvider';

const THEMES = [
  {
    id: 'default' as Theme,
    label: 'Navy Blue',
    preview: 'bg-gradient-to-br from-[#0B1120] to-[#131B2E]',
  },
  {
    id: 'dark' as Theme,
    label: 'Pure Dark',
    preview: 'bg-gradient-to-br from-[#09090b] to-[#18181b]',
  },
  {
    id: 'beach' as Theme,
    label: 'Beach',
    preview: 'bg-gradient-to-br from-[#fef3c7] to-[#fde68a]',
  },
  {
    id: 'forest' as Theme,
    label: 'Forest Green',
    preview: 'bg-gradient-to-br from-[#061a0e] to-[#0d2e1c]',
  },
] as const;

export default function AdminThemeButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(themeId: Theme) {
    setTheme(themeId);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium
                   text-white/40 hover:text-violet-300 transition-all rounded-xl
                   border border-white/[0.06] hover:border-violet-500/20 hover:bg-violet-500/5"
      >
        <Palette className="w-4 h-4" />
        Theme
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-xl shadow-2xl z-[9999]
                        bg-[var(--bg-elevated)] border border-[var(--border-color)]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-2 pt-1 pb-2">
            Admin Theme
          </p>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all ${
                theme === t.id
                  ? 'bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <div className={`w-6 h-6 rounded-md ${t.preview} border border-[var(--border-subtle)] shrink-0`} />
              <span className="flex-1 text-xs font-medium text-left">{t.label}</span>
              {theme === t.id && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
