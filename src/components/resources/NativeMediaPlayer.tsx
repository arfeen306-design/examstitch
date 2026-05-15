'use client';

/**
 * NativeMediaPlayer
 * ─────────────────
 * Renders Google Drive media (videos + PDFs) through **native HTML5 elements**
 * rather than the slow `/preview` iframe. Buffers faster, scales better on
 * mobile, and never triggers Drive's 100 MB virus-scan interstitial because
 * the stream URL is built by `toDriveStreamUrl` which always appends
 * `&confirm=t`.
 *
 * For non-Drive URLs (YouTube, direct CDN, Vimeo) the parent component
 * should use its existing renderer — this player is the Drive-specific path.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Download, ExternalLink } from 'lucide-react';
import { sanitizeMediaUrl } from '@/lib/url-transform';

type MediaKind = 'video' | 'pdf';

interface NativeMediaPlayerProps {
  /** Raw URL as stored in the DB (sanitised at render time for legacy rows). */
  url: string;
  /** Accessible title for the element. */
  title: string;
  /** Video poster / PDF placeholder image (optional). */
  poster?: string;
  kind: MediaKind;
  /** Optional MIME — overrides the default (`video/mp4`, `application/pdf`). */
  mimeType?: string;
  className?: string;
  /** Aspect ratio for video (default 16/9). PDFs use min-height instead. */
  aspectRatio?: string;
  /** Min height for the PDF object container (default 80vh). */
  pdfMinHeight?: string;
  /** Fires once when the video finishes playing (video only). */
  onEnded?: () => void;
  /**
   * Fires roughly every `progressIntervalMs` while the video is playing
   * (video only). Receives the current playback time in **whole seconds**.
   * Wire this to `/api/progress/update` for watch-time persistence.
   */
  onProgress?: (currentTimeSec: number) => void;
  /** Throttle window for `onProgress`. Defaults to 30 000 ms — matches the YT path. */
  progressIntervalMs?: number;
}

