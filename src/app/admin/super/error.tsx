'use client';

import { useEffect } from 'react';

export default function SuperError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Super Admin Error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
        <span className="text-red-400 text-xl font-bold">!</span>
      </div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Super Admin Error</h2>
      <p className="text-sm text-[var(--text-muted)] max-w-md">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-gold-500 text-[var(--text-primary)] hover:bg-gold-600 transition"
      >
        Try again
      </button>
    </div>
  );
}
