import { describe, it, expect } from 'vitest';
import {
  extractDriveFileId,
  toDriveStreamUrl,
  sanitizeMediaUrl,
  toEmbedUrl,
  toDownloadUrl,
} from '@/lib/url-transform';

// A representative Drive file ID (Google uses 24–44 char URL-safe base64).
const ID = '1AbCDeF_xYz12345Ghij67890klmNOPqrsT';
const SHORT_ID = '0Bz1abc23defghi45jklmno67P';
const STREAM = (id: string) => `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;

describe('extractDriveFileId', () => {
  it('extracts from /file/d/ID/view links', () => {
    expect(extractDriveFileId(`https://drive.google.com/file/d/${ID}/view?usp=sharing`)).toBe(ID);
  });

  it('extracts from /file/d/ID/preview links', () => {
    expect(extractDriveFileId(`https://drive.google.com/file/d/${ID}/preview`)).toBe(ID);
  });

  it('extracts from open?id= short links', () => {
    expect(extractDriveFileId(`https://drive.google.com/open?id=${ID}`)).toBe(ID);
  });

  it('extracts from uc?id= short links', () => {
    expect(extractDriveFileId(`https://drive.google.com/uc?id=${ID}`)).toBe(ID);
  });

  it('extracts from uc?export=download&id= already-canonical links', () => {
    expect(extractDriveFileId(`https://drive.google.com/uc?export=download&id=${ID}&confirm=t`)).toBe(ID);
  });

  it('extracts from /u/0/uc?id= multi-account links', () => {
    expect(extractDriveFileId(`https://drive.google.com/u/0/uc?id=${ID}&export=download`)).toBe(ID);
  });

  it('extracts from docs.google.com host', () => {
    expect(extractDriveFileId(`https://docs.google.com/uc?id=${ID}`)).toBe(ID);
  });

  it('handles a bare Drive file ID (admin-paste convenience)', () => {
    expect(extractDriveFileId(ID)).toBe(ID);
  });

  it('returns null for YouTube URLs', () => {
    expect(extractDriveFileId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(null);
    expect(extractDriveFileId('https://youtu.be/dQw4w9WgXcQ')).toBe(null);
  });

  it('returns null for unrelated URLs even if they contain a long token', () => {
    expect(
      extractDriveFileId(`https://example.com/path?token=${ID}`),
    ).toBe(null);
  });

  it('returns null for empty / nullish input', () => {
    expect(extractDriveFileId('')).toBe(null);
    expect(extractDriveFileId(null)).toBe(null);
    expect(extractDriveFileId(undefined)).toBe(null);
  });

  it('returns null for non-string input', () => {
    // @ts-expect-error – deliberate runtime guard test
    expect(extractDriveFileId(42)).toBe(null);
    // @ts-expect-error
    expect(extractDriveFileId({})).toBe(null);
  });

  it('handles surrounding whitespace gracefully', () => {
    expect(extractDriveFileId(`  https://drive.google.com/file/d/${SHORT_ID}/view  `)).toBe(SHORT_ID);
  });
});

describe('toDriveStreamUrl', () => {
  it('produces the canonical stream URL with confirm=t', () => {
    expect(toDriveStreamUrl(`https://drive.google.com/file/d/${ID}/view?usp=sharing`)).toBe(STREAM(ID));
  });

  it('is idempotent for an already-canonical URL', () => {
    expect(toDriveStreamUrl(STREAM(ID))).toBe(STREAM(ID));
  });

  it('returns null for non-Drive URLs', () => {
    expect(toDriveStreamUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(null);
    expect(toDriveStreamUrl('https://cdn.example.com/video.mp4')).toBe(null);
  });
});

describe('sanitizeMediaUrl', () => {
  it('rewrites Drive URLs to the stream form', () => {
    expect(sanitizeMediaUrl(`https://drive.google.com/file/d/${ID}/view?usp=sharing`)).toBe(STREAM(ID));
  });

  it('passes through YouTube URLs unchanged', () => {
    const yt = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    expect(sanitizeMediaUrl(yt)).toBe(yt);
  });

  it('passes through direct CDN URLs unchanged', () => {
    const cdn = 'https://cdn.examstitch.com/uploads/lecture.mp4';
    expect(sanitizeMediaUrl(cdn)).toBe(cdn);
  });

  it('returns "" for empty / nullish input', () => {
    expect(sanitizeMediaUrl('')).toBe('');
    expect(sanitizeMediaUrl(null)).toBe('');
    expect(sanitizeMediaUrl(undefined)).toBe('');
  });
});

describe('toDownloadUrl (legacy alias)', () => {
  it('now always includes &confirm=t — the >100 MB virus-scan flag', () => {
    expect(toDownloadUrl(`https://drive.google.com/file/d/${ID}/view`)).toBe(STREAM(ID));
  });
});

describe('toEmbedUrl', () => {
  it('builds a YouTube embed URL', () => {
    const { embedUrl, type } = toEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(type).toBe('youtube');
    expect(embedUrl).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('still returns the legacy Drive /preview shape for unknown callers', () => {
    const { embedUrl, type } = toEmbedUrl(`https://drive.google.com/file/d/${ID}/view`);
    expect(type).toBe('drive');
    expect(embedUrl).toBe(`https://drive.google.com/file/d/${ID}/preview`);
  });
});
