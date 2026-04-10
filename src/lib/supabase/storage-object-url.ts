/**
 * Parse Supabase Storage object URLs into bucket + object path for server-side access.
 *
 * Supports URLs produced by the dashboard and JS client:
 *   /storage/v1/object/public/{bucket}/{path}
 *   /storage/v1/object/sign/{bucket}/{path}?token=...
 *   /storage/v1/object/authenticated/{bucket}/{path}
 *
 * Service-role {@link createAdminClient} can `download()` private objects without
 * relying on public URLs or browser CORS.
 */

export interface ParsedStorageObject {
  bucket: string;
  objectPath: string;
}

export function parseSupabaseStorageObjectUrl(urlString: string): ParsedStorageObject | null {
  try {
    const u = new URL(urlString);
    const pathname = u.pathname;

    const patterns = [
      /^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/,
      /^\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/,
      /^\/storage\/v1\/object\/authenticated\/([^/]+)\/(.+)$/,
    ] as const;

    for (const re of patterns) {
      const m = pathname.match(re);
      if (m) {
        const bucket = m[1];
        const encodedPath = m[2];
        const objectPath = decodeURIComponent(encodedPath.replace(/\+/g, ' '));
        if (bucket && objectPath) return { bucket, objectPath };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** TTL for signed-URL fallback when direct download is unavailable (seconds). */
export const STORAGE_SIGNED_URL_TTL_SEC = 60 * 60;
