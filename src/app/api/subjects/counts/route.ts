import { NextRequest, NextResponse } from 'next/server';
import { countResourcesForSubjects } from '@/lib/supabase/queries';

/**
 * GET /api/subjects/counts?slugs=mathematics-4024,computer-science-0478
 *
 * Returns { counts: { "mathematics-4024": 42, "computer-science-0478": 18 } }
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('slugs') ?? '';
  const slugs = raw.split(',').map(s => s.trim()).filter(Boolean);

  if (slugs.length === 0) {
    return NextResponse.json({ counts: {} });
  }

  // Cap at 20 slugs to prevent abuse
  const capped = slugs.slice(0, 20);
  const counts = await countResourcesForSubjects(capped);
  return NextResponse.json({ counts });
}
