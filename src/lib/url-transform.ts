/**
 * URL Transformer Utility
 *
 * Two responsibilities:
 *
 *   1. **Embedding** — convert standard YouTube / Google Drive sharing URLs
 *      into the form used inside `<iframe>` players (`toEmbedUrl`). This is
 *      retained for the YouTube branch only; Drive videos and PDFs are now
 *      rendered through native HTML5 elements.
 *
 *   2. **Native streaming** — convert any standard Google Drive sharing URL
 *      (`/file/d/ID/view`, `?id=ID`, `open?id=ID`, `uc?id=ID`) into the
 *      direct-download endpoint used by `<video src>` and `<object data>`:
 *
 *          https://drive.google.com/uc?export=download&id=FILE_ID&confirm=t
 *
 *      The `&confirm=t` flag is mandatory — without it Drive returns an
 *      HTML virus-scan interstitial for any file > 100 MB, which native
 *      `<video>` / `<object>` cannot handle and silently fails.
 */

// ── Drive ID extraction ─────────────────────────────────────────────────────

/**
 * Drive file IDs are URL-safe base64-ish strings of length ≥ 24
 * (typically 28–44 chars). The character class below accepts the full
 * range Google uses without being too permissive.
 *
 * Recognised URL shapes:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/file/d/FILE_ID/preview
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID
 *   https://drive.google.com/uc?export=download&id=FILE_ID&confirm=t
 *   https://drive.google.com/u/0/uc?id=FILE_ID&export=download
 *   https://docs.google.com/uc?id=FILE_ID  (legacy short form)
 *   FILE_ID                                 (bare id, defensive)
 */
const DRIVE_FILE_ID_PATTERN = /[a-zA-Z0-9_-]{24,}/;

const DRIVE_PATH_PATTERNS: RegExp[] = [
  /\/file\/d\/([a-zA-Z0-9_-]{24,})/,         // /file/d/FILE_ID/...
  /[?&]id=([a-zA-Z0-9_-]{24,})/,             // ?id=FILE_ID  or  &id=FILE_ID
  /\/d\/([a-zA-Z0-9_-]{24,})/,               // legacy /d/FILE_ID
];

/**
 * Extracts the Google Drive file ID from any standard sharing URL.
 * Returns `null` if the input does not look like a Drive URL.
 *
 * @example
 *   extractDriveFileId('https://drive.google.com/file/d/1AbC.../view?usp=sharing')
 *   //=> '1AbC...'
 *   extractDriveFileId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
 *   //=> null
 */
export function extractDriveFileId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Only consider Google-hosted URLs (drive.google.com, docs.google.com)
  // — never extract IDs from arbitrary URLs that happen to contain a long
  // base64-ish string in their query.
  if (!/(?:^|\/\/)(?:[a-z0-9-]+\.)?(?:google|googleusercontent)\.com\//i.test(trimmed)) {
    // Permit bare IDs (admin convenience) only when the input *is* just an ID.
    if (DRIVE_FILE_ID_PATTERN.test(trimmed) && /^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  for (const pattern of DRIVE_PATH_PATTERNS) {
    const m = trimmed.match(pattern);
    if (m && m[1]) return m[1];
  }
  return null;
}

// ── Native stream URL ───────────────────────────────────────────────────────

/**
 * Returns the direct-stream Drive URL suitable for native `<video>` and
 * `<object type="application/pdf">` elements. The `&confirm=t` flag is
 * always appended so files > 100 MB skip Drive's virus-scan interstitial.
 *
 * Returns `null` for non-Drive URLs — callers should treat that as
 * "use the URL as-is" (e.g. a direct CDN link, Vimeo, etc.).
 */
export function toDriveStreamUrl(url: string | null | undefined): string | null {
  const id = extractDriveFileId(url);
  if (!id) return null;
  return `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;
}

/**
 * Pass-through URL sanitiser used by the admin write pipeline and
 * runtime renderer. Drive URLs are normalised to the direct-stream
 * endpoint; every other URL (YouTube, CDN, Vimeo, signed Supabase
 * storage, etc.) is returned untouched.
 *
 * @example
 *   sanitizeMediaUrl('https://drive.google.com/file/d/abc/view?usp=sharing')
 *   //=> 'https://drive.google.com/uc?export=download&id=abc&confirm=t'
 *   sanitizeMediaUrl('https://youtu.be/xxx')
 *   //=> 'https://youtu.be/xxx'  (unchanged)
 */
export function sanitizeMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  return toDriveStreamUrl(url) ?? url;
}

/**
 * Returns Drive's **iframe-embed** URL for the given file. This is the
 * preferred shape for cross-origin embedding because Drive serves the
 * `/preview` route with permissive `X-Frame-Options` and bypasses the
 * CORS-driven media-element block that affects `uc?export=download`.
 *
 *     https://drive.google.com/file/d/FILE_ID/preview
 *
 * Use for `<iframe src>`. For server-side byte streaming or for
 * download CTAs, keep `toDriveStreamUrl` (which has `&confirm=t`).
 * Returns `null` for non-Drive URLs.
 */
export function toDrivePreviewUrl(url: string | null | undefined): string | null {
  const id = extractDriveFileId(url);
  if (!id) return null;
  return `https://drive.google.com/file/d/${id}/preview`;
}

// ── YouTube + legacy embed helper (kept for the YouTube branch) ─────────────

export function toEmbedUrl(url: string): { embedUrl: string; type: 'youtube' | 'drive' | 'unknown' } {
  // ── YouTube ─────────────────────────────────────────────────────────────
  const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = url.match(ytRegex);
  if (ytMatch) {
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      showinfo: '0',
      controls: '1',
      iv_load_policy: '3',
      enablejsapi: '1',
      origin: 'https://examstitch.com',
    });
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?${params.toString()}`,
      type: 'youtube',
    };
  }

  // ── Google Drive ────────────────────────────────────────────────────────
  // Drive videos and PDFs are now rendered through native HTML5 elements
  // via `toDriveStreamUrl`. The legacy `/preview` iframe shape is kept here
  // as a last-ditch fallback for any caller that still passes through.
  const driveId = extractDriveFileId(url);
  if (driveId) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      type: 'drive',
    };
  }

  // Folder links — embed as-is; Drive does not preview folders.
  if (url.includes('drive.google.com')) {
    return { embedUrl: url, type: 'drive' };
  }

  return { embedUrl: url, type: 'unknown' };
}

/**
 * Returns the direct download/view URL for Google Drive files.
 *
 * Historically this omitted `&confirm=t`, which broke any file > 100 MB
 * (Drive serves an HTML virus-scan page instead of the binary). The flag
 * is now always included, so this function and `toDriveStreamUrl` are
 * functionally equivalent — `toDownloadUrl` is retained for caller
 * source-stability only.
 */
export function toDownloadUrl(url: string): string | null {
  return toDriveStreamUrl(url);
}
