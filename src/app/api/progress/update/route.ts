import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  try {
    const { resourceId, isCompleted, watchTime } = await request.json();

    if (!resourceId) {
      return NextResponse.json({ error: 'resourceId is required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Upsert progress
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        resource_id: resourceId,
        is_completed: isCompleted ?? false,
        watch_time: watchTime ?? 0,
        last_viewed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,resource_id' });

    if (error) {
      console.error('[progress/update] DB error:', error);
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }

    // Revalidate the progress cache for this user
    revalidateTag(`progress-${user.id}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[progress/update] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
