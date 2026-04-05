'use client';

import { useState, useMemo } from 'react';
import { Download, Printer, Trash2, ChevronDown, X } from 'lucide-react';
import type { DemoBooking } from '@/lib/supabase/types';

// ── Status config ─────────────────────────────────────────────────────────────
type Status = DemoBooking['status'];

const STATUS_STYLE: Record<Status, { bg: string; text: string; label: string; dot: string }> = {
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Pending',   dot: 'bg-amber-400'  },
  contacted: { bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'Contacted', dot: 'bg-blue-400'   },
  booked:    { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Booked',    dot: 'bg-green-500'  },
  cancelled: { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Cancelled', dot: 'bg-red-400'    },
};
const ALL_STATUSES: Status[] = ['pending', 'contacted', 'booked', 'cancelled'];

function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 48 * 60 * 60 * 1000;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function downloadCSV(rows: DemoBooking[]) {
  const headers = ['Ref', 'Name', 'Email', 'WhatsApp', 'Level', 'Subject', 'Status', 'Date'];
  const csv = [headers, ...rows.map(b => [
    b.booking_ref, b.name, b.email ?? '', b.whatsapp,
    b.level, b.subject, b.status,
    new Date(b.created_at).toLocaleString('en-GB'),
  ])].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: `bookings-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  a.click();
}

function buildPrintHTML(rows: DemoBooking[], filterLabel: string) {
  return `<!DOCTYPE html><html><head><title>ExamStitch — Demo Bookings</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;color:#111;font-size:12px}
    h2{font-size:18px;margin-bottom:2px}
    .meta{color:#666;font-size:11px;margin-bottom:16px}
    .stats{display:flex;gap:20px;margin-bottom:16px}
    .stat strong{font-size:20px;display:block;font-weight:700}
    table{width:100%;border-collapse:collapse}
    th{background:#f5f5f5;text-align:left;padding:7px 10px;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.4px;border-bottom:2px solid #ddd}
    td{padding:7px 10px;border-bottom:1px solid #eee}
    tr:nth-child(even) td{background:#fafafa}
    @media print{body{padding:0}}
  </style></head><body>
  <h2>ExamStitch — Demo Bookings</h2>
  <p class="meta">Printed ${new Date().toLocaleString('en-GB')}${filterLabel ? ' · Filters: ' + filterLabel : ''}</p>
  <div class="stats">
    <div class="stat"><strong>${rows.length}</strong>Shown</div>
    <div class="stat"><strong>${rows.filter(b => b.status === 'pending').length}</strong>Pending</div>
    <div class="stat"><strong>${rows.filter(b => b.status === 'booked').length}</strong>Booked</div>
  </div>
  <table>
    <thead><tr><th>Ref</th><th>Name</th><th>Email</th><th>WhatsApp</th><th>Level</th><th>Subject</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>${rows.map(b => `<tr>
      <td>${b.booking_ref}</td><td>${b.name}</td><td>${b.email ?? ''}</td>
      <td>${b.whatsapp}</td><td>${b.level}</td><td>${b.subject}</td>
      <td>${STATUS_STYLE[b.status].label}</td>
      <td>${new Date(b.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
    </tr>`).join('')}</tbody>
  </table></body></html>`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BookingsClient({ rows: initial, error }: { rows: DemoBooking[]; error?: string }) {
  const [rows, setRows]             = useState(initial);
  const [actionLoading, setAL]      = useState<string | null>(null);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [filterStatus,  setFStatus]  = useState<string>('');
  const [filterLevel,   setFLevel]   = useState<string>('');
  const [filterSubject, setFSubject] = useState<string>('');
  const [filterMonth,   setFMonth]   = useState<string>('');  // "YYYY-MM"

  // Unique values for filter dropdowns
  const levels   = useMemo(() => [...new Set(rows.map(b => b.level))].sort(),   [rows]);
  const subjects = useMemo(() => [...new Set(rows.map(b => b.subject))].sort(), [rows]);
  const months   = useMemo(() => {
    const m = [...new Set(rows.map(b => b.created_at.slice(0, 7)))].sort().reverse();
    return m;
  }, [rows]);

  const filtered = useMemo(() => rows.filter(b => {
    if (filterStatus  && b.status !== filterStatus)                 return false;
    if (filterLevel   && b.level  !== filterLevel)                  return false;
    if (filterSubject && b.subject !== filterSubject)               return false;
    if (filterMonth   && !b.created_at.startsWith(filterMonth))     return false;
    return true;
  }), [rows, filterStatus, filterLevel, filterSubject, filterMonth]);

  const hasFilter = filterStatus || filterLevel || filterSubject || filterMonth;

  function clearFilters() {
    setFStatus(''); setFLevel(''); setFSubject(''); setFMonth('');
  }

  function filterLabel() {
    const parts = [];
    if (filterStatus)  parts.push(STATUS_STYLE[filterStatus as Status]?.label ?? filterStatus);
    if (filterLevel)   parts.push(filterLevel);
    if (filterSubject) parts.push(filterSubject);
    if (filterMonth) {
      const [y, m] = filterMonth.split('-');
      parts.push(new Date(+y, +m - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' }));
    }
    return parts.join(', ');
  }

  // Stats from all rows (not filtered)
  const total    = rows.length;
  const newCount = rows.filter(b => isNew(b.created_at)).length;
  const pending  = rows.filter(b => b.status === 'pending').length;
  const booked   = rows.filter(b => b.status === 'booked').length;

  // ── Actions ──────────────────────────────────────────────────────────────────
  async function updateStatus(id: string, status: Status) {
    setAL(id);
    try {
      await fetch('/api/demo-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } finally { setAL(null); }
  }

  async function deleteBooking(id: string, ref: string) {
    if (!confirm(`Delete booking ${ref}? This cannot be undone.`)) return;
    setAL(id);
    try {
      await fetch('/api/demo-bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setRows(prev => prev.filter(r => r.id !== id));
    } finally { setAL(null); }
  }

  function handlePrint() {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildPrintHTML(filtered, filterLabel()));
    win.document.close();
    win.print();
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Demo Bookings
            {newCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-orange-500 text-white">
                {newCount} New
              </span>
            )}
          </h2>
          <p className="text-sm text-white/40">Submitted via the public /demo booking form.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => downloadCSV(filtered)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-white/[0.08] text-white/50 hover:bg-white/[0.03] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV {hasFilter && `(${filtered.length})`}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-white/[0.08] text-white/50 hover:bg-white/[0.03] transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print {hasFilter && `(${filtered.length})`}
          </button>
          <a href="/demo" target="_blank" rel="noopener noreferrer"
            className="text-xs font-semibold px-4 py-2 rounded-lg border border-white/[0.08] text-white/50 hover:bg-white/[0.03] transition-colors"
          >
            View Public Form ↗
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',   value: total,    color: 'text-white/60',   bg: 'bg-white/[0.03]'   },
          { label: 'New',     value: newCount, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Pending', value: pending,  color: 'text-amber-600',  bg: 'bg-amber-50'  },
          { label: 'Booked',  value: booked,   color: 'text-green-600',  bg: 'bg-green-50'  },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">{s.label}</p>
            <p className={`text-3xl font-extrabold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/[0.04] rounded-2xl border border-white/[0.08] px-5 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Filter:</span>

          {/* Status */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-white/[0.08] text-sm text-white/60 bg-white/[0.04] focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_STYLE[s].label}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>

          {/* Level */}
          <div className="relative">
            <select
              value={filterLevel}
              onChange={e => setFLevel(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-white/[0.08] text-sm text-white/60 bg-white/[0.04] focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none cursor-pointer"
            >
              <option value="">All Levels</option>
              {levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>

          {/* Subject */}
          <div className="relative">
            <select
              value={filterSubject}
              onChange={e => setFSubject(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-white/[0.08] text-sm text-white/60 bg-white/[0.04] focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none cursor-pointer"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>

          {/* Month */}
          <div className="relative">
            <select
              value={filterMonth}
              onChange={e => setFMonth(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-white/[0.08] text-sm text-white/60 bg-white/[0.04] focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none cursor-pointer"
            >
              <option value="">All Months</option>
              {months.map(m => {
                const [y, mo] = m.split('-');
                const label = new Date(+y, +mo - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
                return <option key={m} value={m}>{label}</option>;
              })}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>

          {hasFilter && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-white/[0.06] text-white/50 hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}

          {hasFilter && (
            <span className="text-xs text-white/40 ml-auto">
              Showing <strong className="text-white/60">{filtered.length}</strong> of {total}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm">
          Failed to load bookings: {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white/[0.04] rounded-2xl shadow-sm border border-white/[0.06] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white">
            {hasFilter ? `Filtered Bookings (${filtered.length})` : `All Bookings (${total})`}
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-white/[0.03] text-white/40 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filtered.map(b => {
                const st = STATUS_STYLE[b.status];
                const busy = actionLoading === b.id;
                return (
                  <tr key={b.id} className={`hover:bg-white/[0.06] transition-colors ${busy ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-white/50 whitespace-nowrap">
                      {b.booking_ref}
                      {isNew(b.created_at) && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-orange-100 text-orange-600">New</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{b.name}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{b.email ?? '—'}</td>
                    <td className="px-4 py-3 text-white/50 font-mono text-xs whitespace-nowrap">{b.whatsapp}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bg-white/[0.06] text-white/60 px-2 py-0.5 rounded-full text-xs font-semibold">{b.level}</span>
                    </td>
                    <td className="px-4 py-3 text-white/60">{b.subject}</td>

                    {/* Editable status dropdown */}
                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-block">
                        <select
                          value={b.status}
                          disabled={busy}
                          onChange={e => updateStatus(b.id, e.target.value as Status)}
                          className={`appearance-none pl-2.5 pr-7 py-1 rounded-full text-xs font-bold border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 outline-none transition-all ${st.bg} ${st.text}`}
                        >
                          {ALL_STATUSES.map(s => (
                            <option key={s} value={s}>{STATUS_STYLE[s].label}</option>
                          ))}
                        </select>
                        <ChevronDown className={`w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${st.text}`} />
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-white/40 text-right whitespace-nowrap">
                      {new Date(b.created_at).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteBooking(b.id, b.booking_ref)}
                        disabled={busy}
                        title="Delete booking"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-white/40">
                    {hasFilter ? 'No bookings match the selected filters.' : 'No demo bookings yet.'}
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
