'use client';

/**
 * InteractiveSolver
 *
 * A dual-pane interface for past paper solutions:
 *  - Left (60%): PDF viewer (solved paper from Google Drive)
 *  - Right (40%): YouTube player + Question/Sub-part navigation tabs
 *
 * Question tabs call YouTube IFrame API seekTo() to jump to exact timestamps.
 * On mobile, layout stacks: Video → Tabs → PDF.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Play, ChevronDown, ChevronUp,
  FileText, RotateCcw, ChevronRight, Maximize2, Minimize2,
} from 'lucide-react';
import { toEmbedUrl } from '@/lib/url-transform';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface QuestionPart {
  part: string;       // "a", "b", "c", "d"
  start_time: number; // seconds
  pdf_page?: number;
}

export interface QuestionMapping {
  question: number;
  label: string;       // "Q1", "Q2", etc.
  start_time: number;  // seconds
  parts?: QuestionPart[];
}

interface InteractiveSolverProps {
  title: string;
  videoUrl: string;         // YouTube URL
  pdfUrl: string;           // Google Drive URL (solved paper)
  questionMapping: QuestionMapping[];
  backHref: string;
  backLabel: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// YouTube Player (with seekTo exposed)
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function SolverYouTubePlayer({
  embedUrl,
  title,
  onPlayerReady,
}: {
  embedUrl: string;
  title: string;
  onPlayerReady: (player: any) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const [ended, setEnded] = useState(false);
  const [apiReady, setApiReady] = useState(false);

  // Load YouTube IFrame API
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

  // Init player once API is ready
  useEffect(() => {
    if (!apiReady || !iframeRef.current) return;
    playerRef.current = new window.YT.Player(iframeRef.current, {
      events: {
        onReady: () => onPlayerReady(playerRef.current),
        onStateChange: (e: any) => {
          if (e.data === 0) setEnded(true);
        },
      },
    });
    return () => { try { playerRef.current?.destroy(); } catch (_) {} };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiReady]);

  const handleReplay = useCallback(() => {
    setEnded(false);
    try { playerRef.current?.seekTo(0); playerRef.current?.playVideo(); } catch (_) {}
  }, []);

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-lg border bg-black"
         style={{ borderColor: 'var(--border-color, #e2e8f0)' }}>
      {/* Crop outer shell — hides YT title bar */}
      <div className="relative w-full overflow-hidden"
           style={{ paddingBottom: 'calc(56.25% + 50px)' }}>
        <div style={{ position: 'absolute', top: '-50px', left: 0, right: 0, bottom: 0 }}>
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

        {/* Top brand-bar blocker */}
        <div aria-hidden="true"
             style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50px',
                      pointerEvents: 'auto', background: 'transparent', zIndex: 10 }} />

        {/* Bottom-right logo blocker */}
        <div aria-hidden="true"
             style={{ position: 'absolute', bottom: '40px', right: 0, width: '88px', height: '28px',
                      pointerEvents: 'auto', background: 'transparent', zIndex: 10 }} />
      </div>

      {/* End of video overlay */}
      <AnimatePresence>
        {ended && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center
                       bg-navy-950/90 backdrop-blur-sm rounded-xl gap-3 px-4"
          >
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">
              Video Complete
            </p>
            <button onClick={handleReplay}
              className="inline-flex items-center gap-2 px-5 py-2.5
                         bg-white/10 hover:bg-white/20 text-white text-sm font-semibold
                         rounded-full border border-white/20 transition-all">
              <RotateCcw className="w-4 h-4" /> Replay
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF Viewer
// ─────────────────────────────────────────────────────────────────────────────

function SolverPdfViewer({
  embedUrl,
  title,
  page,
}: {
  embedUrl: string;
  title: string;
  page?: number;
}) {
  // Append #page=N for Google Drive / generic PDF deep-link
  const src = page ? `${embedUrl}#page=${page}` : embedUrl;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg border bg-white"
         style={{ borderColor: 'var(--border-color, #e2e8f0)' }}>
      <iframe
        key={src} // force re-mount when page changes for deep-link
        src={src}
        title={title}
        className="w-full h-full border-0"
        style={{ minHeight: '500px' }}
        allow="autoplay"
        loading="lazy"
      />
      {/* Cover Google Drive's "open in new window" icon */}
      <div className="absolute top-0 right-0 w-16 h-14 pointer-events-auto z-10"
           style={{ backgroundColor: 'var(--bg-card, white)' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Format seconds to MM:SS
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Question Navigation Tabs
// ─────────────────────────────────────────────────────────────────────────────

function QuestionTabs({
  mapping,
  activeQ,
  activePart,
  onSelect,
}: {
  mapping: QuestionMapping[];
  activeQ: number | null;
  activePart: string | null;
  onSelect: (q: QuestionMapping, part?: QuestionPart) => void;
}) {
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const handleQClick = (q: QuestionMapping) => {
    if (expandedQ === q.question) {
      setExpandedQ(null);
    } else {
      setExpandedQ(q.question);
    }
    onSelect(q);
  };

  const handlePartClick = (q: QuestionMapping, part: QuestionPart) => {
    onSelect(q, part);
  };

  return (
    <div className="space-y-2">
      {/* Question label */}
      <div className="flex items-center gap-1.5 px-1">
        <Play className="w-3 h-3" style={{ color: 'var(--accent, #d4a843)' }} />
        <span className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-muted, #94a3b8)' }}>
          Jump to Question
        </span>
      </div>

      {/* Question bar — horizontal scrollable */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {mapping.map((q) => {
          const isActive = activeQ === q.question;
          return (
            <button
              key={q.question}
              onClick={() => handleQClick(q)}
              className={`relative shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                         transition-all duration-200 border
                         ${isActive
                           ? 'shadow-md scale-[1.02]'
                           : 'hover:scale-[1.01]'}`}
              style={{
                backgroundColor: isActive ? 'var(--accent, #d4a843)' : 'var(--bg-surface, #f8fafc)',
                color: isActive ? 'var(--text-on-accent, #1a1f36)' : 'var(--text-primary, #1a1f36)',
                borderColor: isActive ? 'var(--accent, #d4a843)' : 'var(--border-subtle, #e2e8f0)',
              }}
            >
              {q.label}
              <span className="text-[10px] opacity-60">{formatTime(q.start_time)}</span>
              {q.parts && q.parts.length > 0 && (
                expandedQ === q.question
                  ? <ChevronUp className="w-3 h-3 opacity-60" />
                  : <ChevronDown className="w-3 h-3 opacity-60" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-part row — animated reveal */}
      <AnimatePresence>
        {expandedQ !== null && (() => {
          const q = mapping.find(m => m.question === expandedQ);
          if (!q?.parts?.length) return null;
          return (
            <motion.div
              key={`parts-${expandedQ}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="flex gap-1.5 pl-4 pt-1 pb-1">
                <span className="text-[10px] font-medium self-center mr-1"
                      style={{ color: 'var(--text-muted, #94a3b8)' }}>
                  Parts:
                </span>
                {q.parts.map((part) => {
                  const isPartActive = activeQ === q.question && activePart === part.part;
                  return (
                    <button
                      key={part.part}
                      onClick={() => handlePartClick(q, part)}
                      className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold
                                 transition-all duration-200 border
                                 ${isPartActive ? 'shadow-md scale-105' : 'hover:scale-[1.02]'}`}
                      style={{
                        backgroundColor: isPartActive ? 'var(--accent, #d4a843)' : 'var(--bg-card, white)',
                        color: isPartActive ? 'var(--text-on-accent, #1a1f36)' : 'var(--text-primary, #1a1f36)',
                        borderColor: isPartActive ? 'var(--accent, #d4a843)' : 'var(--border-subtle, #e2e8f0)',
                      }}
                      title={`Part ${part.part.toUpperCase()} — ${formatTime(part.start_time)}`}
                    >
                      {part.part.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function InteractiveSolver({
  title,
  videoUrl,
  pdfUrl,
  questionMapping,
  backHref,
  backLabel,
}: InteractiveSolverProps) {
  const { embedUrl: ytEmbedUrl } = toEmbedUrl(videoUrl);
  const { embedUrl: pdfEmbedUrl } = toEmbedUrl(pdfUrl);

  const playerRef = useRef<any>(null);
  const [activeQ, setActiveQ] = useState<number | null>(null);
  const [activePart, setActivePart] = useState<string | null>(null);
  const [pdfPage, setPdfPage] = useState<number | undefined>(undefined);
  const [pdfExpanded, setPdfExpanded] = useState(false);

  const handlePlayerReady = useCallback((player: any) => {
    playerRef.current = player;
  }, []);

  const handleSelect = useCallback((q: QuestionMapping, part?: QuestionPart) => {
    const time = part ? part.start_time : q.start_time;
    setActiveQ(q.question);
    setActivePart(part?.part || null);

    // Seek video
    if (playerRef.current) {
      try {
        playerRef.current.seekTo(time, true);
        playerRef.current.playVideo();
      } catch (_) {}
    }

    // Jump PDF to page if specified
    const page = part?.pdf_page;
    if (page) setPdfPage(page);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors group"
          style={{ color: 'var(--text-secondary, #64748b)' }}>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {backLabel}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-600">
            ▶ Interactive Solver
          </span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary, #1a1f36)' }}>
        {title}
      </h1>

      {/* ── Dual-Pane Layout ── */}
      <div className={`flex flex-col lg:flex-row gap-4 ${pdfExpanded ? '' : ''}`}
           style={{ minHeight: '70vh' }}>

        {/* ── LEFT: PDF Viewer (60% on desktop) ── */}
        <div className={`order-3 lg:order-1 ${pdfExpanded ? 'lg:w-[75%]' : 'lg:w-[58%]'} transition-all duration-300`}
             style={{ minHeight: '500px' }}>
          <div className="sticky top-24 h-[calc(100vh-120px)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: 'var(--accent, #d4a843)' }} />
                <span className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: 'var(--text-muted, #94a3b8)' }}>
                  Solved Paper
                </span>
                {pdfPage && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--bg-surface, #f8fafc)', color: 'var(--text-secondary, #64748b)' }}>
                    Page {pdfPage}
                  </span>
                )}
              </div>
              <button onClick={() => setPdfExpanded(!pdfExpanded)}
                className="hidden lg:flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg
                           transition-colors border"
                style={{ color: 'var(--text-secondary, #64748b)',
                         borderColor: 'var(--border-subtle, #e2e8f0)',
                         backgroundColor: 'var(--bg-card, white)' }}
                title={pdfExpanded ? 'Shrink PDF' : 'Expand PDF'}>
                {pdfExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            </div>
            <SolverPdfViewer
              embedUrl={pdfEmbedUrl}
              title={`${title} — Paper`}
              page={pdfPage}
            />
          </div>
        </div>

        {/* ── RIGHT: Video + Tabs (40% on desktop) ── */}
        <div className={`order-1 lg:order-2 ${pdfExpanded ? 'lg:w-[25%]' : 'lg:w-[42%]'} transition-all duration-300 space-y-3`}>
          {/* Video Player */}
          <SolverYouTubePlayer
            embedUrl={ytEmbedUrl}
            title={title}
            onPlayerReady={handlePlayerReady}
          />

          {/* Question Navigation Console */}
          <div className="order-2 rounded-xl p-3 border"
               style={{
                 backgroundColor: 'var(--bg-card, white)',
                 borderColor: 'var(--border-subtle, #e2e8f0)',
               }}>
            <QuestionTabs
              mapping={questionMapping}
              activeQ={activeQ}
              activePart={activePart}
              onSelect={handleSelect}
            />
          </div>

          {/* Currently playing indicator */}
          {activeQ !== null && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              style={{ backgroundColor: 'var(--bg-surface, #f8fafc)', color: 'var(--text-secondary, #64748b)' }}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-medium">
                Now playing: Q{activeQ}
                {activePart ? ` Part ${activePart.toUpperCase()}` : ''}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
