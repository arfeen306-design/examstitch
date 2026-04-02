import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // ISR: revalidate every hour

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc('get_trending_playlists', {
      limit_count: 5,
    });

    if (error) {
      // Function may not exist yet (migration not run) — return empty
      console.warn('get_trending_playlists RPC error:', error.message);
      return NextResponse.json({ trending: [], fallback: true });
    }

    return NextResponse.json(
      { trending: data ?? [], fallback: false },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        },
      },
    );
  } catch (err: any) {
    return NextResponse.json({ trending: [], fallback: true }, { status: 200 });
  }
}
