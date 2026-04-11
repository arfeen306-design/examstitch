import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: tutor, error } = await supabase
      .from('tutors')
      .select('*')
      .eq('slug', slug)
      .eq('is_verified', true)
      .maybeSingle();

    if (error) throw error;
    if (!tutor) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    return NextResponse.json({ tutor });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load tutor.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
