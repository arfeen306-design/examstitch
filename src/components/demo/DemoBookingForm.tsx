'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Phone, User, BookOpen, GraduationCap, Calendar } from 'lucide-react';
import MathConfetti from './MathConfetti';

// ── Constants ────────────────────────────────────────────────────────────────
const LEVELS = [
  'Pre O-Level',
  'O-Level / IGCSE',
  'AS Level',
  'A2 Level',
];

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Computer Science',
  'Chemistry',
  'Biology',
];

// E.164: + followed by 8–15 digits (e.g. +923001234567)
const WHATSAPP_REGEX = /^\+[1-9]\d{7,14}$/;

interface FormState {
  name: string;
  whatsapp: string;
  level: string;
  subject: string;
}

interface FieldError {
  name?: string;
  whatsapp?: string;
  level?: string;
  subject?: string;
}

// ── Input Wrapper ────────────────────────────────────────────────────────────
function Field({
  label,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  error?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        <Icon className="w-3.5 h-3.5 inline mr-1.5 opacity-60" />
        {label}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

const inputClass =
  'w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35]';

const inputStyle = {
  backgroundColor: 'var(--bg-surface)',
  border: '1.5px solid var(--border-color)',
  color: 'var(--text-primary)',
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function DemoBookingForm() {
  const [form, setForm] = useState<FormState>({ name: '', whatsapp: '', level: '', subject: '' });
  const [errors, setErrors] = useState<FieldError>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiError, setApiError] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [confetti, setConfetti] = useState(false);

  const validate = (): boolean => {
    const next: FieldError = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      next.name = 'Please enter your full name.';
    if (!form.whatsapp.trim() || !WHATSAPP_REGEX.test(form.whatsapp.trim()))
      next.whatsapp = 'Use international format — e.g. +923001234567';
    if (!form.level)
      next.level = 'Please select your grade / level.';
    if (!form.subject)
      next.subject = 'Please select a subject.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('loading');
    setApiError('');

    try {
      const res = await fetch('/api/demo-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json() as { success?: boolean; booking_ref?: string; error?: string };

      if (res.ok && json.success) {
        setBookingRef(json.booking_ref ?? '');
        setStatus('success');
        setConfetti(true);
        // stop confetti after 5 s
        setTimeout(() => setConfetti(false), 5000);
      } else {
        setApiError(json.error ?? 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setApiError('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  };

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // ── Success Card ──────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <>
        <MathConfetti active={confetti} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl p-8 sm:p-10 text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '2px solid #FF6B35',
            boxShadow: '0 8px 40px rgba(255, 107, 53, 0.18)',
          }}
        >
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'backOut' }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #FF8F65)' }}
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-2xl font-extrabold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Demo Booked!
          </motion.h3>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-base mb-6 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Thanks, <strong style={{ color: 'var(--text-primary)' }}>{form.name.split(' ')[0]}</strong>!
            We&apos;ll reach out on WhatsApp within <strong style={{ color: '#FF6B35' }}>24 hours</strong> to
            confirm your session.
          </motion.p>

          {bookingRef && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono font-bold mb-6"
              style={{ backgroundColor: 'rgba(255,107,53,0.08)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.2)' }}
            >
              <Calendar className="w-4 h-4" />
              Booking Reference: {bookingRef}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="grid grid-cols-2 gap-3 text-sm"
          >
            {[
              { label: 'Level', value: form.level },
              { label: 'Subject', value: form.subject },
              { label: 'WhatsApp', value: form.whatsapp },
              { label: 'Status', value: 'Pending Confirmation' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl px-3 py-2.5 text-left"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </p>
                <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <motion.form
      onSubmit={handleSubmit}
      noValidate
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Name */}
      <Field label="Full Name" error={errors.name} icon={User}>
        <input
          type="text"
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Zain Ul Arfeen"
          autoComplete="name"
          className={inputClass}
          style={{
            ...inputStyle,
            borderColor: errors.name ? '#ef4444' : undefined,
          }}
        />
      </Field>

      {/* WhatsApp */}
      <Field label="WhatsApp Number" error={errors.whatsapp} icon={Phone}>
        <input
          type="tel"
          value={form.whatsapp}
          onChange={set('whatsapp')}
          placeholder="+923001234567"
          autoComplete="tel"
          className={inputClass}
          style={{
            ...inputStyle,
            borderColor: errors.whatsapp ? '#ef4444' : undefined,
          }}
        />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Include country code — e.g. +92 for Pakistan, +971 for UAE
        </p>
      </Field>

      {/* Level */}
      <Field label="Grade / Level" error={errors.level} icon={GraduationCap}>
        <select
          value={form.level}
          onChange={set('level')}
          className={inputClass}
          style={{
            ...inputStyle,
            borderColor: errors.level ? '#ef4444' : undefined,
          }}
        >
          <option value="">Select your level…</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </Field>

      {/* Subject */}
      <Field label="Subject" error={errors.subject} icon={BookOpen}>
        <select
          value={form.subject}
          onChange={set('subject')}
          className={inputClass}
          style={{
            ...inputStyle,
            borderColor: errors.subject ? '#ef4444' : undefined,
          }}
        >
          <option value="">Select a subject…</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>

      {/* API error banner */}
      <AnimatePresence>
        {status === 'error' && apiError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 rounded-xl text-sm font-medium text-red-700 bg-red-50 border border-red-200"
          >
            {apiError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={status === 'loading'}
        whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(255, 107, 53, 0.4)' }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ backgroundColor: '#FF6B35' }}
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Booking your demo…
          </>
        ) : (
          <>
            <Calendar className="w-5 h-5" />
            Book My Demo
          </>
        )}
      </motion.button>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        No spam. We&apos;ll only contact you about your demo session.
      </p>
    </motion.form>
  );
}
