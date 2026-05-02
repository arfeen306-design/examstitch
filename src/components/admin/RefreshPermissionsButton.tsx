'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Check } from 'lucide-react';
import { refreshAdminPermissions } from '@/app/admin/(dashboard)/refresh-permissions-action';

/**
 * Force-refresh the admin's permission cache. Phase 2.1 Task 3.
 *
 * The middleware role cache TTL is 60s, so a permission change normally
 * propagates within a minute. This button is the manual escape hatch when
 * an admin is impatient or wants to confirm the change took effect.
 */
export default function RefreshPermissionsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [justSucceeded, setJustSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await refreshAdminPermissions();
      if (!result.success) {
        setError(result.error ?? 'Refresh failed');
        return;
      }
      setJustSucceeded(true);
      // Trigger a full RSC re-render so the sidebar reflects the new state.
      router.refresh();
      // Reset the success badge after 2 seconds.
      setTimeout(() => setJustSucceeded(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        title="Re-read your role and managed subjects from the database"
        className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all
                   text-white/50 hover:text-white/85 border border-white/[0.08] hover:border-white/[0.18] hover:bg-white/[0.06]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
      >
        {justSucceeded ? (
          <>
            <Check className="w-4 h-4 shrink-0 text-emerald-400" aria-hidden />
            <span>Permissions refreshed</span>
          </>
        ) : (
          <>
            <RefreshCw className={`w-4 h-4 shrink-0 ${isPending ? 'animate-spin' : ''}`} aria-hidden />
            <span>{isPending ? 'Refreshing…' : 'Refresh Permissions'}</span>
          </>
        )}
      </button>
      {error ? (
        <p className="text-[11px] text-red-300/80 px-2">{error}</p>
      ) : null}
    </div>
  );
}
