'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { PlayCircle, Eye, Sparkles, X } from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────── */

export interface CarouselWidget {
  id: string;
  media_type: 'youtube' | 'pdf';
  title: string;
  url: string;
  view_count?: number;
  subject?: string;
}

interface VideoCarouselProps {
  widgets: CarouselWidget[];
  isAdmin?: boolean;
}

/* ── Subject themes ──────────────────────────────────────────────── */

const subjectThemes: Record<string, { border: string; glow: string; glowStrong: string; accent: string }> = {
  maths:              { border: '#FF6B00', glow: 'rgba(255,107,0,0.20)', glowStrong: '0 0 28px rgba(255,107,0,0.45), 0 0 8px rgba(255,107,0,0.25)', accent: 'rgba(255,107,0,0.10)' },
  mathematics:        { border: '#FF6B00', glow: 'rgba(255,107,0,0.20)', glowStrong: '0 0 28px rgba(255,107,0,0.45), 0 0 8px rgba(255,107,0,0.25)', accent: 'rgba(255,107,0,0.10)' },
  'computer-science': { border: '#4F46E5', glow: 'rgba(79,70,229,0.25)', glowStrong: '0 0 28px rgba(79,70,229,0.50), 0 0 8px rgba(79,70,229,0.30)', accent: 'rgba(79,70,229,0.10)' },
};
const defaultTheme = {
  border: '#6366f1',
  glow: 'rgba(99,102,241,0.15)',
  glowStrong: '0 0 28px rgba(99,102,241,0.40), 0 0 8px rgba(99,102,241,0.20)',
  accent: 'rgba(99,102,241,0.08)',
};

