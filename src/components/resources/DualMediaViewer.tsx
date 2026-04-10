'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Video,
  FileText,
} from 'lucide-react';
import { toEmbedUrl, toDownloadUrl } from '@/lib/url-transform';
import { useViewTracking } from '@/hooks/useViewTracking';
import FramedPDFViewer from './FramedPDFViewer';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface DualMediaViewerProps {
  title: string;
  videoUrl: string;
  pdfUrl: string;
  backHref: string;
  backLabel: string;
  resourceId?: string;
}

// ── YouTube Player ──────────────────────────────────────────────────────────

function DualVideoPlayer({
  embedUrl,
  title,
  resourceId,
}: {
  embedUrl: string;
  title: string;
  resourceId?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const [apiReady, setApiReady] = useState(false);

  const updateProgress = useCallback(
    async (isCompleted = false) => {
      if (!resourceId) return;
      try {
        let watchTime = 0;
        if (playerRef.current?.getCurrentTime) {
          watchTime = Math.floor(playerRef.current.getCurrentTime());
        }
        await fetch('/api/progress/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceId, isCompleted, watchTime }),
        });
      } catch {}
    },
    [resourceId],
  );

  useEffect(() => {
    if (window.YT?.Player) {
      setApiReady(true);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      setApiReady(true);
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }, []);

  useEffect(() => {
    if (!apiReady || !iframeRef.current) return;
    try {
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) updateProgress(true);
          },
        },
      });
    } catch {}
  }, [apiReady, updateProgress]);

  // Periodic progress tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current?.getPlayerState?.() === window.YT?.PlayerState?.PLAYING) {
        updateProgress(false);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [updateProgress]);

  return (
    <div
      className="relative w-full overflow-hidden transition-shadow hover:shadow-2xl"
      style={{
        backgroundColor: '#000',
        borderRadius: '12px',
        border: '2px solid #E2E8F0',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 12px 24px -8px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}

// ── Main DualMediaViewer ────────────────────────────────────────────────────

export default function DualMediaViewer({
  title,
  videoUrl,
  pdfUrl,
  backHref,
  backLabel,
  resourceId,
}: DualMediaViewerProps) {
  useViewTracking(resourceId);

  const { embedUrl: videoEmbed } = toEmbedUrl(videoUrl);
  const { embedUrl: pdfEmbed } = toEmbedUrl(pdfUrl);
  const pdfDownload = toDownloadUrl(pdfUrl);

  const [expanded, setExpanded] = useState<'video' | 'pdf' | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors group"
          style={{ color: 'var(--text-secondary, #3B4F80)' }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {backLabel}
        </Link>

        {/* Expand controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setExpanded(expanded === 'video' ? null : 'video')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              expanded === 'video' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'
            }`}
          >
            {expanded === 'video' ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <Video className="w-3 h-3" />
          </button>
          <button
            onClick={() => setExpanded(expanded === 'pdf' ? null : 'pdf')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              expanded === 'pdf' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'
            }`}
          >
            {expanded === 'pdf' ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <FileText className="w-3 h-3" />
          </button>
        </div>
      </div>

      <h1
        className="text-xl sm:text-2xl font-bold tracking-tight"
        style={{ color: 'var(--text-primary, #1A2B56)', fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {title}
      </h1>

      {/* Dual pane layout: PDF 40% LEFT / Video 60% RIGHT — mobile: video top, PDF bottom */}
      <div className={`flex gap-4 ${expanded ? '' : 'flex-col-reverse lg:flex-row lg:items-start'}`}>
        {/* PDF pane — LEFT 40% (desktop) / BOTTOM (mobile) */}
        <div
          className={`transition-all duration-300 ${
            expanded === 'video'
              ? 'hidden'
              : expanded === 'pdf'
                ? 'w-full'
                : 'w-full lg:w-[55%]'
          }`}
          style={{ minHeight: expanded === 'pdf' ? '85vh' : undefined }}
        >
          <FramedPDFViewer
            embedUrl={pdfEmbed}
            downloadUrl={pdfDownload}
            title={`${title} — PDF`}
            minHeight="max(650px, 85vh)"
            resourceId={resourceId}
          />
        </div>

        {/* Video pane — RIGHT 60% (desktop) / TOP (mobile) */}
        <div
          className={`transition-all duration-300 ${
            expanded === 'pdf'
              ? 'hidden'
              : expanded === 'video'
                ? 'w-full'
                : 'w-full lg:w-[45%]'
          }`}
        >
          <div className="sticky top-24">
            <DualVideoPlayer embedUrl={videoEmbed} title={title} resourceId={resourceId} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
