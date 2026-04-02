import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: skills, error: sErr } = await supabase
      .from('skills')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (sErr) throw sErr;

    const skillIds = (skills ?? []).map(s => s.id);

    if (skillIds.length === 0) {
      return NextResponse.json({ skills: [] });
    }

    const { data: playlists } = await supabase
      .from('skill_playlists')
      .select('*')
      .in('skill_id', skillIds)
      .order('sort_order');

    const playlistIds = (playlists ?? []).map(p => p.id);

    const { data: lessons } = playlistIds.length > 0
      ? await supabase
          .from('skill_lessons')
          .select('*')
          .in('playlist_id', playlistIds)
          .order('sort_order')
      : { data: [] };

    // Nest lessons into playlists, playlists into skills
    const result = (skills ?? []).map(skill => ({
      ...skill,
      playlists: (playlists ?? [])
        .filter(p => p.skill_id === skill.id)
        .map(playlist => ({
          ...playlist,
          lessons: (lessons ?? []).filter(l => l.playlist_id === playlist.id),
        })),
    }));

    return NextResponse.json({ skills: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
