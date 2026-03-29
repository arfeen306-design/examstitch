'use client';

/**
 * AnimatedCounter
 *
 * A viewport-aware, easeOutQuart counter component.
 * - Starts at 0 when entering the viewport (IntersectionObserver)
 * - Uses requestAnimationFrame for 60fps smoothness — no jank on mobile
 * - Respects prefers-reduced-motion for accessibility
 * - Appends suffix (e.g., '+', 'K+') throughout the animation
 */

import { useEffect, useRef, useState } from 'react';

// ── easing function: easeOutQuart ──────────────────────────────────────────────
// Starts fast, decelerates dramatically at the end — feels premium and weighty.
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

// ── Parse a formatted value string into { target, suffix } ────────────────────
// '500+'  → { target: 500,   suffix: '+' }
// '10K+'  → { target: 10000, suffix: 'K+' }
// '200+'  → { target: 200,   suffix: '+' }
// '50+'   → { target: 50,    suffix: '+' }
export function parseStatValue(value: string): { target: number; suffix: string; prefix: string } {
  const str = value.trim();

  // Handle K multiplier (e.g., 10K+)
  const kMatch = str.match(/^(\D*?)([\d.]+)K(\S*)$/i);
  if (kMatch) {
    return {
      prefix: kMatch[1] || '',
      target: Math.round(parseFloat(kMatch[2]) * 1000),
      suffix: `K${kMatch[3] || ''}`,
    };
  }

  // Handle plain number with optional suffix (e.g., 500+)
  const numMatch = str.match(/^(\D*?)([\d.]+)(\S*)$/);
  if (numMatch) {
    return {
      prefix: numMatch[1] || '',
      target: parseFloat(numMatch[2]),
      suffix: numMatch[3] || '',
    };
  }

  return { prefix: '', target: 0, suffix: str };
}

// ── Format display number ──────────────────────────────────────────────────────
// For K values: display as "9.8K" when approaching 10K, then "10K" at the end
function formatDisplay(current: number, target: number, suffix: string): string {
  if (suffix.startsWith('K')) {
    const k = current / 1000;
    // Show one decimal until we're at the final value
    if (current < target) {
      return k % 1 === 0 ? `${k}` : k.toFixed(1);
    }
    return `${Math.round(current / 1000)}`;
  }
  return Math.round(current).toString();
}

// ── Hook ───────────────────────────────────────────────────────────────────────

interface UseCounterOptions {
  target: number;
  duration?: number; // ms, default 2200
  delay?: number;    // ms delay before start, default 0
}

function useCounter({ target, duration = 2200, delay = 0 }: UseCounterOptions) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasStarted = useRef(false);

  // Check for prefers-reduced-motion
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const start = () => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    if (prefersReduced) {
      // Skip animation — jump straight to target
      setCount(target);
      return;
    }

    const run = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(run);
      } else {
        setCount(target); // ensure we land exactly on target
      }
    };

    if (delay > 0) {
      setTimeout(() => { rafRef.current = requestAnimationFrame(run); }, delay);
    } else {
      rafRef.current = requestAnimationFrame(run);
    }
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { count, start };
}

// ── AnimatedCounter component ──────────────────────────────────────────────────

interface AnimatedCounterProps {
  value: string;      // e.g. '500+', '10K+', '50+'
  duration?: number;  // ms
  delay?: number;     // stagger delay in ms
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 2200,
  delay = 0,
  className = '',
}: AnimatedCounterProps) {
  const { prefix, target, suffix } = parseStatValue(value);
  const { count, start } = useCounter({ target, duration, delay });
  const ref = useRef<HTMLSpanElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          start();
          // Disconnect after first trigger — no repeat on scroll back
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observerRef.current.observe(ref.current);
    return () => observerRef.current?.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span ref={ref} className={className} aria-label={value}>
      {prefix}{formatDisplay(count, target, suffix)}{suffix}
    </span>
  );
}
