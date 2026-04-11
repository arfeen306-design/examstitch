'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, Loader2 } from 'lucide-react';

interface NotifyMeBoxProps {
  variant?: 'inline' | 'footer';
  level?: string;
  sourcePage?: string;
}

export default function NotifyMeBox({ variant = 'inline', level = 'general', sourcePage = '/' }: NotifyMeBoxProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, level, sourcePage }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-2 ${variant === 'footer' ? 'text-emerald-400' : 'text-emerald-400'}`}
      >
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-medium">You&apos;re on the list! We&apos;ll notify you.</span>
      </motion.div>
    );
  }

  if (variant === 'footer') {
    return (
      <div>
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Stay Updated</h4>
        <p className="text-sm text-white/50 mb-3">Get notified when new resources drop.</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-colors"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 gradient-gold text-navy-900 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          </button>
        </form>
        {status === 'error' && <p className="text-xs text-red-400 mt-1">Something went wrong. Try again.</p>}
      </div>
    );
  }

  return (
    <motion.div
      className="animate-pulse-subtle inline-block rounded-2xl w-full max-w-md"
      whileHover={{ scale: 1.01 }}
    >
      <div className="portal-glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-100">Get Notified</h3>
        </div>
        <p className="text-sm text-slate-300 mb-4">Be the first to know when new past papers and video solutions are uploaded.</p>
        <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap sm:flex-nowrap">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 min-w-0 px-4 py-2.5 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 portal-glass-select focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/25 transition-all"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-5 py-2.5 gradient-gold text-navy-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Notify Me'}
          </button>
        </form>
        {status === 'error' && (
          <p className="text-xs text-red-400 mt-2">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </motion.div>
  );
}
