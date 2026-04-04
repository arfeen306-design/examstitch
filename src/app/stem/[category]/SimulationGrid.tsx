'use client';

import { useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  Box,
  Move3D,
  TrendingUp,
  Atom,
  Activity,
  Hexagon,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Home,
  FlaskConical,
  Pi,
  Eye,
  Pentagon,
  Zap,
} from 'lucide-react';
import type { StemCategory, Simulation } from '@/config/stem';

// ── Icon resolver ────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Box, Move3D, TrendingUp, Atom, Activity, Hexagon, FlaskConical, Pi, Sparkles, Eye, Pentagon, Zap,
};
function resolveIcon(name: string): React.ElementType {
  return ICON_MAP[name] || Sparkles;
}

// ── Particle field ───────────────────────────────────────────────────────────
function ParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 3,
        dur: 14 + Math.random() * 16,
        delay: Math.random() * -20,
        opacity: 0.08 + Math.random() * 0.18,
      })),
    [],
  );

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <motion.circle
          key={p.id}
          cx={`${p.x}%`}
          cy={`${p.y}%`}
          r={p.size}
          fill="white"
          opacity={p.opacity}
          animate={{
            cy: [`${p.y}%`, `${(p.y + 20) % 100}%`, `${p.y}%`],
            cx: [`${p.x}%`, `${(p.x + 10) % 100}%`, `${p.x}%`],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </svg>
  );
}

// ── Simulation card ──────────────────────────────────────────────────────────
function SimCard({
  sim,
  categorySlug,
  index,
}: {
  sim: Simulation;
  categorySlug: string;
  index: number;
}) {
  const Icon = resolveIcon(sim.icon);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-6, 6]);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const resetMouse = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const difficultyColor: Record<string, string> = {
    Beginner: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    Intermediate: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    Advanced: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 800 }}
      onMouseMove={handleMouse}
      onMouseLeave={resetMouse}
      className="group relative"
    >
      <Link href={`/stem/${categorySlug}/${sim.id}`}>
        {/* Glow */}
        <motion.div
          className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
          style={{ background: sim.glowColor }}
        />

        <div className="relative bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6 h-full
                        hover:border-white/[0.2] hover:bg-white/[0.1] transition-all duration-300 overflow-hidden">
          {/* Gradient accent line */}
          <div className={`absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r ${sim.gradient} rounded-full opacity-60`} />

          {/* Floating icon */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${sim.gradient} flex items-center justify-center mb-4 shadow-lg`}
          >
            <Icon className="w-7 h-7 text-white" strokeWidth={1.8} />
          </motion.div>

          <h3 className="text-lg font-bold text-white mb-1 tracking-tight">{sim.title}</h3>
          <p className="text-sm text-white/50 mb-4 leading-relaxed">{sim.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {sim.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-white/50 bg-white/[0.06] border border-white/[0.08] rounded-full px-2.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${difficultyColor[sim.difficulty]}`}
            >
              {sim.difficulty}
            </span>
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center gap-1 text-xs font-semibold text-white/60 group-hover:text-white transition-colors"
            >
              Enter Lab <ArrowRight className="w-3.5 h-3.5" />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Grid page ────────────────────────────────────────────────────────────────
export default function SimulationGrid({ category }: { category: StemCategory }) {
  const CatIcon = resolveIcon(category.icon);

  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className={`absolute inset-0 bg-gradient-to-b ${category.heroGradient}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />
        <ParticleField />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm mb-8">
            <Link href="/" className="text-white/40 hover:text-white transition-colors">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-white/20" />
            <Link href="/stem" className="text-white/40 hover:text-white transition-colors font-medium">
              STEM
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-white/20" />
            <span className="text-white/70 font-medium">{category.label}</span>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg`}
            >
              <CatIcon className="w-7 h-7 text-white" strokeWidth={1.8} />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight"
              >
                {category.label}{' '}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Simulations
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-sm text-white/50 mt-1"
              >
                {category.description}
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Simulation Grid ───────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 -mt-4 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {category.simulations.map((sim, i) => (
            <SimCard key={sim.id} sim={sim} categorySlug={category.slug} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
