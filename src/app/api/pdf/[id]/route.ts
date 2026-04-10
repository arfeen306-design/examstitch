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
 *   5. Stream the (possibly watermarked) PDF with correct headers
 *      (including filename for assistive tech / save-as, nosniff).
 *
 * ?mode=worksheet   → forces worksheet_url even for video resources that have an attached PDF
 * ?inline=1         → Content-Disposition: inline  (default: attachment / download)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient }      from '@/lib/supabase/server';
import { applyWatermark }    from '@/lib/pdf/watermark';
import {
  parseSupabaseStorageObjectUrl,
  STORAGE_SIGNED_URL_TTL_SEC,
} from '@/lib/supabase/storage-object-url';

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

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Load PDF bytes from Supabase Storage (service role) or via HTTP (Drive / signed URL fallback).
 * Private buckets fail plain `fetch(publicUrl)` — use storage.download / createSignedUrl first.
 */
async function loadPdfBytes(
  adminClient: AdminClient,
  pdfUrl: string,
): Promise<
  | { ok: true; buffer: ArrayBuffer; sourceContentType: string }
  | { ok: false; message: string; status: number }
> {
  const parsed = parseSupabaseStorageObjectUrl(pdfUrl);
  if (parsed) {
    const { data: blob, error: dlErr } = await adminClient.storage
      .from(parsed.bucket)
      .download(parsed.objectPath);

    if (!dlErr && blob) {
      const buffer = await blob.arrayBuffer();
      return { ok: true, buffer, sourceContentType: 'application/pdf' };
    }

    const { data: signed, error: signErr } = await adminClient.storage
      .from(parsed.bucket)
      .createSignedUrl(parsed.objectPath, STORAGE_SIGNED_URL_TTL_SEC);

    if (!signErr && signed?.signedUrl) {
      try {
        const res = await fetch(signed.signedUrl, { cache: 'no-store', redirect: 'follow' });
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const ct = res.headers.get('content-type') || 'application/pdf';
          return { ok: true, buffer, sourceContentType: ct };
        }
        return {
          ok: false,
          message: `PDF storage returned ${res.status}.`,
          status: 502,
        };
      } catch {
        return { ok: false, message: 'Failed to fetch signed PDF URL.', status: 502 };
      }
    }

    const detail = dlErr?.message || signErr?.message || 'Could not access file in storage.';
    return { ok: false, message: detail, status: 502 };
  }

  let fetchUrl = pdfUrl;
  const driveFileMatch = pdfUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  const driveOpenMatch = pdfUrl.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  const driveId = driveFileMatch?.[1] || driveOpenMatch?.[1];
  if (driveId) {
    fetchUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
  }

  let pdfResponse: Response;
  try {
    pdfResponse = await fetch(fetchUrl, { cache: 'no-store', redirect: 'follow' });
  } catch {
    return { ok: false, message: 'Failed to fetch the PDF source.', status: 502 };
  }

  if (!pdfResponse.ok) {
    return {
      ok: false,
      message: `PDF source returned ${pdfResponse.status}. The file may have moved or its sharing permissions need to be set to "Anyone with the link."`,
      status: 502,
    };
  }

  const contentType = pdfResponse.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    return {
      ok: false,
      message:
        'The PDF source returned an HTML page instead of a PDF. Please check the file\'s sharing permissions in Google Drive — set to "Anyone with the link can view."',
      status: 502,
    };
  }

  const buffer = await pdfResponse.arrayBuffer();
  return { ok: true, buffer, sourceContentType: contentType || 'application/pdf' };
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
    // Admin bypass: either httpOnly admin_session OR client admin_mode flag
    const adminCookie = request.cookies.get('admin_session');
    const adminMode = request.cookies.get('admin_mode');
    const isAdmin = !!adminCookie?.value || adminMode?.value === '1';

    if (!isAdmin) {
      const userClient = createClient();
      const { data: { user } } = await userClient.auth.getUser();

      if (!user) {
        return errorResponse(
          'This resource requires a free ExamStitch account. Sign in at /auth/login.',
          401,
        );
      }
    }
  }

  // ── 3. Resolve the PDF URL ─────────────────────────────────────────────
  const pdfUrl = forceWorksheet
    ? resource.worksheet_url
    : (resource.worksheet_url || resource.source_url);

  if (!pdfUrl) {
    return errorResponse(
      forceWorksheet
        ? 'No worksheet PDF is attached to this resource.'
        : 'No PDF available for this resource.',
      404,
    );
  }

  // ── 4. Fetch raw PDF bytes (Supabase Storage via admin client or HTTP) ──
  const loaded = await loadPdfBytes(adminClient, pdfUrl);
  if (!loaded.ok) {
    return errorResponse(loaded.message, loaded.status);
  }
  const rawBuffer = loaded.buffer;

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

  // ── 6. Stream response (optional HTTP Range for byte-range / first-byte probes) ──
  const filename = toFilename(resource.title);
  const disposition = inline
    ? `inline; filename="${filename}"`
    : `attachment; filename="${filename}"`;

  const fullLen = finalBuffer.byteLength;
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/pdf',
    'Content-Disposition': disposition,
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Content-Security-Policy': "frame-ancestors 'self'",
    'Cache-Control': resource.is_locked
      ? 'private, no-store'
      : 'public, max-age=300, stale-while-revalidate=600',
    'X-Watermarked': String(resource.is_watermarked || resource.is_locked),
  };

  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    const m = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
    if (m) {
      let start = m[1] === '' ? null : parseInt(m[1], 10);
      let end = m[2] === '' ? null : parseInt(m[2], 10);
      if (start === null && end !== null) {
        const suffix = end;
        start = Math.max(0, fullLen - suffix);
        end = fullLen - 1;
      } else if (start !== null && end === null) {
        start = Math.min(start, fullLen - 1);
        end = fullLen - 1;
      } else if (start !== null && end !== null) {
        end = Math.min(end, fullLen - 1);
      }
      if (
        start !== null &&
        end !== null &&
        !Number.isNaN(start) &&
        !Number.isNaN(end) &&
        start <= end &&
        start < fullLen
      ) {
        const slice = finalBuffer.subarray(start, end + 1);
        return new NextResponse(Buffer.from(slice), {
          status: 206,
          headers: {
            ...baseHeaders,
            'Content-Length': String(slice.byteLength),
            'Content-Range': `bytes ${start}-${end}/${fullLen}`,
          },
        });
      }
    }
  }

  return new NextResponse(Buffer.from(finalBuffer), {
    status: 200,
    headers: {
      ...baseHeaders,
      'Content-Length': String(fullLen),
    },
  });
}
