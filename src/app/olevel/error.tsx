'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function OLevelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Temporary Connection Issue</h2>
        <p className="text-sm text-white/40 mb-6">
          We couldn&apos;t load the subject data right now. This is usually a brief hiccup — please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white
                     bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl
                     hover:from-blue-600 hover:to-indigo-700 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        {error.digest && (
          <p className="text-[10px] text-white/20 mt-4">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
