'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertCircle, Loader2, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
        return;
      }

      router.push(data.redirectTo || '/admin');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <div className="w-16 h-16 bg-white/[0.06] rounded-2xl flex items-center justify-center mb-4 shadow-xl backdrop-blur-xl border border-white/[0.08]">
            <ShieldCheck className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-white tracking-tight">
            ExamStitch Admin
          </h2>
          <p className="mt-2 text-center text-sm text-white/40">
            Secure access to the platform dashboard
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/[0.04] backdrop-blur-xl py-8 px-4 shadow-xl border border-white/[0.08] sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/50">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="appearance-none block w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08]
                             rounded-xl shadow-sm placeholder-white/20 text-white
                             focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50
                             sm:text-sm transition-all"
                  placeholder="admin@examstitch.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/50">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="appearance-none block w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08]
                             rounded-xl shadow-sm placeholder-white/20 text-white
                             focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50
                             sm:text-sm transition-all"
                  placeholder="••••••••"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-sm
                           text-sm font-semibold text-white
                           bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700
                           disabled:opacity-60 disabled:cursor-not-allowed transition-all
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B1120] focus:ring-orange-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  'Authenticate'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
