'use client';

import { useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  Pi,
  FlaskConical,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Home,
} from 'lucide-react';
import { STEM_CATEGORIES } from '@/config/stem';

// ── Icon resolver ────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = { Pi, FlaskConical };
function resolveIcon(name: string): React.ElementType {
  return ICON_MAP[name] || Sparkles;
}

// ── Floating particle field (matches Digital Skills aesthetic) ────────────────
function ParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 35 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 3,
        dur: 14 + Math.random() * 16,
        delay: Math.random() * -20,
        opacity: 0.1 + Math.random() * 0.2,
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
            cy: [`${p.y}%`, `${(p.y + 25) % 100}%`, `${p.y}%`],
            cx: [`${p.x}%`, `${(p.x + 12) % 100}%`, `${p.x}%`],
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

// ── Orbit rings ──────────────────────────────────────────────────────────────
function OrbitRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[300, 440, 580].map((size, i) => (
        <motion.div
          key={size}
          className="absolute rounded-full border border-white/[0.06]"
          style={{ width: size, height: size }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 55 + i * 20, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-white/30"
            style={{ top: 0, left: '50%', marginLeft: -4, marginTop: -4 }}
            animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ── Category card with 3D tilt + glow ────────────────────────────────────────
function CategoryCard({
  category,
  index,
}: {
  category: (typeof STEM_CATEGORIES)[number];
  index: number;
}) {
  const Icon = resolveIcon(category.icon);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);
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

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 900 }}
      onMouseMove={handleMouse}
      onMouseLeave={resetMouse}
      className="group relative"
    >
      <Link href={`/stem/${category.slug}`}>
        {/* Glow backdrop */}
        <motion.div
          className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
          style={{ background: category.glowColor }}
        />

        <div className="relative bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl p-8 sm:p-10 h-full
                        hover:border-[var(--accent)] hover:shadow-lg transition-all duration-300 overflow-hidden shadow-[0_2px_16px_var(--shadow-color)]">
          {/* Gradient accent line */}
          <div
            className={`absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r ${category.gradient} rounded-full opacity-80`}
          />

          {/* Floating icon */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-6 shadow-lg`}
          >
            <Icon className="w-8 h-8 text-white" strokeWidth={1.8} />
          </motion.div>

          <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">
            {category.label}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed max-w-sm">
            {category.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-medium">
              {category.simulations.length} simulations
            </span>
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors"
            >
              Enter Lab <ArrowRight className="w-4 h-4" />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Main landing ─────────────────────────────────────────────────────────────
export default function StemLanding() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--bg-primary)]" />
        <ParticleField />
        <OrbitRings />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-1.5 text-sm mb-8">
            <Link href="/" className="text-white/40 hover:text-white transition-colors">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-white/20" />
            <span className="text-white/70 font-medium">STEM</span>
          </nav>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-white/80 tracking-wide uppercase">
              Interactive Hub
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-5"
          >
            Interactive STEM{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              Simulations
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed"
          >
            Hands-on 3D labs for Mathematics and Science. Rotate molecules,
            plot functions, swing pendulums — learn by doing.
          </motion.p>
        </div>
      </section>

      {/* ── Category Cards ────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 -mt-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {STEM_CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.id} category={cat} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
