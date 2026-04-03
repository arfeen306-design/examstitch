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
          <h2 className="text-2xl font-bold text-white tracking-tight">Email Subscribers</h2>
          <p className="text-sm text-white/40">Captured leads from the Notify Me frontend box.</p>
        </div>
        <SubscriberCopyButton emails={emails} />
      </div>

      <div className="bg-white/[0.04] p-6 rounded-2xl shadow-sm border border-white/[0.06]">
        <h3 className="text-lg font-semibold text-white mb-4">Subscriber List ({subscribers?.length || 0})</h3>
        
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm text-left align-middle border border-white/[0.06] rounded-lg">
            <thead className="text-xs uppercase bg-white/[0.03] text-white/40 sticky top-0">
              <tr>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Level Interest</th>
                <th className="px-4 py-3">Source Page</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 text-right">Date Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] bg-white/[0.04]">
              {subscribers?.map((sub) => (
                <tr key={sub.id} className="hover:bg-white/[0.06] transition-colors">
                  <td className="px-4 py-3 font-medium text-white">
                    {sub.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-white/[0.06] text-white/60 px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                      {sub.level || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40 max-w-[200px] truncate" title={sub.source_page}>
                    {sub.source_page}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`w-2 h-2 rounded-full inline-block ${sub.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                  </td>
                  <td className="px-4 py-3 text-xs text-white/30 text-right">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!subscribers?.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/30">
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
