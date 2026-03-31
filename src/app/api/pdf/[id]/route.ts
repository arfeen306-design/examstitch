/**
 * GET /api/pdf/[id]
 *
 * Serves a PDF resource with optional watermarking.
 *
 * Logic:
 *   1. Fetch the resource row from Supabase (admin key — bypasses RLS).
 *   2. If resource.is_locked  → require an authenticated session; 401 if missing.
 *   3. Fetch the raw PDF bytes from the stored URL (worksheet_url for PDFs/worksheets,
 *      source_url otherwise).
 *   4. If resource.is_watermarked OR resource.is_locked → pipe bytes through
 *      applyWatermark() before streaming to the client.
 *   5. Stream the (possibly watermarked) PDF with correct headers.
 *
 * ?mode=worksheet   → forces worksheet_url even for video resources that have an attached PDF
 * ?inline=1         → Content-Disposition: inline  (default: attachment / download)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient }      from '@/lib/supabase/server';
import { applyWatermark }    from '@/lib/pdf/watermark';

// ── Helpers ────────────────────────────────────────────────────────────────

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Derive a safe filename from the resource title.
 * "mj2024 Paper 1 — ExamStitch" → "mj2024_paper_1_examstitch.pdf"
 */
function toFilename(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 80) + '.pdf'
  );
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const { searchParams } = request.nextUrl;
  const forceWorksheet = searchParams.get('mode') === 'worksheet';
  const inline         = searchParams.get('inline') === '1';

  // ── 1. Fetch resource metadata ─────────────────────────────────────────
  const adminClient = createAdminClient();
  const { data: resource, error } = await adminClient
    .from('resources')
    .select('id, title, content_type, source_url, worksheet_url, is_locked, is_watermarked, is_published')
    .eq('id', id)
    .single();

  if (error || !resource) {
    return errorResponse('Resource not found.', 404);
  }

  if (!resource.is_published) {
    return errorResponse('Resource is not available.', 404);
  }

  // ── 2. Auth gate for locked resources ──────────────────────────────────
  if (resource.is_locked) {
    const userClient = createClient();
    const { data: { user } } = await userClient.auth.getUser();

    if (!user) {
      return errorResponse(
        'This resource requires a free ExamStitch account. Sign in at /auth/login.',
        401,
      );
    }
  }

  // ── 3. Resolve the PDF URL ─────────────────────────────────────────────
  const pdfUrl =
    forceWorksheet && resource.worksheet_url
      ? resource.worksheet_url
      : resource.worksheet_url && resource.content_type !== 'video'
      ? resource.worksheet_url
      : resource.source_url;

  if (!pdfUrl) {
    return errorResponse('No PDF available for this resource.', 404);
  }

  // ── 4. Fetch raw PDF bytes ─────────────────────────────────────────────
  let pdfResponse: Response;
  try {
    pdfResponse = await fetch(pdfUrl, { cache: 'no-store' });
  } catch {
    return errorResponse('Failed to fetch the PDF source.', 502);
  }

  if (!pdfResponse.ok) {
    return errorResponse(
      `PDF source returned ${pdfResponse.status}. The file may have moved.`,
      502,
    );
  }

  const rawBuffer = await pdfResponse.arrayBuffer();

  // ── 5. Watermark if required ───────────────────────────────────────────
  // Watermark is applied when either flag is true:
  //   • is_watermarked  → admin explicitly enabled watermarking
  //   • is_locked       → locked PDFs are always watermarked to deter sharing
  let finalBuffer: Uint8Array;
  if (resource.is_watermarked || resource.is_locked) {
    try {
      finalBuffer = await applyWatermark(rawBuffer);
    } catch (err) {
      console.error('[pdf/watermark] Failed to watermark PDF:', err);
      // Fall back to raw PDF rather than returning an error — better UX
      finalBuffer = new Uint8Array(rawBuffer);
    }
  } else {
    finalBuffer = new Uint8Array(rawBuffer);
  }

  // ── 6. Stream response ─────────────────────────────────────────────────
  const filename    = toFilename(resource.title);
  const disposition = inline ? 'inline' : `attachment; filename="${filename}"`;

  return new NextResponse(Buffer.from(finalBuffer), {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': disposition,
      'Content-Length':      String(finalBuffer.byteLength),
      // Prevent CDN from caching authenticated/watermarked PDFs
      'Cache-Control':       resource.is_locked
        ? 'private, no-store'
        : 'public, max-age=300, stale-while-revalidate=600',
      'X-Watermarked':       String(resource.is_watermarked || resource.is_locked),
    },
  });
}
