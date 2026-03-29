/**
 * URL Transformer Utility
 * Converts standard YouTube and Google Drive sharing URLs
 * into their embeddable/preview counterparts.
 */

export function toEmbedUrl(url: string): { embedUrl: string; type: 'youtube' | 'drive' | 'unknown' } {
  // ── YouTube ─────────────────────────────────────────────────────────────
  // Handles:
  //   https://www.youtube.com/watch?v=VIDEO_ID
  //   https://youtu.be/VIDEO_ID
  //   https://www.youtube.com/embed/VIDEO_ID (already embedded)
  //   with optional query params like &list=...
  const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = url.match(ytRegex);
  if (ytMatch) {
    const params = new URLSearchParams({
      rel: '0',              // no suggestions from other channels
      modestbranding: '1',   // minimal YouTube branding
      showinfo: '0',         // legacy: hide title bar
      controls: '1',         // keep player controls
      iv_load_policy: '3',   // hide video annotations
      enablejsapi: '1',      // enable IFrame API for end-of-video detection
      origin: 'https://examstitch.com',
    });
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?${params.toString()}`,
      type: 'youtube',
    };
  }

  // ── Google Drive ────────────────────────────────────────────────────────
  // Handles:
  //   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  //   https://drive.google.com/open?id=FILE_ID
  //   https://drive.google.com/drive/u/0/folders/FOLDER_ID (folder links)
  const driveFileRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const driveOpenRegex = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
  
  const driveFileMatch = url.match(driveFileRegex);
  if (driveFileMatch) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`,
      type: 'drive',
    };
  }
  
  const driveOpenMatch = url.match(driveOpenRegex);
  if (driveOpenMatch) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveOpenMatch[1]}/preview`,
      type: 'drive',
    };
  }

  // Folder links — just embed as-is since Google doesn't support folder previews
  if (url.includes('drive.google.com')) {
    return { embedUrl: url, type: 'drive' };
  }

  return { embedUrl: url, type: 'unknown' };
}

/**
 * Returns the original download/view URL for Google Drive files.
 */
export function toDownloadUrl(url: string): string | null {
  const driveFileRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveFileRegex);
  if (match) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return null;
}
