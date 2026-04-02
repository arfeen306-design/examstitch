'use client';

import { Download, Printer, FileText, PlayCircle, Eye } from 'lucide-react';
import { useRef, useCallback, useEffect } from 'react';

interface MediaFrameProps {
  id: string;
  mediaType: 'youtube' | 'pdf';
  title: string;
  url: string;
  permissions: { allow_print: boolean; allow_download: boolean };
  viewCount?: number;
}

// Session-based debounce: track which widgets have been counted this session
const viewedThisSession = new Set<string>();

function trackView(widgetId: string, interactionType: 'view' | 'download' | 'print' = 'view') {
  const key = `${widgetId}:${interactionType}`;
  if (interactionType === 'view' && viewedThisSession.has(key)) return;
  viewedThisSession.add(key);

  // Fire-and-forget — never block the UI
  fetch('/api/media/view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widget_id: widgetId, interaction_type: interactionType }),
  }).catch(() => {});
}

export default function MediaFrame({ id, mediaType, title, url, permissions, viewCount }: MediaFrameProps) {
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<unknown>(null);

  // YouTube: use IFrame API to detect play
  useEffect(() => {
    if (mediaType !== 'youtube' || !ytContainerRef.current) return;

    const videoId = url.includes('youtube.com') || url.includes('youtu.be')
      ? url.replace(/.*(?:youtu\.be\/|v=|embed\/)([^&#?]+).*/, '$1')
      : url;

    const containerId = `yt-player-${id}`;

    // Ensure the YT IFrame API script is loaded once globally
    if (!(window as unknown as Record<string, unknown>).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    function createPlayer() {
      const YT = (window as unknown as Record<string, unknown>).YT as {
        Player: new (id: string, opts: Record<string, unknown>) => unknown;
        PlayerState: { PLAYING: number };
      };
      if (!YT?.Player) return;

      playerRef.current = new YT.Player(containerId, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event: { data: number }) => {
            if (event.data === YT.PlayerState.PLAYING) {
              trackView(id, 'view');
            }
          },
        },
      });
    }

    // YT API may already be loaded
    if ((window as unknown as Record<string, unknown>).YT && (window as unknown as Record<string, { Player?: unknown }>).YT?.Player) {
      createPlayer();
    } else {
      const prev = (window as unknown as Record<string, unknown>).onYouTubeIframeAPIReady as (() => void) | undefined;
      (window as unknown as Record<string, unknown>).onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
    }
  }, [id, mediaType, url]);

  // PDF: track view on mount
  useEffect(() => {
    if (mediaType === 'pdf') {
      trackView(id, 'view');
    }
  }, [id, mediaType]);

  const handleDownload = useCallback(async () => {
    trackView(id, 'download');
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, '_blank');
    }
  }, [id, url, title]);

  const handlePrint = useCallback(() => {
    trackView(id, 'print');
    if (printFrameRef.current?.contentWindow) {
      printFrameRef.current.contentWindow.print();
    }
  }, [id]);

  const viewBadge = viewCount != null && viewCount > 0 ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--bg-surface, #f3f4f6)', color: 'var(--text-muted, #6b7280)' }}>
      <Eye className="w-3 h-3" />
      {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}
    </span>
  ) : null;

  if (mediaType === 'youtube') {
    return (
      <div className="group rounded-2xl overflow-hidden shadow-sm border transition-shadow hover:shadow-md"
           style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <div ref={ytContainerRef} className="absolute inset-0">
            <div id={`yt-player-${id}`} className="w-full h-full" />
          </div>
        </div>
        <div className="px-4 py-3 flex items-center gap-2">
          <PlayCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-medium truncate flex-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
          {viewBadge}
        </div>
      </div>
    );
  }

  // PDF viewer
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border transition-shadow hover:shadow-md"
         style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b"
           style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
          {viewBadge}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {permissions.allow_download && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          )}
          {permissions.allow_print && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          )}
        </div>
      </div>

      {/* PDF embed */}
      <div className="relative w-full" style={{ height: '500px' }}>
        <iframe
          ref={printFrameRef}
          className="w-full h-full"
          src={`${url}#toolbar=0&navpanes=0`}
          title={title}
          loading="lazy"
        />
      </div>
    </div>
  );
}
