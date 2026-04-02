'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, LogIn, GraduationCap, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface PremiumGateProps {
  resourceTitle: string;
  redirectTo: string;
  user?: User | null;
}

/**
 * Client-side premium content gate.
 * The server renders this when it can't confirm a session (is_locked + no cookie).
 * On mount, we re-check auth client-side. If a valid session exists, we
 * call router.refresh() so the server re-renders with the actual content.
 */
export default function PremiumGate({ resourceTitle, redirectTo, user }: PremiumGateProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Admin bypass: if admin_mode cookie exists, go straight to content
    if (document.cookie.includes('admin_mode=1')) {
      router.refresh();
      return;
    }
    // If the server explicitly passed null, we still re-check on client mount
    // to handle the edge case where the browser has a valid cookie/local session
    // that the server missed.
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Logged in client-side — refresh so the server picks up the cookie
        router.refresh();
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center"
           style={{ backgroundColor: 'var(--bg-subtle)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--cta-orange)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center"
         style={{ backgroundColor: 'var(--bg-subtle)' }}>
      <div className="w-full max-w-md mx-4 text-center">
        <div className="rounded-2xl p-10 shadow-lg"
             style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>

          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
               style={{ backgroundColor: 'var(--border-subtle)' }}>
            <Lock className="w-8 h-8" style={{ color: 'var(--cta-orange)' }} />
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Premium Access Required
          </h1>
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            This resource is restricted to registered students.
          </p>
          <p className="text-sm font-medium mb-8 truncate px-2"
             style={{ color: 'var(--text-secondary)' }}
             title={resourceTitle}>
            {resourceTitle}
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition hover:opacity-90"
              style={{ backgroundColor: 'var(--cta-orange)', color: '#fff' }}
            >
              <LogIn className="w-4 h-4" />
              Sign In to Access
            </Link>
            <Link
              href={`/auth/signup?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
                       backgroundColor: 'var(--bg-card)' }}
            >
              <GraduationCap className="w-4 h-4" />
              Create a Free Account
            </Link>
          </div>

          <p className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href={`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}
                  className="underline" style={{ color: 'var(--accent)' }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
