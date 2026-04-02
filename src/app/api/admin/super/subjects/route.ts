import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/supabase/guards';

// ── GET /api/admin/super/subjects — List all subjects ───────────────────────
export async function GET() {
  try {
    const session = await requireSuperAdmin();
    if (!session) return NextResponse.json({ error: 'Super-admin access required.' }, { status: 403 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[super/subjects] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch subjects.' }, { status: 500 });
    }

    return NextResponse.json({ subjects: data });
  } catch (err) {
    console.error('[super/subjects] GET error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
