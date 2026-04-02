'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#1e293b] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-xl backdrop-blur-sm border border-white/10">
            <ShieldCheck className="w-8 h-8 text-[#FF6B35]" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-white tracking-tight">
            ExamStitch Admin
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Secure access to the platform dashboard
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/5 backdrop-blur-sm py-8 px-4 shadow-xl border border-white/10 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
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
                  className="appearance-none block w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg shadow-sm placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:border-[#FF6B35] sm:text-sm transition-colors"
                  placeholder="admin@examstitch.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="appearance-none block w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg shadow-sm placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:border-[#FF6B35] sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#FF6B35] hover:bg-[#e55a2b] disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1e293b] focus:ring-[#FF6B35]"
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
