'use client';

import { memo, useCallback, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import type { SubjectEntry } from '@/config/subjects';

interface SubjectCardProps {
  subject: SubjectEntry;
  index: number;
  basePath: string;          // "/olevel" or "/alevel"
  resourceCount?: number;    // dynamic count from DB; undefined = still loading
  onComingSoon?: () => void; // called when an inactive card is clicked
}

const SubjectCard = memo(function SubjectCard({ subject, index, basePath, resourceCount, onComingSoon }: SubjectCardProps) {
  const Icon = subject.icon;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-6, 6]);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouse = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mouseX, mouseY]);

  const resetMouse = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const handleComingSoon = useCallback(() => {
    onComingSoon?.();
  }, [onComingSoon]);
  const hasNoContentYet = subject.active && resourceCount !== undefined && resourceCount === 0;

  const inner = (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 800 }}
      onMouseMove={handleMouse}
      onMouseLeave={resetMouse}
      className="group relative cursor-pointer h-full"
    >
      {/* Glow backdrop — hidden on mobile for performance */}
      <div
        className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-70 transition-opacity duration-500 blur-xl hidden sm:block"
        style={{ background: subject.colorScheme.glow }}
      />

      <div className="relative bg-[var(--bg-card)]/60 backdrop-blur-xl border border-[var(--border-subtle)] rounded-2xl p-6 h-full
                      hover:border-[var(--border-color)] hover:bg-[var(--bg-elevated)] transition-all duration-300 overflow-hidden flex flex-col glass-gpu">
        {/* Gradient accent line */}
        <div className={`absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r ${subject.colorScheme.gradient} rounded-full opacity-60`} />

        {/* Code badge + icon row */}
        <div className="flex items-start justify-between mb-4">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${subject.colorScheme.badge}`}>
            {subject.code}
          </span>

          {/* Floating icon — simplified animation */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${subject.colorScheme.gradient} flex items-center justify-center shadow-lg`}
          >
            <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
          </motion.div>
        </div>

        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 tracking-tight">{subject.name}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed flex-1">{subject.description}</p>

        <div className="flex items-center justify-between mt-auto">
          {subject.active ? (
            <>
              <span className="text-xs text-[var(--text-muted)] font-medium tabular-nums">
                {resourceCount !== undefined ? `${resourceCount} resources` : '...'}
              </span>
              {hasNoContentYet ? (
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
                  <Clock className="w-3 h-3" /> Coming Soon
                </span>
              ) : (
                <span className={`flex items-center gap-1 text-xs font-medium ${subject.colorScheme.accent} group-hover:brightness-125 transition-all`}>
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
              <Clock className="w-3 h-3" /> Coming Soon
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (subject.active && !hasNoContentYet) {
    return (
      <Link href={`${basePath}/${subject.id}`} className="block h-full" prefetch={true}>
        {inner}
      </Link>
    );
  }

  return (
    <div onClick={handleComingSoon} className="h-full">
      {inner}
    </div>
  );
});

export default SubjectCard;