function getTheme(subject?: string) {
  if (!subject) return defaultTheme;
  return subjectThemes[subject.toLowerCase().replace(/\s+/g, '-')] ?? defaultTheme;
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([^&#?]+)/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
  return null;
}

/* ── Marquee Card ────────────────────────────────────────────────── */

function MarqueeCard({
  widget,
  isAdmin,
  onPlay,
}: {
  widget: CarouselWidget;
  isAdmin: boolean;
  onPlay: (widget: CarouselWidget) => void;
}) {
  const theme = getTheme(widget.subject);
  const videoId = widget.media_type === 'youtube' ? extractVideoId(widget.url) : null;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer"
      style={{ width: 320, zIndex: hovered ? 10 : 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPlay(widget)}
    >
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          borderRadius: 16,
          border: `3px solid ${theme.border}`,
          backgroundColor: 'var(--bg-card, #fff)',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          boxShadow: hovered
            ? theme.glowStrong
            : `0 0 16px ${theme.glow}, 0 4px 12px rgba(0,0,0,0.06)`,
        }}
      >
        {/* Thumbnail */}
        <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
          {videoId ? (
            <>
              <img
                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                alt={widget.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                draggable={false}
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.6) 100%)' }}
              />
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div
                  className="rounded-full p-2.5 transition-transform duration-300"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(6px)',
                    transform: hovered ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  <PlayCircle className="w-9 h-9 text-white drop-shadow-lg" />
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: theme.accent }}>
              <PlayCircle className="w-10 h-10" style={{ color: theme.border, opacity: 0.4 }} />
            </div>
          )}
        </div>

        {/* Glassmorphism footer */}
        <div
          className="px-3.5 py-2.5 flex items-center gap-2"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: `linear-gradient(135deg, ${theme.accent}, var(--bg-card, #fff) 60%)`,
            borderTop: `1px solid ${theme.accent}`,
          }}
        >
          <PlayCircle className="w-3.5 h-3.5 shrink-0" style={{ color: theme.border }} />
          <p className="text-[13px] font-semibold truncate flex-1" style={{ color: 'var(--text-primary, #1A2B56)' }}>
            {widget.title}
          </p>
          {isAdmin && widget.view_count != null && widget.view_count > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--bg-surface, #f3f4f6)', color: 'var(--text-muted, #6b7280)' }}
            >
              <Eye className="w-2.5 h-2.5" />
              {widget.view_count >= 1000 ? `${(widget.view_count / 1000).toFixed(1)}k` : widget.view_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Spotlight Overlay ───────────────────────────────────────────── */

function SpotlightPlayer({
  widget,
  onClose,
}: {
  widget: CarouselWidget;
  onClose: () => void;
}) {
  const videoId = extractVideoId(widget.url);
  if (!videoId) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full"
        style={{ maxWidth: '80vw', maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-7 h-7" />
        </button>
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16 / 9', borderRadius: 16 }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={widget.title}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="text-white/80 text-sm font-medium text-center mt-4 truncate">{widget.title}</p>
      </motion.div>
    </motion.div>
  );
}

/* ── Injected CSS: marquee keyframes + shimmer ───────────────────── */

const GAP = 32;

const marqueeCSS = `
@keyframes marquee-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.marquee-track {
  display: flex;
  gap: ${GAP}px;
  width: max-content;
  animation: marquee-scroll var(--marquee-dur) linear infinite;
  will-change: transform;
}
.marquee-track:hover,
.marquee-track[data-paused="true"] {
  animation-play-state: paused;
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.shimmer-text {
  background: linear-gradient(90deg, #6366f1 0%, #818cf8 25%, #c4b5fd 50%, #818cf8 75%, #6366f1 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3s linear infinite;
}
`;

/* ── Main Carousel ───────────────────────────────────────────────── */

export default function VideoCarousel({ widgets, isAdmin = false }: VideoCarouselProps) {
  const hookRef = useRef<HTMLDivElement>(null);
  const inView = useInView(hookRef, { once: true, margin: '-60px' });
  const [spotlight, setSpotlight] = useState<CarouselWidget | null>(null);

  const youtubeWidgets = useMemo(
    () => widgets.filter((w) => w.media_type === 'youtube'),
    [widgets],
  );

  // Duplicate items so the second half is an identical copy → seamless loop
  const items = useMemo(() => [...youtubeWidgets, ...youtubeWidgets], [youtubeWidgets]);

  // ~6s per card for smooth pacing
  const duration = useMemo(() => Math.max(youtubeWidgets.length * 6, 20), [youtubeWidgets.length]);

  const handlePlay = useCallback((w: CarouselWidget) => setSpotlight(w), []);
  const handleClose = useCallback(() => setSpotlight(null), []);

  if (youtubeWidgets.length === 0) return null;

  return (
    <>
      <style>{marqueeCSS}</style>

      <section className="relative w-full overflow-hidden py-12 lg:py-16">
        {/* ── Hook Section with shimmer ─────────────────────────── */}
        <div ref={hookRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 lg:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="shimmer-text inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
              Future is Here
            </span>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight"
              style={{ color: 'var(--text-primary, #1A2B56)' }}
            >
              The best content to make you better.
            </h2>
          </motion.div>

          <div
            className="mt-5 h-px w-full"
            style={{ background: 'linear-gradient(90deg, var(--border-subtle, #e2e8f0) 0%, transparent 100%)' }}
          />
        </div>

        {/* ── Marquee ──────────────────────────────────────────── */}
        <div className="relative">
          {/* Fade edges — pointer-events-none so cards beneath are clickable */}
          <div
            className="absolute left-0 top-0 bottom-0 z-20 pointer-events-none"
            style={{ width: '8%', background: 'linear-gradient(90deg, var(--bg-primary, #fff) 0%, transparent 100%)' }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 z-20 pointer-events-none"
            style={{ width: '8%', background: 'linear-gradient(270deg, var(--bg-primary, #fff) 0%, transparent 100%)' }}
          />

          {/* Infinite track — hovers pause the entire marquee */}
          <div
            className="marquee-track py-6"
            data-paused={spotlight ? 'true' : undefined}
            style={{ ['--marquee-dur' as string]: `${duration}s` }}
          >
            {items.map((w, i) => (
              <MarqueeCard
                key={`${w.id}-${i}`}
                widget={w}
                isAdmin={isAdmin}
                onPlay={handlePlay}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Spotlight overlay (click-to-expand) ────────────────── */}
      <AnimatePresence>
        {spotlight && <SpotlightPlayer widget={spotlight} onClose={handleClose} />}
      </AnimatePresence>
    </>
  );
}
