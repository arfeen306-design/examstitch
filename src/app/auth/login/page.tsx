'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError, data: { user } } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !user) {
      setError(authError?.message || 'Login failed');
      setLoading(false);
      return;
    }

    // Determine redirect
    let redirectTo = searchParams.get('redirectTo');
    if (!redirectTo) {
      // Check if student has a level
      const { data: student } = await supabase
        .from('student_accounts')
        .select('level')
        .eq('id', user.id)
        .single();
      
      redirectTo = student?.level ? '/dashboard' : '/';
    }

    // Use window.location for a full page navigation
    window.location.href = redirectTo;
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-subtle)' }}>
      <div className="w-full max-w-md mx-4">
        <div className="rounded-2xl p-8 shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="text-center mb-8">
            <div className="w-12 h-12 gradient-gold rounded-xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome Back</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sign in to your ExamStitch account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input, var(--bg-card))', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <Link href="/auth/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--accent)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input, var(--bg-card))', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 gradient-gold text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
