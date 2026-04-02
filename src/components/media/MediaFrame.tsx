'use client';

import { Download, Printer, FileText, PlayCircle, Eye } from 'lucide-react';
import { useRef, useCallback, useEffect, useMemo } from 'react';

interface MediaFrameProps {
  id: string;
  mediaType: 'youtube' | 'pdf';
  title: string;
  url: string;
  permissions: { allow_print: boolean; allow_download: boolean };
  viewCount?: number;
  subject?: 'maths' | 'computer-science' | string;
  isAdmin?: boolean;
}

// Subject-themed styles
const subjectThemes: Record<string, { border: string; glow: string; accent: string }> = {
  'maths': {
    border: '#FF6B00',
    glow: '0 0 18px rgba(255, 107, 0, 0.25), 0 4px 16px rgba(255, 107, 0, 0.10)',
    accent: 'rgba(255, 107, 0, 0.08)',
  },
  'mathematics': {
    border: '#FF6B00',
    glow: '0 0 18px rgba(255, 107, 0, 0.25), 0 4px 16px rgba(255, 107, 0, 0.10)',
    accent: 'rgba(255, 107, 0, 0.08)',
  },
  'computer-science': {
    border: '#4F46E5',
    glow: '0 2px 12px rgba(79, 70, 229, 0.30), 0 1px 4px rgba(79, 70, 229, 0.15)',
    accent: 'rgba(79, 70, 229, 0.08)',
  },
};

const defaultTheme = {
  border: 'var(--border-subtle)',
  glow: '0 4px 12px rgba(0, 0, 0, 0.06)',
  accent: 'var(--accent-subtle)',
};

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

export default function MediaFrame({ id, mediaType, title, url, permissions, viewCount, subject, isAdmin }: MediaFrameProps) {
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<unknown>(null);

  // Resolve subject theme
  const theme = useMemo(() => {
    if (!subject) return defaultTheme;
    const key = subject.toLowerCase().replace(/\s+/g, '-');
    return subjectThemes[key] || defaultTheme;
  }, [subject]);

  // Admin detection: prop or admin_mode cookie
  const showAnalytics = useMemo(() => {
    if (isAdmin) return true;
    if (typeof document !== 'undefined' && document.cookie.includes('admin_mode=1')) return true;
    return false;
  }, [isAdmin]);

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

  // Admin-only view count badge — completely removed from DOM for non-admins
  const viewBadge = showAnalytics && viewCount != null && viewCount > 0 ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--bg-surface, #f3f4f6)', color: 'var(--text-muted, #6b7280)' }}>
      <Eye className="w-3 h-3" />
      {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}
    </span>
  ) : null;

  // Glassmorphism container style
  const containerStyle = {
    border: `4px solid ${theme.border}`,
    borderRadius: '12px',
    boxShadow: theme.glow,
    backgroundColor: 'var(--bg-card)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    background: `linear-gradient(135deg, ${theme.accent}, var(--bg-card) 40%, var(--bg-card))`,
  };

  if (mediaType === 'youtube') {
    return (
      <div className="group overflow-hidden transition-shadow hover:shadow-lg"
           style={containerStyle}>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <div ref={ytContainerRef} className="absolute inset-0">
            <div id={`yt-player-${id}`} className="w-full h-full" />
          </div>
        </div>
        <div className="px-4 py-3 flex items-center gap-2">
          <PlayCircle className="w-4 h-4 shrink-0" style={{ color: theme.border }} />
          <p className="text-sm font-medium truncate flex-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
          {viewBadge}
        </div>
      </div>
    );
  }

  // PDF viewer
  return (
    <div className="overflow-hidden transition-shadow hover:shadow-lg"
         style={containerStyle}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b"
           style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 shrink-0" style={{ color: theme.border }} />
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
          {viewBadge}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {permissions.allow_download && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-80"
              style={{ backgroundColor: theme.accent, color: theme.border }}
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          )}
          {permissions.allow_print && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-80"
              style={{ backgroundColor: theme.accent, color: theme.border }}
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
