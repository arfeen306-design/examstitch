import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

/**
 * Cache revalidation endpoint.
 *
 * Accepts GET (manual) and POST (Supabase webhook).
 *
 * Authentication: Authorization: Bearer <REVALIDATION_SECRET> header only.
 * The legacy ?secret= query parameter is no longer accepted because URL
 * parameters leak through CDN/server logs and Referer headers
 * (AUDIT_REPORT.md → Finding H-02).
 *
 * POST body from Supabase webhook contains:
 *   { type: 'INSERT'|'UPDATE'|'DELETE', table: 'resources'|'categories'|..., ... }
 */

function authenticate(request: Request): boolean {
  if (!env.REVALIDATION_SECRET) return false;
  const headerAuth = request.headers.get('authorization');
  const bearerSecret = headerAuth?.startsWith('Bearer ') ? headerAuth.slice(7) : null;
  return !!bearerSecret && bearerSecret === env.REVALIDATION_SECRET;
}

function revalidateForTable(table: string | undefined) {
  switch (table) {
    case 'resources':
      revalidateTag('resources');
      break;
    case 'categories':
      revalidateTag('categories');
      break;
    case 'blog_posts':
    case 'blogs':
      revalidateTag('blog');
      break;
    case 'subjects':
    case 'subject_papers':
      revalidateTag('subjects');
      break;
    case 'levels':
      revalidateTag('levels');
      break;
    default:
      // Unknown table or no table specified — revalidate everything
      revalidateTag('resources');
      revalidateTag('categories');
      revalidateTag('blog');
      revalidateTag('subjects');
      revalidateTag('levels');
      break;
  }
}

export async function GET(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const table = new URL(request.url).searchParams.get('table') ?? undefined;
  revalidateForTable(table);

  return NextResponse.json({ revalidated: true, table: table ?? 'all' });
}

export async function POST(request: Request) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  let table: string | undefined;
  try {
    const body = await request.json();
    table = body?.table;
  } catch {
    // No body or invalid JSON — revalidate everything
  }

  revalidateForTable(table);

  return NextResponse.json({ revalidated: true, table: table ?? 'all' });
}