export default function NativeMediaPlayer({
  url,
  title,
  poster,
  kind,
  mimeType,
  className,
  aspectRatio = '16 / 9',
  pdfMinHeight = '80vh',
  onEnded,
  onProgress,
  progressIntervalMs = 30_000,
}: NativeMediaPlayerProps) {
  // Always sanitise at render time so legacy DB rows (raw `/file/d/X/view`
  // URLs) are transparently upgraded — no DB migration required.
  const streamUrl = useMemo(() => sanitizeMediaUrl(url), [url]);
  const [errored, setErrored] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastProgressAtRef = useRef<number>(0);

  const handleVideoError = useCallback(() => setErrored(true), []);
  const handleVideoEnded = useCallback(() => onEnded?.(), [onEnded]);

  // Throttled progress tick — derived from the element's own `timeupdate`
  // event, which fires ~4×/sec while playing. We coalesce by wall-clock
  // delta so callers see at most one event per `progressIntervalMs`.
  const handleTimeUpdate = useCallback(() => {
    if (!onProgress || !videoRef.current) return;
    const now = Date.now();
    if (now - lastProgressAtRef.current < progressIntervalMs) return;
    lastProgressAtRef.current = now;
    onProgress(Math.floor(videoRef.current.currentTime));
  }, [onProgress, progressIntervalMs]);

  // Reset the throttle when the source changes (re-mounts give a fresh ref
  // but a re-render with a new URL on the same element should still start
  // from zero).
  useEffect(() => {
    lastProgressAtRef.current = 0;
  }, [streamUrl]);

  // ── Error UI ─────────────────────────────────────────────────────────────
  // Triggered when the native element fires its `error` event (e.g. Drive
  // returns 403 because sharing is not "Anyone with the link", or the file
  // ID is wrong). Friendly, branded, with a direct-open escape hatch.
  if (errored) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-4 text-center px-6 py-12 rounded-xl ${className ?? ''}`}
        style={{
          background: 'linear-gradient(180deg, #0d1526 0%, #111d35 100%)',
          border: '1px solid rgba(251,146,60,0.2)',
          minHeight: kind === 'video' ? '240px' : pdfMinHeight,
        }}
        role="alert"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(245,158,11,0.08))',
            border: '1px solid rgba(251,146,60,0.25)',
          }}
        >
          <AlertTriangle className="w-7 h-7" style={{ color: '#fb923c' }} aria-hidden />
        </div>
        <div className="max-w-md">
          <h3 className="text-base font-bold mb-1" style={{ color: '#e2e8f0' }}>
            {kind === 'video' ? 'Video Unavailable' : 'PDF Unavailable'}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
            The file couldn&rsquo;t load. The admin should check that the Drive sharing
            permissions are set to <strong>&ldquo;Anyone with the link can view.&rdquo;</strong>
          </p>
        </div>
        <a
          href={streamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
        >
          <ExternalLink className="w-4 h-4" aria-hidden />
          Open in new tab
        </a>
      </div>
    );
  }

  // ── Video branch ─────────────────────────────────────────────────────────
  if (kind === 'video') {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-xl bg-black ${className ?? ''}`}
        style={{ aspectRatio }}
      >
        {/* `preload="metadata"` keeps the initial network footprint tiny —
            we fetch enough to know duration + dimensions, then defer the
            byte stream until the user hits play. `playsinline` is required
            for iOS Safari so the video doesn't auto-fullscreen. */}
        {/*
          IMPORTANT: do NOT set `crossOrigin` on this element.
          Google Drive's `uc?export=download` redirects to *.googleusercontent.com
          without an `Access-Control-Allow-Origin` header. Native <video> loads
          `src` without CORS by default, but as soon as `crossOrigin` is set the
          browser requires CORS and refuses to play. The legacy attribute is
          only needed for canvas readback / `captureStream()` — not here.

          The optional `mimeType` prop overrides Drive's `Content-Type` sniffing
          for callers who know the codec ahead of time. We leave the default
          unset so the browser uses Drive's response header (handles mp4, webm,
          mov, etc. without per-file config).
        */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          src={streamUrl}
          title={title}
          poster={poster}
          controls
          preload="metadata"
          playsInline
          onError={handleVideoError}
          onEnded={handleVideoEnded}
          onTimeUpdate={onProgress ? handleTimeUpdate : undefined}
          {...(mimeType ? { 'data-mime': mimeType } : {})}
        >
          <p className="text-white p-4">
            Your browser doesn&rsquo;t support inline video.{' '}
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-indigo-300"
            >
              Download the video
            </a>{' '}
            to watch it.
          </p>
        </video>
      </div>
    );
  }

  // ── PDF branch ───────────────────────────────────────────────────────────
  // `<object>` triggers the browser's native PDF plugin (Chrome PDFium,
  // Firefox PDF.js, Safari Preview). Its child content is *only* rendered
  // when the plugin is unavailable — that's our accessibility-first
  // download fallback. No iframe, no Drive `/preview` chrome.
  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-[#525659] ${className ?? ''}`}
      style={{ minHeight: pdfMinHeight }}
    >
      <object
        data={streamUrl}
        type={mimeType ?? 'application/pdf'}
        title={title}
        className="block w-full"
        style={{ minHeight: pdfMinHeight, height: '100%' }}
        aria-label={`PDF viewer for ${title}`}
      >
        {/* Native fallback when the user has no PDF plugin (some mobile
            browsers, locked-down enterprise installs). Always include a
            visible download link — this satisfies WCAG 2.1 Success
            Criterion 1.4.5 *Images of Text* for PDF content. */}
        <div
          className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center"
          style={{ background: '#0d1526', color: '#e2e8f0', minHeight: pdfMinHeight }}
        >
          <p className="text-sm">
            Your browser cannot display PDFs inline.
          </p>
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            <Download className="w-4 h-4" aria-hidden />
            Download {title}
          </a>
        </div>
      </object>
    </div>
  );
}
