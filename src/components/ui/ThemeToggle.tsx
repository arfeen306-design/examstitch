'use client';

import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Waves, Leaf } from 'lucide-react';
import { useTheme, type Theme } from '@/components/ui/ThemeProvider';

const THEMES: { id: Theme; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'default', label: 'Navy',   icon: Sun,   color: '#D4AF37' },
  { id: 'dark',    label: 'Dark',   icon: Moon,  color: '#A78BFA' },
  { id: 'beach',   label: 'Beach',  icon: Waves, color: '#0E7EC0' },
  { id: 'forest',  label: 'Forest', icon: Leaf,  color: '#4ADE80' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = THEMES.find(t => t.id === theme) ?? THEMES[0];
  const Icon = current.icon;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Switch theme"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                   border border-[var(--border-color)] hover:border-[var(--accent)]
                   text-[var(--text-primary)] hover:text-[var(--accent)]
                   bg-[var(--bg-surface)]/30 hover:bg-[var(--bg-surface)]/60
                   transition-all duration-150 text-xs font-medium"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Icon className="w-3.5 h-3.5" style={{ color: current.color }} />
        <span className="hidden sm:inline">{current.label}</span>
        <svg className={`w-3 h-3 ml-0.5 transition-transform ${open ? 'rotate-180' : ''}`}
             viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-2 w-36 rounded-xl overflow-hidden
                     border border-[var(--border-color)] shadow-xl z-50
                     bg-[var(--bg-card)]"
        >
          {THEMES.map(t => {
            const TIcon = t.icon;
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                role="option"
                aria-selected={active}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium
                            transition-colors duration-100
                            ${active
                              ? 'text-[var(--accent)] bg-[var(--bg-surface)]'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/60'}`}
              >
                <TIcon className="w-3.5 h-3.5 shrink-0" style={{ color: t.color }} />
                {t.label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: t.color }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
