'use client';

/**
 * InteractiveSolver
 *
 * Dual-pane interface for past paper solutions:
 *  - Left (60%): PDF viewer (solved paper) — NEVER reloads on tab clicks
 *  - Right (40%): YouTube player + Question/Sub-part navigation tabs
 *
 * Critical architecture:
 *  - PDF iframe uses a STABLE key (never remounts) so scroll position is preserved
 *  - QuestionTabs use <button> with e.preventDefault/stopPropagation (no router interaction)
 *  - seekTo is called directly on the YT.Player ref (no page-level state changes)
 *  - SolverPdfViewer is React.memo'd so parent re-renders don't touch it
 */

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Play, ChevronDown, ChevronUp,
  FileText, RotateCcw, Maximize2, Minimize2,
} from 'lucide-react';
import { toEmbedUrl } from '@/lib/url-transform';
import VideoContainer from './VideoContainer';

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
  videoUrl: string;
  pdfUrl: string;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [ended, setEnded] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const readyCbRef = useRef(onPlayerReady);
  readyCbRef.current = onPlayerReady;

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

  // Create the player using the YT.Player constructor with a div target
  // This gives us full API control including seekTo, playVideo, pauseVideo
  useEffect(() => {
    if (!apiReady || !containerRef.current || playerRef.current) return;

    // Extract video ID from embed URL
    const vidMatch = embedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (!vidMatch) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: vidMatch[1],
      playerVars: {
        rel: 0,
        modestbranding: 1,
        controls: 1,
        iv_load_policy: 3,
        enablejsapi: 1,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      },
      events: {
        onReady: () => readyCbRef.current(playerRef.current),
        onStateChange: (e: any) => {
          if (e.data === 0) setEnded(true); // YT.PlayerState.ENDED
        },
      },
    });

    return () => {
      try { playerRef.current?.destroy(); } catch (_) {}
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiReady, embedUrl]);

  const handleReplay = useCallback(() => {
    setEnded(false);
    try { playerRef.current?.seekTo(0, true); playerRef.current?.playVideo(); } catch (_) {}
  }, []);

  return (
    <VideoContainer title={title} maxWidth="max-w-full">
      {/* 16:9 aspect ratio container */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <div ref={containerRef}
             style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      </div>

      {/* End of video overlay */}
      <AnimatePresence>
        {ended && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center
                       bg-black/80 backdrop-blur-sm gap-3 px-4"
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
    </VideoContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF Viewer — React.memo'd to prevent reload on parent re-renders
// ─────────────────────────────────────────────────────────────────────────────

const SolverPdfViewer = memo(function SolverPdfViewer({
  embedUrl,
  title,
}: {
  embedUrl: string;
  title: string;
}) {
  const beige = '#f5f0e8';
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden"
         style={{ backgroundColor: beige, border: `1px solid #e8e0d0` }}>
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full border-0"
        style={{ minHeight: '500px' }}
        allow="autoplay"
        loading="lazy"
      />

      {/* ── Edge overlays to mask Google Drive's internal black borders ── */}
      {/* Top edge */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none z-10"
           style={{ height: '3px', backgroundColor: beige }} />
      {/* Bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
           style={{ height: '3px', backgroundColor: beige }} />
      {/* Left edge */}
      <div className="absolute top-0 left-0 bottom-0 pointer-events-none z-10"
           style={{ width: '3px', backgroundColor: beige }} />
      {/* Right edge (wider — covers Drive's scrollbar border) */}
      <div className="absolute top-0 right-0 bottom-0 pointer-events-none z-10"
           style={{ width: '6px', backgroundColor: beige }} />

      {/* Cover Google Drive's "open in new window" icon (top-right) */}
      <div className="absolute top-0 right-0 w-14 h-12 pointer-events-auto z-20 rounded-bl-lg"
           style={{ backgroundColor: beige }} />
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Format seconds to MM:SS
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Question Navigation Tabs (pure client-side, no router interaction)
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

  const handleQClick = (e: React.MouseEvent, q: QuestionMapping) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedQ(prev => prev === q.question ? null : q.question);
    onSelect(q);
  };

  const handlePartClick = (e: React.MouseEvent, q: QuestionMapping, part: QuestionPart) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(q, part);
  };

  return (
    <div className="space-y-2">
      {/* Header label */}
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
              type="button"
              onClick={(e) => handleQClick(e, q)}
              className={`relative shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                         transition-all duration-200 border select-none
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
                      type="button"
                      onClick={(e) => handlePartClick(e, q, part)}
                      className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold
                                 transition-all duration-200 border select-none
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

  // Mutable ref to the YT.Player — never stored in state to avoid re-renders
  const playerRef = useRef<any>(null);

  // UI state — only these cause visual re-renders (NOT the PDF)
  const [activeQ, setActiveQ] = useState<number | null>(null);
  const [activePart, setActivePart] = useState<string | null>(null);
  const [pdfExpanded, setPdfExpanded] = useState(false);

  const handlePlayerReady = useCallback((player: any) => {
    playerRef.current = player;
  }, []);

  // Tab click handler: seek video ONLY, never touch the PDF iframe
  const handleSelect = useCallback((q: QuestionMapping, part?: QuestionPart) => {
    const time = part ? part.start_time : q.start_time;

    // Update active highlight (only re-renders the tabs, not the PDF)
    setActiveQ(q.question);
    setActivePart(part?.part || null);

    // Seek video — works whether video is playing or paused
    if (playerRef.current) {
      try {
        playerRef.current.seekTo(time, true);
        // Only auto-play if the player is currently paused
        const state = playerRef.current.getPlayerState?.();
        // 2 = paused, -1 = unstarted, 5 = cued
        if (state === 2 || state === -1 || state === 5) {
          playerRef.current.playVideo();
        }
      } catch (_) {}
    }
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
      <div className="flex flex-col lg:flex-row gap-4"
           style={{ minHeight: '70vh' }}>

        {/* ── LEFT: PDF Viewer (60%) — NEVER re-renders on tab clicks ── */}
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
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPdfExpanded(!pdfExpanded); }}
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
            />
          </div>
        </div>

        {/* ── RIGHT: Video + Tabs (40%) ── */}
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
              key={`now-${activeQ}-${activePart}`}
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
