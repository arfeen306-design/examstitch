import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/media/view
 * Public endpoint — increments view_count and logs the interaction.
 * Body: { widget_id: string, interaction_type?: 'view' | 'download' | 'print', student_id?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { widget_id, interaction_type = 'view', student_id } = body;

    if (!widget_id || typeof widget_id !== 'string') {
      return NextResponse.json({ error: 'widget_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Atomic increment via RPC
    const { error: rpcError } = await supabase.rpc('increment_media_view', {
      widget_id,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    // Log interaction for audit trail (fire-and-forget)
    await supabase.from('media_interactions').insert({
      widget_id,
      student_id: student_id || null,
      interaction_type,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
