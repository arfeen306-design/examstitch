'use client';

import { ArrowLeft } from 'lucide-react';

export interface BackToDigitalSkillsHubProps {
  onClick: () => void;
  /** Visible label; keep short on small screens via parent layout if needed */
  label?: string;
  className?: string;
}

/**
 * Scholar-style back control: navy-friendly hover, gold accent on focus (matches global ExamStitch nav).
 */
export function BackToDigitalSkillsHub({
  onClick,
  label = 'Back to Digital Skills',
  className = '',
}: BackToDigitalSkillsHubProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold
        text-white/80 transition-colors
        hover:bg-[#0c1929]/90 hover:text-amber-200/95
        focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08081a]
        ${className}`.trim()}
    >
      <ArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}
