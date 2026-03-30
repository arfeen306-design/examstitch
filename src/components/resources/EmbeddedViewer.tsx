'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Download, RotateCcw, ChevronRight } from 'lucide-react';
import { toEmbedUrl, toDownloadUrl } from '@/lib/url-transform';
import VideoContainer from './VideoContainer';

interface EmbeddedViewerProps {
  title: string;
  sourceUrl: string;
  contentType: 'video' | 'pdf' | 'worksheet';
  backHref: string;
  backLabel: string;
  nextHref?: string;
  nextTitle?: string;
}

// ── YouTube IFrame API types ───────────────────────────────────────────────

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// ── Premium VideoFrame ─────────────────────────────────────────────────────

function VideoFrame({
  embedUrl,
  title,
  nextHref,
  nextTitle,
}: {
  embedUrl: string;
  title: string;
  nextHref?: string;
  nextTitle?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const [ended, setEnded] = useState(false);
  const [apiReady, setApiReady] = useState(false);

  // Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => setApiReady(true);
    return () => { window.onYouTubeIframeAPIReady = () => {}; };
  }, []);

  // Init YT.Player
  useEffect(() => {
    if (!apiReady || !iframeRef.current) return;
    playerRef.current = new window.YT.Player(iframeRef.current, {
      events: {
        onStateChange: (e: any) => {
          if (e.data === 0) setEnded(true);
        },
      },
    });
    return () => { try { playerRef.current?.destroy(); } catch (_) {} };
  }, [apiReady]);

  const handleReplay = useCallback(() => {
    setEnded(false);
    try { playerRef.current?.seekTo(0); playerRef.current?.playVideo(); } catch (_) {}
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <VideoContainer title={title} showBadge>
        {/* Clipping shell — hides the top YT bar */}
        <div
          className="relative w-full overflow-hidden"
          style={{ paddingBottom: 'calc(56.25% + 56px)' }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-56px',
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>

          {/* Top brand bar blocker */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '56px', pointerEvents: 'auto',
              background: 'transparent', zIndex: 10,
            }}
          />
          {/* Bottom-right YouTube logo blocker */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', bottom: '40px', right: 0,
              width: '88px', height: '28px', pointerEvents: 'auto',
              background: 'transparent', zIndex: 10,
            }}
          />
        </div>

        {/* End-of-video overlay */}
        <AnimatePresence>
          {ended && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center
                         bg-black/80 backdrop-blur-md gap-4 px-6"
            >
              <p className="text-white/50 text-xs font-medium uppercase tracking-widest">
                Video Complete
              </p>
              <h3 className="text-white text-xl font-bold text-center">{title}</h3>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                <button
                  onClick={handleReplay}
                  className="inline-flex items-center gap-2 px-5 py-2.5
                             bg-white/10 hover:bg-white/20 text-white
                             text-sm font-semibold rounded-full border border-white/20
                             transition-all duration-200"
                >
                  <RotateCcw className="w-4 h-4" /> Replay
                </button>
                {nextHref && (
                  <Link
                    href={nextHref}
                    className="inline-flex items-center gap-2 px-5 py-2.5
                               text-sm font-semibold rounded-full shadow-md
                               transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--accent, #D4AF37)',
                      color: 'var(--text-on-accent, #1A2B56)',
                    }}
                  >
                    {nextTitle || 'Next Topic'}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </VideoContainer>
    </motion.div>
  );
}

// ── Google Drive / PDF Viewer ──────────────────────────────────────────────

function DriveViewer({ embedUrl, title }: { embedUrl: string; title: string }) {
  const beige = '#f5f0e8';
  return (
    <div className="relative w-full rounded-lg overflow-hidden"
         style={{ backgroundColor: beige, border: '1px solid #e8e0d0' }}>
      <iframe
        src={embedUrl}
        title={title}
        className="w-full border-0"
        style={{ minHeight: 'max(800px, 85vh)' }}
        allow="autoplay"
        loading="lazy"
      />

      {/* Edge overlays to mask Google Drive's internal black borders */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none z-10"
           style={{ height: '3px', backgroundColor: beige }} />
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
           style={{ height: '3px', backgroundColor: beige }} />
      <div className="absolute top-0 left-0 bottom-0 pointer-events-none z-10"
           style={{ width: '3px', backgroundColor: beige }} />
      <div className="absolute top-0 right-0 bottom-0 pointer-events-none z-10"
           style={{ width: '6px', backgroundColor: beige }} />
      <div className="absolute top-0 right-0 w-14 h-12 pointer-events-auto z-20 rounded-bl-lg"
           style={{ backgroundColor: beige }} />
    </div>
  );
}

// ── Main EmbeddedViewer ────────────────────────────────────────────────────

export default function EmbeddedViewer({
  title,
  sourceUrl,
  contentType,
  backHref,
  backLabel,
  nextHref,
  nextTitle,
}: EmbeddedViewerProps) {
  const { embedUrl, type } = toEmbedUrl(sourceUrl);
  const downloadUrl = toDownloadUrl(sourceUrl);
  const isVideo = contentType === 'video' || type === 'youtube';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors group"
          style={{ color: 'var(--text-secondary, #3B4F80)' }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {backLabel}
        </Link>

        <div className="flex items-center gap-2">
          {downloadUrl && (contentType === 'worksheet' || contentType === 'pdf') && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--badge-bg, #1A2B56)',
                color: 'var(--badge-text, #ffffff)',
              }}
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </a>
          )}
        </div>
      </div>

      {/* Title */}
      <h1
        className="text-xl sm:text-2xl font-bold tracking-tight"
        style={{ color: 'var(--text-primary, #1A2B56)', fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {title}
      </h1>

      {/* Embedded Content */}
      {isVideo ? (
        <VideoFrame
          embedUrl={embedUrl}
          title={title}
          nextHref={nextHref}
          nextTitle={nextTitle}
        />
      ) : (
        <DriveViewer embedUrl={embedUrl} title={title} />
      )}

      {/* Content type badge — for PDFs only (video badge is inside VideoFrame) */}
      {!isVideo && (
        <div className="flex items-center gap-2 pt-1">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: contentType === 'worksheet' ? '#f0fdf4' : '#eff6ff',
              color: contentType === 'worksheet' ? '#16a34a' : '#2563eb',
            }}
          >
            {contentType === 'worksheet' ? '📄 Worksheet' : '📋 Past Paper'}
          </span>
        </div>
      )}
    </motion.div>
  );
}
