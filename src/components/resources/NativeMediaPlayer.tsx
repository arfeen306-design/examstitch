'use client';

/**
 * NativeMediaPlayer
 * ─────────────────
 * Renders Google Drive media through the Drive **`/preview`** iframe,
 * which is the only embed shape that survives Drive's cross-origin
 * policy reliably (the `uc?export=download` route fails browser CORS
 * even with `&confirm=t`).
 *
 * - **Video kind** → `<iframe src=".../preview" allow="autoplay; encrypted-media" allowFullScreen>`
 * - **PDF kind**   → same `/preview` shape (Drive renders the PDF viewer inline)
 *
 * Direct-download URLs (`toDriveStreamUrl`) are still used for the
 * fallback "Open in new tab" CTA so users can always reach the raw
 * file when the embed itself fails.
 *
 * Optional `onProgress` / `onEnded` callbacks are no-ops in the iframe
 * path — we cannot reach into the embedded Drive player's state.
 * They're kept on the props for source-stability with callers that
 * still wire them (`EmbeddedViewer`, `DualMediaViewer`).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { toDrivePreviewUrl, toDriveStreamUrl, sanitizeMediaUrl } from '@/lib/url-transform';

type MediaKind = 'video' | 'pdf';

interface NativeMediaPlayerProps {
  /** Raw URL as stored in the DB (sanitised at render time for legacy rows). */
  url: string;
  /** Accessible title for the iframe. */
  title: string;
  /** Optional thumbnail / poster — currently unused in iframe mode but kept for API parity. */
  poster?: string;
  kind: MediaKind;
  /** Override MIME (not used in iframe mode; kept for source-stability). */
  mimeType?: string;
  className?: string;
  /** Min height for the PDF iframe container (default 80vh). */
  pdfMinHeight?: string;
  /** No-op in iframe mode — kept for callers that still wire it. */
  onEnded?: () => void;
  /** No-op in iframe mode — kept for callers that still wire it. */
  onProgress?: (currentTimeSec: number) => void;
  /** Throttle window for `onProgress` (unused in iframe mode). */
  progressIntervalMs?: number;
  /** How long to wait for the iframe `onLoad` before declaring the embed broken. */
  loadTimeoutMs?: number;
}

export default function NativeMediaPlayer({
  url,
  title,
  kind,
  className,
  pdfMinHeight = '80vh',
  loadTimeoutMs = 10_000,
}: NativeMediaPlayerProps) {
  // Always sanitise at render time so legacy DB rows (raw `/file/d/X/view`
  // URLs) are transparently upgraded. The sanitised form is `uc?export=download…`
  // — fine for the download CTA. For the iframe we derive the `/preview`
  // shape with `toDrivePreviewUrl`.
  const canonicalUrl = useMemo(() => sanitizeMediaUrl(url), [url]);
  const previewUrl = useMemo(() => toDrivePreviewUrl(url) ?? canonicalUrl, [url, canonicalUrl]);
  const downloadUrl = useMemo(() => toDriveStreamUrl(url) ?? canonicalUrl, [url, canonicalUrl]);

  /**
   * State machine for the iframe:
   *   'loading' → onLoad has not fired AND the timeout has not elapsed
   *   'ready'   → onLoad fired before the timeout
   *   'error'   → timeout fired first → assume Drive blocked / file missing
   *
   * iframes do not reliably fire `onError`, so the only signal we have
   * is "did `onLoad` happen in time".
   */
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLoad = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState((prev) => (prev === 'error' ? prev : 'ready'));
  }, []);

  useEffect(() => {
    // Reset whenever the URL changes (component re-used for different resource)
    setState('loading');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setState((prev) => (prev === 'ready' ? prev : 'error'));
    }, loadTimeoutMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [previewUrl, loadTimeoutMs]);

  // ── Error fallback ───────────────────────────────────────────────────────
  // Triggered when the iframe doesn't load in time (Drive blocked, file
  // is private, ID is wrong). We show a friendly card with a direct-open
  // escape hatch pointing at the download URL.
  if (state === 'error') {
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
            {kind === 'video' ? 'Video unavailable' : 'PDF unavailable'}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
            The file couldn&rsquo;t load. The admin should verify the Drive sharing
            permissions are set to <strong>&ldquo;Anyone with the link can view.&rdquo;</strong>
          </p>
        </div>
        <a
          href={downloadUrl}
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

  // ── Video iframe ─────────────────────────────────────────────────────────
  if (kind === 'video') {
    return (
      <div className="space-y-2">
        <div
          className={`aspect-video w-full rounded-xl overflow-hidden bg-black relative ${className ?? ''}`}
        >
          {state === 'loading' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
            </div>
          )}
          <iframe
            src={previewUrl}
            title={title}
            width="100%"
            height="100%"
            allow="autoplay; encrypted-media"
            allowFullScreen
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={handleLoad}
            className="block w-full h-full border-0"
          />
        </div>
        {/* Permanent escape-hatch: even when the iframe loads correctly,
            users can hit this if Drive's UI inside the iframe surfaces
            its own "you cannot view this" page (a soft failure we
            can't detect from outside). */}
        <p className="text-[11px] text-right" style={{ color: '#64748b' }}>
          Trouble playing?{' '}
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-300 transition-colors"
          >
            Open in new tab
          </a>
        </p>
      </div>
    );
  }

  // ── PDF iframe ───────────────────────────────────────────────────────────
  // Drive's /preview route also renders PDFs in an inline viewer with
  // its own zoom + download controls. Same CORS / X-Frame-Options
  // story as video — `/preview` is permitted, `uc?export=download`
  // is not.
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <div
        className="rounded-xl overflow-hidden bg-[#525659] relative"
        style={{ minHeight: pdfMinHeight }}
      >
        {state === 'loading' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
          </div>
        )}
        <iframe
          src={previewUrl}
          title={title}
          width="100%"
          height="100%"
          allow="autoplay"
          allowFullScreen
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={handleLoad}
          className="block w-full border-0"
          style={{ minHeight: pdfMinHeight, height: '100%' }}
        />
      </div>
      <p className="text-[11px] text-right" style={{ color: '#64748b' }}>
        Trouble viewing?{' '}
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-slate-300 transition-colors"
        >
          Open in new tab
        </a>
      </p>
    </div>
  );
}
