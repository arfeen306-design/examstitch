'use client';

import { Globe } from 'lucide-react';
import Link from 'next/link';

/** Floating "View Public Site" button shown on every admin page. */
export default function PublicSiteBridge() {
  return (
    <Link
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl
                 text-sm font-semibold shadow-2xl transition-all
                 hover:scale-105 hover:-translate-y-0.5 group select-none"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.94) 0%, rgba(30,41,59,0.94) 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.75)',
      }}
    >
      <div className="w-6 h-6 rounded-lg bg-white/[0.08] flex items-center justify-center shrink-0 group-hover:bg-white/[0.14] transition-colors">
        <Globe className="w-3.5 h-3.5 text-emerald-400" />
      </div>
      <span className="group-hover:text-white transition-colors">View Public Site</span>
    </Link>
  );
}
