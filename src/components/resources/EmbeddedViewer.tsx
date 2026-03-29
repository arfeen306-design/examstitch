'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Download, RotateCcw, ChevronRight } from 'lucide-react';
import { toEmbedUrl, toDownloadUrl } from '@/lib/url-transform';

interface EmbeddedViewerProps {
  title: string;
  sourceUrl: string;
  contentType: 'video' | 'pdf' | 'worksheet';
  backHref: string;
  backLabel: string;
  /** Optional: href of the next sub-topic for the end-of-video CTA */
  nextHref?: string;
  nextTitle?: string;
}

// ── YouTube IFrame API types (lightweight) ─────────────────────────────────

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// ── YouTube Locked-In Player ───────────────────────────────────────────────

function YouTubeLockedPlayer({
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
    return () => {
      // cleanup: remove listener but keep script (may be used elsewhere)
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, []);

  // Initialise YT.Player once API is ready
  useEffect(() => {
    if (!apiReady || !iframeRef.current) return;

    playerRef.current = new window.YT.Player(iframeRef.current, {
      events: {
        onStateChange: (e: any) => {
          // 0 = ended
          if (e.data === 0) setEnded(true);
        },
      },
    });

    return () => {
      try { playerRef.current?.destroy(); } catch (_) {}
    };
  }, [apiReady]);

  const handleReplay = useCallback(() => {
    setEnded(false);
    try { playerRef.current?.seekTo(0); playerRef.current?.playVideo(); } catch (_) {}
  }, []);

  return (
    /*
     * Layout trick to hide the YouTube title bar:
     * - The outer div clips to the visible area (overflow-hidden)
     * - The inner div is pushed up by ~50px so the YT title bar moves out of view
     * - Padding-bottom compensates to keep the 16:9 ratio intact
     *
     * On mobile the bar is ~44px, on desktop ~50px. 56px is a safe value.
     */
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-navy-100 bg-black">
      {/* Clipping shell — hides the top YT bar */}
      <div
        className="relative w-full overflow-hidden"
        style={{ paddingBottom: 'calc(56.25% + 56px)' }} // extra height for the crop
      >
        <div
          style={{
            position: 'absolute',
            top: '-56px',          // pull iframe up to hide YT title bar
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

        {/*
         * Pointer-events blocker strips:
         * 1. Top strip — covers the area where the YT title/logo appear
         * 2. Bottom-right corner — covers the YouTube logo watermark
         * These intercept clicks on branding without blocking the timeline/controls
         */}
        {/* Top brand bar blocker */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '56px',
            pointerEvents: 'auto',
            background: 'transparent',
            zIndex: 10,
          }}
        />
        {/* Bottom-right YouTube logo blocker */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '40px',
            right: 0,
            width: '88px',
            height: '28px',
            pointerEvents: 'auto',
            background: 'transparent',
            zIndex: 10,
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
                       bg-navy-950/90 backdrop-blur-sm rounded-2xl gap-4 px-6"
          >
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">
              Video Complete
            </p>
            <h3 className="text-white text-xl font-bold text-center">{title}</h3>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <button
                onClick={handleReplay}
                className="inline-flex items-center gap-2 px-5 py-2.5
                           bg-white/10 hover:bg-white/20 text-white
                           text-sm font-semibold rounded-full border border-white/20
                           transition-all duration-150"
              >
                <RotateCcw className="w-4 h-4" />
                Replay
              </button>

              {nextHref && (
                <Link
                  href={nextHref}
                  className="inline-flex items-center gap-2 px-5 py-2.5
                             bg-gold-500 hover:bg-gold-400 text-navy-900
                             text-sm font-semibold rounded-full shadow-md
                             transition-all duration-150"
                >
                  {nextTitle || 'Next Topic'}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Google Drive / PDF Viewer ──────────────────────────────────────────────

function DriveViewer({ embedUrl, title }: { embedUrl: string; title: string }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-navy-100 bg-white">
      <iframe
        src={embedUrl}
        title={title}
        className="w-full border-0"
        style={{ minHeight: 'max(800px, 85vh)' }}
        allow="autoplay"
        loading="lazy"
      />
      {/* Cover Google Drive's "open in new window" icon, top-right */}
      <div className="absolute top-0 right-0 w-16 h-14 bg-white pointer-events-auto z-10" />
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
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-navy-500 hover:text-navy-800 transition-colors group"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-navy-900 rounded-lg hover:bg-navy-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </a>
          )}
        </div>
      </div>

      {/* Title — always visible above the player */}
      <h1 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
        {title}
      </h1>

      {/* Embedded Content */}
      {isVideo ? (
        <YouTubeLockedPlayer
          embedUrl={embedUrl}
          title={title}
          nextHref={nextHref}
          nextTitle={nextTitle}
        />
      ) : (
        <DriveViewer embedUrl={embedUrl} title={title} />
      )}

      {/* Content type badge */}
      <div className="flex items-center gap-2 pt-1">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          isVideo         ? 'bg-red-50 text-red-600' :
          contentType === 'worksheet' ? 'bg-green-50 text-green-600' :
          'bg-blue-50 text-blue-600'
        }`}>
          {isVideo ? '▶ Video' : contentType === 'worksheet' ? '📄 Worksheet' : '📋 Past Paper'}
        </span>
        {isVideo && (
          <span className="text-xs text-navy-400 flex items-center gap-1">
            🔒 Staying on ExamStitch
          </span>
        )}
      </div>
    </motion.div>
  );
}
