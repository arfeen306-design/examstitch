'use client';

/**
 * AdminThemeButton — used to be a multi-theme picker (Navy / Dark /
 * Beach / Forest). Now a static brand label after the consolidation
 * to a single Dark Forest & Beach palette.
 *
 * Kept on the page so the admin shell layout doesn't have to change
 * — same footprint and `tone` prop, just no longer interactive.
 */

import { Palette } from 'lucide-react';

const TRIGGER_VARIANTS = {
  navy:  'border-white/[0.08] text-white/50',
  violet:'border-white/[0.06] text-[var(--text-muted)]',
  indigo:'border-white/[0.06] text-[var(--text-muted)]',
  portal:'border-transparent bg-white/[0.04] text-[var(--text-muted)]',
} as const;

export type AdminSidebarTone = keyof typeof TRIGGER_VARIANTS;

export default function AdminThemeButton({ tone = 'portal' }: { tone?: AdminSidebarTone }) {
  const toneClass = TRIGGER_VARIANTS[tone];

  return (
    <div
      className={`flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border ${toneClass}`}
      role="status"
      aria-label="Active theme: Dark Forest & Beach"
    >
      <Palette className="w-4 h-4 shrink-0" aria-hidden />
      <span>Forest &amp; Beach</span>
    </div>
  );
}
