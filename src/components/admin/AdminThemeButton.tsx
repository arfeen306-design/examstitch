'use client';

import { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

const THEMES = [
  {
    id: 'navy',
    label: 'Navy Blue',
    preview: 'bg-gradient-to-br from-[#0B1120] to-[#131B2E]',
  },
  {
    id: 'dark',
    label: 'Pure Dark',
    preview: 'bg-gradient-to-br from-[#09090b] to-[#18181b]',
  },
  {
    id: 'beach',
    label: 'Beach',
    preview: 'bg-gradient-to-br from-[#fef3c7] to-[#fde68a]',
  },
  {
    id: 'forest',
    label: 'Forest Green',
    preview: 'bg-gradient-to-br from-[#061a0e] to-[#0d2e1c]',
  },
] as const;

type ThemeId = typeof THEMES[number]['id'];

function applyAdminTheme(themeId: ThemeId) {
  // Set data-admin-theme on <html> for CSS variable overrides
  document.documentElement.setAttribute('data-admin-theme', themeId);
  localStorage.setItem('admin-theme', themeId);
}

export default function AdminThemeButton() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ThemeId>('navy');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('admin-theme') as ThemeId | null;
    if (saved && THEMES.some(t => t.id === saved)) {
      setActive(saved);
      applyAdminTheme(saved);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(themeId: ThemeId) {
    setActive(themeId);
    applyAdminTheme(themeId);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium
                   text-[var(--text-muted)] hover:text-violet-300 transition-all rounded-xl
                   border border-white/[0.06] hover:border-violet-500/20 hover:bg-violet-500/5"
      >
        <Palette className="w-4 h-4" />
        Theme
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-xl shadow-2xl z-[9999]
                        bg-[#131B2E] border border-white/[0.1]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-2 pt-1 pb-2">
            Admin Theme
          </p>
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => handleSelect(theme.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all ${
                active === theme.id
                  ? 'bg-violet-500/15 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <div className={`w-6 h-6 rounded-md ${theme.preview} border border-white/10 shrink-0`} />
              <span className="flex-1 text-xs font-medium text-left">{theme.label}</span>
              {active === theme.id && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
