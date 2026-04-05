'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Dashboard Error</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Something went wrong loading this page. Your data is safe — try refreshing.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white
                     bg-gradient-to-r from-orange-500 to-rose-600 rounded-xl
                     hover:from-orange-600 hover:to-rose-700 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        {error.digest && (
          <p className="text-[10px] text-[var(--text-muted)] mt-4">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
