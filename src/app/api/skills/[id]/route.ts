import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: skill, error: sErr } = await supabase
      .from('skills')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (sErr || !skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    const { data: playlists } = await supabase
      .from('skill_playlists')
      .select('*')
      .eq('skill_id', skill.id)
      .order('sort_order');

    const playlistIds = (playlists ?? []).map(p => p.id);

    const { data: lessons } = playlistIds.length > 0
      ? await supabase
          .from('skill_lessons')
          .select('*')
          .in('playlist_id', playlistIds)
          .order('sort_order')
      : { data: [] };

    return NextResponse.json({
      skill: {
        ...skill,
        playlists: (playlists ?? []).map(playlist => ({
          ...playlist,
          lessons: (lessons ?? []).filter(l => l.playlist_id === playlist.id),
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
