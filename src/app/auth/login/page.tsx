'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Integrate Supabase Auth
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-navy-50/30">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white border border-navy-100 rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-12 h-12 gradient-gold rounded-xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-6 h-6 text-navy-900" />
            </div>
            <h1 className="text-2xl font-bold text-navy-900">Welcome Back</h1>
            <p className="text-sm text-navy-500 mt-1">Sign in to your ExamStitch account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 gradient-gold text-navy-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-navy-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-gold-600 font-medium hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
