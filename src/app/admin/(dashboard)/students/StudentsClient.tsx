'use client';

import { useState } from 'react';
import { Plus, Copy, Check, UserX, UserCheck, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import type { StudentAccount } from '@/lib/supabase/types';

const LEVELS = ['Pre O-Level', 'O-Level / IGCSE', 'AS Level', 'A2 Level'];

interface NewStudent {
  full_name: string;
  email: string;
  level: string;
}

export default function StudentsClient({ rows: initial, error }: { rows: StudentAccount[]; error?: string }) {
  const [rows, setRows] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewStudent>({ full_name: '', email: '', level: '' });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [createdPassword, setCreatedPassword] = useState('');
  const [createdName, setCreatedName] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const active = rows.filter(r => r.is_active).length;
  const inactive = rows.filter(r => !r.is_active).length;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.full_name.trim()) { setFormError('Name is required.'); return; }
    if (!form.email.trim()) { setFormError('Email is required.'); return; }
    if (!form.level) { setFormError('Level is required.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json.error || 'Failed to create student.'); return; }

      setCreatedPassword(json.password);
      setCreatedName(form.full_name);
      setRows(prev => [json.student, ...prev]);
      setForm({ full_name: '', email: '', level: '' });
      setShowForm(false);
    } catch {
      setFormError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    setActionLoading(id);
    try {
      await fetch('/api/admin/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !active }),
      });
      setRows(prev => prev.map(r => r.id === id ? { ...r, is_active: !active } : r));
    } finally {
      setActionLoading(null);
    }
  }

  async function resetPassword(id: string, name: string) {
    if (!confirm(`Reset password for ${name}? A new password will be generated.`)) return;
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reset_password: true }),
      });
      const json = await res.json();
      if (res.ok && json.password) {
        setShowPasswords(prev => ({ ...prev, [id]: json.password }));
        setCreatedPassword(json.password);
        setCreatedName(name);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteStudent(id: string, name: string) {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      await fetch('/api/admin/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setRows(prev => prev.filter(r => r.id !== id));
    } finally {
      setActionLoading(null);
    }
  }

  function copyPassword(password: string) {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Student Accounts</h2>
          <p className="text-sm text-white/40">
            Create and manage login credentials for students.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setCreatedPassword(''); }}
          className="flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-lg text-white transition-colors"
          style={{ backgroundColor: '#FF6B35' }}
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: rows.length, color: 'text-white/60', bg: 'bg-white/[0.03]' },
          { label: 'Active', value: active, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Disabled', value: inactive, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">{s.label}</p>
            <p className={`text-3xl font-extrabold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Generated Password Banner */}
      {createdPassword && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-5">
          <p className="text-sm font-semibold text-green-800 mb-2">
            ✅ Credentials for {createdName}:
          </p>
          <div className="flex items-center gap-3 bg-white/[0.04] border border-green-200 rounded-xl px-4 py-3">
            <code className="text-sm font-mono text-green-800 flex-1">
              Password: <strong>{createdPassword}</strong>
            </code>
            <button
              onClick={() => copyPassword(createdPassword)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-green-600 mt-2">
            ⚠ Save this password now — it cannot be viewed again after you leave this page.
          </p>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/[0.04] rounded-2xl border border-white/[0.08] p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">New Student Account</h3>
          <p className="text-sm text-white/40">A random password will be generated automatically.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-white/60 block mb-1">Full Name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="e.g. Ahmed Khan"
                className="w-full px-4 py-2.5 rounded-xl text-sm border border-white/[0.08] focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/60 block mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="student@example.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm border border-white/[0.08] focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/60 block mb-1">Level</label>
              <select
                value={form.level}
                onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm border border-white/[0.08] focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
              >
                <option value="">Select level…</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-600 font-medium">{formError}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-60 transition-colors"
              style={{ backgroundColor: '#FF6B35' }}
            >
              {loading ? 'Creating…' : 'Create Account & Generate Password'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium border border-white/[0.08] text-white/50 hover:bg-white/[0.03] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm">
          Failed to load students: {error}
        </div>
      )}

      {/* Students table */}
      <div className="bg-white/[0.04] p-6 rounded-2xl shadow-sm border border-white/[0.06]">
        <h3 className="text-lg font-semibold text-white mb-4">All Students ({rows.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-white/[0.06] rounded-lg">
            <thead className="text-xs uppercase bg-white/[0.03] text-white/40 sticky top-0">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] bg-white/[0.04]">
              {rows.map(s => (
                <tr key={s.id} className="hover:bg-white/[0.06] transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{s.full_name}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">{s.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-white/[0.06] text-white/60 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {s.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {s.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">
                    {s.last_login
                      ? new Date(s.last_login).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">
                    {new Date(s.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {showPasswords[s.id] && (
                        <span className="font-mono text-xs text-green-700 bg-green-50 px-2 py-1 rounded mr-1">{showPasswords[s.id]}</span>
                      )}
                      <button
                        onClick={() => resetPassword(s.id, s.full_name)}
                        disabled={actionLoading === s.id}
                        title="Reset password"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors disabled:opacity-40"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(s.id, s.is_active)}
                        disabled={actionLoading === s.id}
                        title={s.is_active ? 'Disable account' : 'Enable account'}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${s.is_active ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-green-50 text-green-600'}`}
                      >
                        {s.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteStudent(s.id, s.full_name)}
                        disabled={actionLoading === s.id}
                        title="Delete"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-white/40">
                    No student accounts yet. Click &quot;Add Student&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
