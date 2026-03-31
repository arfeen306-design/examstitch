import { createAdminClient } from '@/lib/supabase/admin';
import type { DemoBooking } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

// ── Status pill colours ──────────────────────────────────────────────────────
const STATUS_STYLE: Record<DemoBooking['status'], { bg: string; text: string; label: string }> = {
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Pending'   },
  contacted: { bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'Contacted' },
  booked:    { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Booked'    },
  cancelled: { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Cancelled' },
};

// ── "NEW" — bookings created in the last 48 h ────────────────────────────────
function isNew(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 48 * 60 * 60 * 1000;
}

export default async function AdminBookingsPage() {
  const supabase = createAdminClient();

  const { data: bookings, error } = await supabase
    .from('demo_bookings')
    .select('*')
    .order('created_at', { ascending: false });

  const rows = (bookings as DemoBooking[] | null) ?? [];

  const sheetEmbedUrl = process.env.GOOGLE_SHEET_EMBED_URL ?? '';

  // Stats
  const total     = rows.length;
  const newCount  = rows.filter(b => isNew(b.created_at)).length;
  const pending   = rows.filter(b => b.status === 'pending').length;
  const booked    = rows.filter(b => b.status === 'booked').length;

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
        <a
          href="/demo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold px-4 py-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 transition-colors"
        >
          View Public Form ↗
        </a>
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
          Failed to load bookings: {error.message}
        </div>
      )}

      {/* Bookings table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-navy-50">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">
          All Bookings ({total})
        </h3>
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm text-left border border-navy-50 rounded-lg">
            <thead className="text-xs uppercase bg-navy-50 text-navy-500 sticky top-0">
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Name</th>
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
                  <td colSpan={7} className="px-4 py-10 text-center text-navy-400">
                    No demo bookings yet. Share the /demo link to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Sheet embed */}
      {sheetEmbedUrl ? (
        <div className="bg-white rounded-2xl shadow-sm border border-navy-50 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-navy-50">
            <h3 className="text-lg font-semibold text-navy-900">Live Google Sheet</h3>
            <a
              href={sheetEmbedUrl.replace('/pubhtml', '/edit')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-navy-600 hover:text-navy-900 transition-colors"
            >
              Open in Google Sheets ↗
            </a>
          </div>
          <iframe
            src={sheetEmbedUrl}
            className="w-full"
            style={{ height: '520px', border: 'none' }}
            title="Demo Bookings Google Sheet"
          />
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5">
          <p className="text-sm font-semibold text-amber-800 mb-1">Google Sheet not configured</p>
          <p className="text-sm text-amber-700">
            Set{' '}
            <code className="px-1 py-0.5 bg-amber-100 rounded text-xs font-mono">GOOGLE_SHEET_EMBED_URL</code>
            {' '}in your environment variables to embed the sheet here.
            The URL should be the published embed URL from{' '}
            <strong>File → Share → Publish to web → Embed</strong>.
          </p>
          <p className="text-sm text-amber-700 mt-2">
            Also set{' '}
            <code className="px-1 py-0.5 bg-amber-100 rounded text-xs font-mono">GOOGLE_SHEETS_WEBHOOK_URL</code>
            {' '}to the Google Apps Script Web App <code className="text-xs">/exec</code> URL
            so new bookings are pushed to the sheet automatically.
          </p>
        </div>
      )}
    </div>
  );
}
