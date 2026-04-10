import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/resources/views
 * Records a view for a resource. No auth required.
 * Rate-limited by a simple 1-per-resource-per-request check (caller should
 * debounce client-side via sessionStorage).
 *
 * Body: { resource_id: string, subject_id?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resource_id, subject_id } = body;

    if (!resource_id || typeof resource_id !== 'string') {
      return NextResponse.json({ error: 'resource_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from('resource_views').insert({
      resource_id,
      subject_id: subject_id || null,
    });

    if (error) {
      // Table may not exist yet — return 200 silently
      return NextResponse.json({ recorded: false, reason: error.message });
    }

    return NextResponse.json({ recorded: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
