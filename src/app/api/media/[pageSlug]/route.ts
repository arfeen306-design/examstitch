import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/media/[pageSlug]
 * Public endpoint — returns all active media widgets for a given page.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { pageSlug: string } },
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('media_widgets')
    .select('*')
    .eq('page_slug', params.pageSlug)
    .eq('is_active', true)
    .order('section_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
