import { createAdminClient } from '@/lib/supabase/admin';
import SubscriberCopyButton from './SubscriberCopyButton';

export const dynamic = 'force-dynamic';

export default async function AdminSubscribersPage() {
  const supabase = createAdminClient();

  const { data: subscribers, error } = await supabase
    .from('subscribers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch subscribers', error);
  }

  const emails = subscribers?.filter(s => s.is_active).map(s => s.email) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Email Subscribers</h2>
          <p className="text-sm text-[var(--text-muted)]">Captured leads from the Notify Me frontend box.</p>
        </div>
        <SubscriberCopyButton emails={emails} />
      </div>

      <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-subtle)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Subscriber List ({subscribers?.length || 0})</h3>
        
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm text-left align-middle border border-[var(--border-subtle)] rounded-lg">
            <thead className="text-xs uppercase bg-[var(--bg-surface)] text-[var(--text-muted)] sticky top-0">
              <tr>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Level Interest</th>
                <th className="px-4 py-3">Source Page</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 text-right">Date Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] bg-[var(--bg-card)]">
              {subscribers?.map((sub) => (
                <tr key={sub.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                    {sub.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                      {sub.level || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)] max-w-[200px] truncate" title={sub.source_page}>
                    {sub.source_page}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`w-2 h-2 rounded-full inline-block ${sub.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)] text-right">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!subscribers?.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    No subscribers have joined the waitlist yet.
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
