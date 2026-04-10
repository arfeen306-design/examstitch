export function toEmbedVideoUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  const url = rawUrl.trim();
  if (!url) return null;

  const driveIdMatch =
    url.match(/\/file\/d\/([^/]+)/)?.[1] ??
    url.match(/[?&]id=([^&]+)/)?.[1] ??
    null;

  if (driveIdMatch) {
    return `https://drive.google.com/file/d/${driveIdMatch}/preview`;
  }

  const ytId =
    url.match(/[?&]v=([^&]+)/)?.[1] ??
    url.match(/youtu\.be\/([^?]+)/)?.[1] ??
    null;
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}`;
  }

  return url;
}

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
