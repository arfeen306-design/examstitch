import Link from 'next/link';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-8">
          You don&apos;t have permission to view this page. Your account is restricted to specific subject areas.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/admin/login"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#FF6B35] rounded-lg hover:bg-[#e55a2b] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
        <p className="text-xs text-slate-500 mt-6">
          Error 403 — Contact your administrator if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}
