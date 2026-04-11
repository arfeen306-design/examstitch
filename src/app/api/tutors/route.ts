import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Public JSON API for verified tutors (backed by Supabase).
 * Same data as `/tutors` — use this for integrations; the app uses Server Components + server actions.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: tutors, error } = await supabase
      .from('tutors')
      .select('id, full_name, slug, thumbnail_url, hook_intro, specialties, locations, is_verified, created_at')
      .eq('is_verified', true)
      .order('full_name');

    if (error) throw error;

    return NextResponse.json({ tutors: tutors ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load tutors.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
