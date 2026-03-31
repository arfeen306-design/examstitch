'use client';

import { useRef } from 'react';
import { Download, Printer } from 'lucide-react';
import type { DemoBooking } from '@/lib/supabase/types';

// ── Status pill colours ──────────────────────────────────────────────────────
const STATUS_STYLE: Record<DemoBooking['status'], { bg: string; text: string; label: string }> = {
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Pending'   },
  contacted: { bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'Contacted' },
  booked:    { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Booked'    },
  cancelled: { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Cancelled' },
};

function isNew(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 48 * 60 * 60 * 1000;
}

function downloadCSV(rows: DemoBooking[]) {
  const headers = ['Ref', 'Name', 'Email', 'WhatsApp', 'Level', 'Subject', 'Status', 'Date'];
  const csvRows = rows.map(b => [
    b.booking_ref,
    b.name,
    b.email ?? '',
    b.whatsapp,
    b.level,
    b.subject,
    b.status,
    new Date(b.created_at).toLocaleString('en-GB'),
  ]);
  const csv = [headers, ...csvRows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `examstitch-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BookingsClient({ rows, error }: { rows: DemoBooking[]; error?: string }) {
  const printRef = useRef<HTMLDivElement>(null);

  const total    = rows.length;
  const newCount = rows.filter(b => isNew(b.created_at)).length;
  const pending  = rows.filter(b => b.status === 'pending').length;
  const booked   = rows.filter(b => b.status === 'booked').length;

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head>
        <title>ExamStitch — Demo Bookings</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #111; }
          h2 { font-size: 20px; margin-bottom: 4px; }
          p.sub { font-size: 12px; color: #666; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f5f5f5; text-align: left; padding: 8px 10px; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; border-bottom: 2px solid #ddd; }
          td { padding: 8px 10px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #fafafa; }
          .stats { display: flex; gap: 24px; margin-bottom: 16px; }
          .stat { font-size: 12px; }
          .stat strong { font-size: 18px; display: block; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>
        <h2>ExamStitch — Demo Bookings</h2>
        <p class="sub">Exported ${new Date().toLocaleString('en-GB')}</p>
        <div class="stats">
          <div class="stat"><strong>${total}</strong>Total</div>
          <div class="stat"><strong>${newCount}</strong>New (48h)</div>
          <div class="stat"><strong>${pending}</strong>Pending</div>
          <div class="stat"><strong>${booked}</strong>Booked</div>
        </div>
        <table>
          <thead><tr><th>Ref</th><th>Name</th><th>Email</th><th>WhatsApp</th><th>Level</th><th>Subject</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            ${rows.map(b => `<tr>
              <td>${b.booking_ref}</td>
              <td>${b.name}</td>
              <td>${b.email ?? ''}</td>
              <td>${b.whatsapp}</td>
              <td>${b.level}</td>
              <td>${b.subject}</td>
              <td>${b.status}</td>
              <td>${new Date(b.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-900 tracking-tight flex items-center gap-2">
            Demo Bookings
            {newCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-orange-500 text-white">
                {newCount} New
              </span>
            )}
          </h2>
          <p className="text-sm text-navy-500">
            Submitted via the public /demo booking form.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCSV(rows)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <a
            href="/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-4 py-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 transition-colors"
          >
            View Public Form ↗
          </a>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',   value: total,    color: 'text-navy-700',   bg: 'bg-navy-50'  },
          { label: 'New',     value: newCount, color: 'text-orange-600', bg: 'bg-orange-50'},
          { label: 'Pending', value: pending,  color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Booked',  value: booked,   color: 'text-green-600',  bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-1">{s.label}</p>
            <p className={`text-3xl font-extrabold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm">
          Failed to load bookings: {error}
        </div>
      )}

      {/* Bookings table */}
      <div ref={printRef} className="bg-white p-6 rounded-2xl shadow-sm border border-navy-50">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">
          All Bookings ({total})
        </h3>
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm text-left border border-navy-50 rounded-lg">
            <thead className="text-xs uppercase bg-navy-50 text-navy-500 sticky top-0">
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50 bg-white">
              {rows.map(b => {
                const st = STATUS_STYLE[b.status];
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-navy-600">
                      {b.booking_ref}
                      {isNew(b.created_at) && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-orange-100 text-orange-600">
                          New
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-navy-900">{b.name}</td>
                    <td className="px-4 py-3 text-navy-600 text-xs">{b.email ?? '—'}</td>
                    <td className="px-4 py-3 text-navy-600 font-mono text-xs">{b.whatsapp}</td>
                    <td className="px-4 py-3">
                      <span className="bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {b.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy-700">{b.subject}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-navy-400 text-right whitespace-nowrap">
                      {new Date(b.created_at).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-navy-400">
                    No demo bookings yet. Share the /demo link to get started.
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
