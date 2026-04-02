'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, PlayCircle, Eye, Sparkles } from 'lucide-react';

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

/* ── Subject themes (mirrored from MediaFrame) ──────────────────── */

const subjectThemes: Record<string, { border: string; glow: string; accent: string }> = {
  maths:              { border: '#FF6B00', glow: 'rgba(255,107,0,0.25)', accent: 'rgba(255,107,0,0.10)' },
  mathematics:        { border: '#FF6B00', glow: 'rgba(255,107,0,0.25)', accent: 'rgba(255,107,0,0.10)' },
  'computer-science': { border: '#4F46E5', glow: 'rgba(79,70,229,0.30)', accent: 'rgba(79,70,229,0.10)' },
};
const defaultTheme = { border: '#6366f1', glow: 'rgba(99,102,241,0.20)', accent: 'rgba(99,102,241,0.08)' };

function getTheme(subject?: string) {
  if (!subject) return defaultTheme;
  return subjectThemes[subject.toLowerCase().replace(/\s+/g, '-')] ?? defaultTheme;
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([^&#?]+)/);
  if (m) return m[1];
  // Bare video ID (11 chars, alphanumeric + - _)
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
  return null;
}

function thumbnailUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/* ── Single Card ─────────────────────────────────────────────────── */

function CarouselCard({
  widget,
  isAdmin,
  index,
}: {
  widget: CarouselWidget;
  isAdmin: boolean;
  index: number;
}) {
  const theme = getTheme(widget.subject);
  const videoId = widget.media_type === 'youtube' ? extractVideoId(widget.url) : null;
  const [playing, setPlaying] = useState(false);

  const embedSrc = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&enablejsapi=1`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.09, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex-shrink-0 snap-start group cursor-pointer"
      style={{
        width: 'var(--card-w)',
        scrollSnapAlign: 'start',
      }}
    >
      <div
        className="relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
        style={{
          borderRadius: '16px',
          border: `3px solid ${theme.border}`,
          boxShadow: `0 0 20px ${theme.glow}, 0 8px 24px rgba(0,0,0,0.08)`,
          backgroundColor: 'var(--bg-card, #fff)',
        }}
      >
        {/* ── Thumbnail / Player ──────────────────────────────────── */}
        <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
          {playing && embedSrc ? (
            <iframe
              src={embedSrc}
              title={widget.title}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : videoId ? (
            <>
              <img
                src={thumbnailUrl(videoId)}
                alt={widget.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              {/* Dark gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)',
                }}
              />
              {/* Play button */}
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 flex items-center justify-center z-10 group/play"
                aria-label={`Play ${widget.title}`}
              >
                <div
                  className="rounded-full p-3 transition-all duration-300 group-hover/play:scale-110"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: `0 0 30px ${theme.glow}`,
                  }}
                >
                  <PlayCircle className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
              </button>
            </>
          ) : (
            /* Non-YouTube placeholder */
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: theme.accent }}
            >
              <PlayCircle className="w-12 h-12" style={{ color: theme.border, opacity: 0.5 }} />
            </div>
          )}
        </div>

        {/* ── Glassmorphism Footer ────────────────────────────────── */}
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: `linear-gradient(135deg, ${theme.accent}, var(--bg-card, #fff) 60%)`,
            borderTop: `1px solid ${theme.accent}`,
          }}
        >
          <PlayCircle className="w-4 h-4 shrink-0" style={{ color: theme.border }} />
          <p
            className="text-sm font-semibold truncate flex-1"
            style={{ color: 'var(--text-primary, #1A2B56)' }}
          >
            {widget.title}
          </p>

          {/* Admin-only view count */}
          {isAdmin && widget.view_count != null && widget.view_count > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
              style={{
                backgroundColor: 'var(--bg-surface, #f3f4f6)',
                color: 'var(--text-muted, #6b7280)',
              }}
            >
              <Eye className="w-3 h-3" />
              {widget.view_count >= 1000
                ? `${(widget.view_count / 1000).toFixed(1)}k`
                : widget.view_count}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Carousel ───────────────────────────────────────────────── */

export default function VideoCarousel({ widgets, isAdmin = false }: VideoCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const hookRef = useRef<HTMLDivElement>(null);
  const inView = useInView(hookRef, { once: true, margin: '-60px' });

  // Filter to YouTube widgets for the carousel
  const youtubeWidgets = useMemo(
    () => widgets.filter((w) => w.media_type === 'youtube'),
    [widgets],
  );

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, youtubeWidgets.length]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>('[data-card]')?.offsetWidth ?? el.clientWidth * 0.4;
    el.scrollBy({ left: dir === 'left' ? -cardWidth - 24 : cardWidth + 24, behavior: 'smooth' });
  }, []);

  if (youtubeWidgets.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden py-12 lg:py-16">
      {/* ── Hook Section ───────────────────────────────────────── */}
      <div ref={hookRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 lg:mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: '#6366f1' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Future is Here
          </span>
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight"
            style={{ color: 'var(--text-primary, #1A2B56)' }}
          >
            The best content to make you better.
          </h2>
        </motion.div>

        {/* Separator */}
        <div
          className="mt-5 h-px w-full"
          style={{
            background:
              'linear-gradient(90deg, var(--border-subtle, #e2e8f0) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* ── Carousel Track ─────────────────────────────────────── */}
      <div className="relative">
        {/* Left fade */}
        <div
          className="absolute left-0 top-0 bottom-0 z-20 pointer-events-none"
          style={{
            width: '10%',
            background:
              'linear-gradient(90deg, var(--bg-primary, #fff) 0%, transparent 100%)',
          }}
        />
        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 z-20 pointer-events-none"
          style={{
            width: '10%',
            background:
              'linear-gradient(270deg, var(--bg-primary, #fff) 0%, transparent 100%)',
          }}
        />

        {/* Scroll track */}
        <div
          ref={trackRef}
          data-carousel-track=""
          className="flex gap-6 px-[10%] overflow-x-auto"
          style={{
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: '10%',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            ['--card-w' as string]: 'calc((100vw - 20%) / 2.5 - 24px)',
          }}
        >
          <style>{`
            [data-carousel-track]::-webkit-scrollbar { display: none; }
            @media (max-width: 768px) {
              [data-carousel-track] { --card-w: calc((100vw - 20%) / 1.2 - 24px) !important; }
            }
          `}</style>
          {youtubeWidgets.map((w, i) => (
            <div key={w.id} data-card>
              <CarouselCard widget={w} isAdmin={isAdmin} index={i} />
            </div>
          ))}
        </div>

        {/* ── Chevron Nav ─────────────────────────────────────── */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center
                       w-10 h-10 rounded-full shadow-lg transition-all duration-200
                       opacity-0 hover:opacity-100 focus:opacity-100 group-hover/carousel:opacity-100"
            style={{
              backgroundColor: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              opacity: 1,
            }}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-primary, #1A2B56)' }} />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center
                       w-10 h-10 rounded-full shadow-lg transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
            }}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-primary, #1A2B56)' }} />
          </button>
        )}
      </div>
    </section>
  );
}
