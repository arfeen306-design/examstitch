import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { playlist_id } = await req.json();
    if (!playlist_id) {
      return NextResponse.json({ error: 'playlist_id required' }, { status: 400 });
    }

    // Only track views for authenticated students
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Silently skip — unauthenticated users don't get tracked
      return NextResponse.json({ tracked: false });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('skill_playlist_views').insert({
      playlist_id,
      student_id: user.id,
    });

    if (error) {
      console.warn('View tracking error:', error.message);
      return NextResponse.json({ tracked: false });
    }

    return NextResponse.json({ tracked: true });
  } catch {
    return NextResponse.json({ tracked: false });
  }
}
