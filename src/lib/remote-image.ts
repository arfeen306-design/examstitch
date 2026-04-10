/**
 * Returns true when `url` matches a host/path covered by `next.config.js` images.remotePatterns.
 * Used to decide `next/image` `unoptimized` for arbitrary CMS URLs.
 */
export function isNextConfiguredRemoteImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const h = u.hostname;
    if (h === 'img.youtube.com' || h === 'i.ytimg.com') return true;
    if (h === 'drive.google.com') return true;
    if (h.endsWith('.googleusercontent.com')) return true;
    if (h.endsWith('.supabase.co') && u.pathname.startsWith('/storage/v1/object/')) return true;
    return false;
  } catch {
    return false;
  }
}
