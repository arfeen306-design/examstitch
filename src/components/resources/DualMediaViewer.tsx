'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  Video,
  FileText,
} from 'lucide-react';
import { toEmbedUrl, toDownloadUrl } from '@/lib/url-transform';

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
    <div className="relative w-full rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: '#000' }}>
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

// ── PDF Viewer ──────────────────────────────────────────────────────────────

function DualPdfViewer({
  embedUrl,
  downloadUrl,
  title,
}: {
  embedUrl: string;
  downloadUrl: string | null;
  title: string;
}) {
  const beige = '#f5f0e8';

  function handlePrint() {
    const printWindow = window.open(embedUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => printWindow.print(), 500);
      });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF toolbar */}
      <div className="flex items-center justify-between px-3 py-2 rounded-t-xl border border-b-0"
           style={{ backgroundColor: 'var(--bg-subtle, #f8f5f0)', borderColor: '#e8e0d0' }}>
        <span className="text-xs font-medium flex items-center gap-1.5"
              style={{ color: 'var(--text-secondary, #3B4F80)' }}>
          <FileText className="w-3.5 h-3.5" /> PDF Viewer
        </span>
        <div className="flex items-center gap-1.5">
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--badge-bg, #1A2B56)', color: '#fff' }}
            >
              <Download className="w-3 h-3" /> Download
            </a>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors hover:bg-gray-100"
            style={{ borderColor: '#d1d5db', color: 'var(--text-secondary, #3B4F80)' }}
          >
            <Printer className="w-3 h-3" /> Print
          </button>
        </div>
      </div>

      {/* PDF iframe */}
      <div className="relative flex-1 rounded-b-xl overflow-hidden"
           style={{ backgroundColor: beige, border: '1px solid #e8e0d0', minHeight: '500px' }}>
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full border-0"
          style={{ minHeight: '500px' }}
          allow="autoplay"
          loading="lazy"
        />
        {/* Mask Drive UI borders */}
        <div className="absolute top-0 left-0 right-0 pointer-events-none z-10" style={{ height: '3px', backgroundColor: beige }} />
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10" style={{ height: '3px', backgroundColor: beige }} />
        <div className="absolute top-0 left-0 bottom-0 pointer-events-none z-10" style={{ width: '3px', backgroundColor: beige }} />
        <div className="absolute top-0 right-0 bottom-0 pointer-events-none z-10" style={{ width: '6px', backgroundColor: beige }} />
        <div className="absolute top-0 right-0 w-14 h-12 pointer-events-auto z-20 rounded-bl-lg" style={{ backgroundColor: beige }} />
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
              expanded === 'video' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {expanded === 'video' ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <Video className="w-3 h-3" />
          </button>
          <button
            onClick={() => setExpanded(expanded === 'pdf' ? null : 'pdf')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              expanded === 'pdf' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
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

      {/* Dual pane layout */}
      <div className={`flex gap-4 ${expanded ? '' : 'flex-col lg:flex-row'}`}>
        {/* Video pane */}
        <div
          className={`transition-all duration-300 ${
            expanded === 'pdf'
              ? 'hidden'
              : expanded === 'video'
                ? 'w-full'
                : 'w-full lg:w-1/2'
          }`}
        >
          <div className="sticky top-24">
            <DualVideoPlayer embedUrl={videoEmbed} title={title} resourceId={resourceId} />
          </div>
        </div>

        {/* PDF pane */}
        <div
          className={`transition-all duration-300 ${
            expanded === 'video'
              ? 'hidden'
              : expanded === 'pdf'
                ? 'w-full'
                : 'w-full lg:w-1/2'
          }`}
          style={{ minHeight: expanded === 'pdf' ? '85vh' : undefined }}
        >
          <DualPdfViewer embedUrl={pdfEmbed} downloadUrl={pdfDownload} title={`${title} — PDF`} />
        </div>
      </div>
    </motion.div>
  );
}
