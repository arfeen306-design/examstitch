import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/supabase/guards';
import { redirect } from 'next/navigation';
import STEMManagerClient from './STEMManagerClient';

export const dynamic = 'force-dynamic';

export default async function STEMManagerPage() {
  const session = await requireSuperAdmin();
  if (!session) redirect('/admin/login');

  const supabase = createAdminClient();

  const { data: simulations } = await supabase
    .from('stem_simulations')
    .select('*')
    .order('subject', { ascending: true })
    .order('sort_order', { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">STEM Manager</h2>
        <p className="text-sm text-white/40 mt-1">
          Create and manage interactive STEM simulations. Paste HTML/Canvas code and publish live.
        </p>
      </div>

      <STEMManagerClient initialSimulations={simulations ?? []} />
    </div>
  );
}
