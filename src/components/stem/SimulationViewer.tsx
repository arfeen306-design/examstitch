'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Maximize,
  Minimize,
  ChevronRight,
  Home,
  BookOpen,
  ChevronLeft,
} from 'lucide-react';
import { useTheme, type Theme } from '@/components/ui/ThemeProvider';
import type { Simulation, StemCategory } from '@/config/stem';

// ── Theme-aware HUD text colours ─────────────────────────────────────────────
const HUD_THEME: Record<Theme, { text: string; muted: string; border: string; bg: string }> = {
  default: { text: 'text-white',       muted: 'text-white/50',     border: 'border-white/[0.12]', bg: 'bg-white/[0.06]' },
  dark:    { text: 'text-white',       muted: 'text-white/50',     border: 'border-white/[0.12]', bg: 'bg-white/[0.06]' },
  beach:   { text: 'text-slate-900',   muted: 'text-slate-600',    border: 'border-slate-300/40', bg: 'bg-white/[0.45]' },
  forest:  { text: 'text-emerald-100', muted: 'text-emerald-300/60', border: 'border-emerald-400/[0.15]', bg: 'bg-white/[0.06]' },
};

// ── Loading animation ────────────────────────────────────────────────────────
function LoadingState({ gradient }: { gradient: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a1a] z-20">
      {/* Pulsing glow */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradient} blur-2xl absolute`}
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg relative`}
      >
        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5m-4.75-11.396c.251.023.501.05.75.082M5 14.5l-1.43 1.43a2.25 2.25 0 0 0 0 3.18l.21.21a2.25 2.25 0 0 0 3.18 0L8.5 17.79m10.5-3.29 1.43 1.43a2.25 2.25 0 0 1 0 3.18l-.21.21a2.25 2.25 0 0 1-3.18 0L15.5 17.79" />
        </svg>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-white/60 text-sm font-medium mt-6 tracking-wide"
      >
        Powering Up Lab...
      </motion.p>
    </div>
  );
}

// ── Instructions panel ───────────────────────────────────────────────────────
function InstructionsPanel({
  open,
  onClose,
  instructions,
  hudColors,
}: {
  open: boolean;
  onClose: () => void;
  instructions: string;
  hudColors: (typeof HUD_THEME)[Theme];
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed top-16 left-3 bottom-3 w-[300px] z-40 rounded-2xl backdrop-blur-2xl ${hudColors.bg} ${hudColors.border} border shadow-2xl overflow-hidden`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
            <div className="flex items-center gap-2">
              <BookOpen className={`w-4 h-4 ${hudColors.muted}`} />
              <span className={`text-sm font-semibold ${hudColors.text}`}>Instructions</span>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded-lg hover:bg-white/[0.1] transition-colors ${hudColors.muted}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto h-[calc(100%-48px)]">
            <p className={`text-sm leading-relaxed ${hudColors.muted}`}>
              {instructions}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main viewer ──────────────────────────────────────────────────────────────
export default function SimulationViewer({
  simulation,
  category,
}: {
  simulation: Simulation;
  category: StemCategory;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const hudColors = HUD_THEME[theme] ?? HUD_THEME.default;

  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Track iframe load
  const handleIframeLoad = useCallback(() => {
    // Small delay for the simulation to initialize its canvas
    setTimeout(() => setLoading(false), 600);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported or denied
    }
  }, []);

  // Listen for external fullscreen changes (Esc key etc.)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Exit lab — use router.back() to preserve scroll position
  const exitLab = useCallback(() => {
    router.back();
  }, [router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        exitLab();
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'i' || e.key === 'I') {
        setShowInstructions((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [exitLab, toggleFullscreen]);

  const hasCode = !!simulation.html_code;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#0a0a1a] z-[80]"
    >
      {/* ── Sandbox iframe ──────────────────────────────────────────────── */}
      {hasCode && (
        <iframe
          ref={iframeRef}
          srcDoc={simulation.html_code!}
          sandbox="allow-scripts allow-same-origin"
          className="absolute inset-0 w-full h-full border-0"
          title={simulation.title}
          onLoad={handleIframeLoad}
        />
      )}

      {/* ── Loading overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {(loading || !hasCode) && (
          <motion.div
            key="loader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {hasCode ? (
              <LoadingState gradient={simulation.gradient} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a1a] z-20">
                <p className="text-white/50 text-sm">No simulation code available yet.</p>
                <button
                  onClick={exitLab}
                  className="mt-4 px-5 py-2 text-sm font-semibold text-white bg-white/[0.1] hover:bg-white/[0.15] border border-white/[0.15] rounded-lg transition-colors"
                >
                  Go Back
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HUD Top Bar ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl ${hudColors.bg} ${hudColors.border} border-b`}
      >
        <div className="flex items-center justify-between h-12 px-3 sm:px-5">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
            <button onClick={exitLab} className={`${hudColors.muted} hover:${hudColors.text} transition-colors shrink-0`}>
              <Home className="w-3.5 h-3.5" />
            </button>
            <ChevronRight className={`w-3 h-3 ${hudColors.muted} opacity-40 shrink-0`} />
            <button onClick={exitLab} className={`${hudColors.muted} hover:${hudColors.text} transition-colors font-medium shrink-0`}>
              STEM
            </button>
            <ChevronRight className={`w-3 h-3 ${hudColors.muted} opacity-40 shrink-0`} />
            <button onClick={exitLab} className={`${hudColors.muted} hover:${hudColors.text} transition-colors font-medium truncate max-w-[100px]`}>
              {category.label}
            </button>
            <ChevronRight className={`w-3 h-3 ${hudColors.muted} opacity-40 shrink-0`} />
            <span className={`${hudColors.text} font-semibold truncate max-w-[160px]`}>
              {simulation.title}
            </span>
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Instructions toggle */}
            <button
              onClick={() => setShowInstructions((p) => !p)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showInstructions
                  ? 'bg-white/[0.15] ' + hudColors.text
                  : hudColors.muted + ' hover:bg-white/[0.08]'
              }`}
              title="Toggle instructions (I)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Instructions</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-lg ${hudColors.muted} hover:bg-white/[0.08] transition-colors`}
              title="Toggle fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Exit */}
            <button
              onClick={exitLab}
              className={`p-2 rounded-lg ${hudColors.muted} hover:bg-red-500/20 hover:text-red-400 transition-colors`}
              title="Exit lab (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Instructions panel ──────────────────────────────────────────── */}
      <InstructionsPanel
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        instructions={simulation.instructions}
        hudColors={hudColors}
      />
    </div>
  );
}
