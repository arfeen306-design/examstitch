'use client';

import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import Link from 'next/link';

/** Floating "Open Super Admin Panel" button — visible only when super_admin_mode cookie is set. */
export default function SuperAdminBridge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isSuperAdmin = document.cookie
      .split(';')
      .some(c => c.trim() === 'super_admin_mode=1');
    if (isSuperAdmin) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <Link
      href="/admin/super"
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl
                 text-sm font-semibold text-white shadow-2xl transition-all
                 hover:scale-105 hover:-translate-y-0.5 group select-none"
      style={{
        background: 'linear-gradient(135deg, rgba(109,40,217,0.96) 0%, rgba(147,51,234,0.96) 100%)',
        boxShadow: '0 8px 32px rgba(109,40,217,0.4), 0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(167,139,250,0.35)',
      }}
    >
      <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
        <Shield className="w-3.5 h-3.5 text-white" />
      </div>
      <span>Super Admin Panel</span>
    </Link>
  );
}
