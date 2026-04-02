'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, TrendingUp, Play, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TrendingPlaylist {
  playlist_id: string;
  playlist_title: string;
  playlist_description: string | null;
  skill_id: string;
  skill_name: string;
  skill_slug: string;
  skill_icon: string;
  skill_gradient: string;
  skill_glow_color: string;
  view_count: number;
  lesson_count: number;
}

interface Props {
  /** Called when user clicks a trending card — should open that skill in cinema player */
  onSelectSkill: (skillSlug: string) => void;
  /** Server-supplied initial data (avoids flash) */
  initialData?: TrendingPlaylist[];
}

// ─── SWR fetcher ────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ─── Component ──────────────────────────────────────────────────────────────

export default function TrendingRow({ onSelectSkill, initialData }: Props) {
  const { data } = useSWR('/api/skills/trending', fetcher, {
    fallbackData: initialData ? { trending: initialData, fallback: false } : undefined,
    refreshInterval: 3600_000, // refresh every hour
    revalidateOnFocus: false,
  });

  const trending: TrendingPlaylist[] = data?.trending ?? [];
  const isFallback = data?.fallback ?? true;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll boundaries
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll, { passive: true });
    return () => el?.removeEventListener('scroll', checkScroll);
  }, [trending]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  // Don't render if no trending data and not falling back
  if (trending.length === 0 && !isFallback) return null;
  // If migration not run yet, show nothing gracefully
  if (trending.length === 0) return null;

  return (
    <section className="relative mb-12">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Flame className="w-5 h-5 text-white" />
          </div>
          {/* Pulse ring */}
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-[#0a0a1a] animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Trending Now
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </h2>
          <p className="text-xs text-white/40">Most watched this week</p>
        </div>
      </div>

      {/* Scroll container */}
      <div className="relative group">
        {/* Left arrow */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Right arrow */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-xl"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Cards */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {trending.map((item, i) => (
            <TrendingCard
              key={item.playlist_id}
              item={item}
              rank={i + 1}
              onSelect={() => onSelectSkill(item.skill_slug)}
            />
          ))}
        </div>
      </div>

      {/* Shimmer keyframes (injected once) */}
      <style jsx global>{`
        @keyframes trending-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .trending-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.06) 40%,
            rgba(255,255,255,0.12) 50%,
            rgba(255,255,255,0.06) 60%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: trending-shimmer 3s ease-in-out infinite;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────

function TrendingCard({
  item,
  rank,
  onSelect,
}: {
  item: TrendingPlaylist;
  rank: number;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative min-w-[280px] max-w-[320px] snap-start flex-shrink-0 rounded-2xl overflow-hidden text-left group cursor-pointer"
      style={{ boxShadow: hovered ? `0 12px 40px ${item.skill_glow_color}` : 'none' }}
    >
      {/* Card background with gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${item.skill_gradient} opacity-20`} />
      <div className="absolute inset-0 bg-[#0f0f2a]/80 backdrop-blur-sm" />

      {/* Shimmer overlay */}
      <div className="absolute inset-0 trending-shimmer pointer-events-none" />

      {/* Border glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl border transition-colors duration-300"
        style={{ borderColor: hovered ? item.skill_glow_color : 'rgba(255,255,255,0.08)' }}
      />

      {/* Content */}
      <div className="relative p-5 space-y-3">
        {/* Top row: rank + badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-white/10 tabular-nums leading-none">
              #{rank}
            </span>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.skill_gradient} flex items-center justify-center shadow-md`}>
              <Layers className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Fire badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="text-[10px] font-bold text-orange-300 tabular-nums">
              {item.view_count >= 1000
                ? `${(item.view_count / 1000).toFixed(1)}k`
                : item.view_count}{' '}
              views
            </span>
          </div>
        </div>

        {/* Title */}
        <div>
          <p className="text-sm font-bold text-white leading-tight line-clamp-1">
            {item.playlist_title}
          </p>
          <p className="text-xs text-white/40 mt-0.5 line-clamp-1">
            {item.skill_name}
            {item.playlist_description ? ` · ${item.playlist_description}` : ''}
          </p>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-white/30 font-medium">
            {item.lesson_count} lesson{item.lesson_count !== 1 ? 's' : ''}
          </span>

          <motion.div
            animate={{ x: hovered ? 4 : 0, opacity: hovered ? 1 : 0.6 }}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: item.skill_glow_color }}
          >
            <Play className="w-3 h-3 fill-current" />
            Watch
          </motion.div>
        </div>
      </div>
    </motion.button>
  );
}
