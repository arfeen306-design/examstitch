'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme, type Theme } from '@/components/ui/ThemeProvider';

// ── Theme color palettes ────────────────────────────────────────────────────
const THEME_COLORS: Record<Theme, { dot: string; line: string; lineRgb: string; lineBaseAlpha: number }> = {
  default: {
    dot: 'rgba(148, 163, 200, 0.6)',
    line: 'rgba(148, 163, 200, 0.12)',
    lineRgb: '148, 163, 200',
    lineBaseAlpha: 0.12,
  },
  dark: {
    dot: 'rgba(167, 139, 250, 0.55)',
    line: 'rgba(167, 139, 250, 0.10)',
    lineRgb: '167, 139, 250',
    lineBaseAlpha: 0.10,
  },
  beach: {
    dot: 'rgba(14, 165, 233, 0.45)',
    line: 'rgba(14, 165, 233, 0.08)',
    lineRgb: '14, 165, 233',
    lineBaseAlpha: 0.08,
  },
  forest: {
    dot: 'rgba(52, 211, 153, 0.50)',
    line: 'rgba(52, 211, 153, 0.09)',
    lineRgb: '52, 211, 153',
    lineBaseAlpha: 0.09,
  },
};

// ── Configuration ───────────────────────────────────────────────────────────
const PARTICLE_COUNT = 60;            // Was 90 — coarser keeps the look at half the cost.
const MAX_LINK_DIST = 150;
const MAX_LINK_DIST_SQ = MAX_LINK_DIST * MAX_LINK_DIST;
const PARTICLE_RADIUS = 1.4;
const MOUSE_REPEL_DIST = 120;
const MOUSE_REPEL_FORCE = 0.8;
const BASE_SPEED = 0.25;

// Spatial-grid cell size = MAX_LINK_DIST so we only need to check a particle's
// own cell + the 8 neighbours instead of the full O(n²) cross product.
const CELL_SIZE = MAX_LINK_DIST;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const HIDDEN_PATHS = ['/digital-skills'];

export default function PlexusBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const colorsRef = useRef(THEME_COLORS.beach);
  const visibleRef = useRef(true);
  const pageVisibleRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const { theme } = useTheme();
  const pathname = usePathname();
  const hidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p));

  // Update colors when theme changes — no re-init needed
  useEffect(() => {
    colorsRef.current = THEME_COLORS[theme] ?? THEME_COLORS.beach;
  }, [theme]);

  // Initialize particles for given dimensions
  const initParticles = useCallback((w: number, h: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * BASE_SPEED * 2,
        vy: (Math.random() - 0.5) * BASE_SPEED * 2,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    if (hidden) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // ── prefers-reduced-motion ──────────────────────────────────────────────
    // If the user opts out of motion, render one static frame and stop.
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = motionQuery.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      if (e.matches) {
        cancelAnimationFrame(animRef.current);
      } else {
        animRef.current = requestAnimationFrame(tick);
      }
    };
    motionQuery.addEventListener?.('change', onMotionChange);

    // ── IntersectionObserver: pause when canvas scrolls offscreen ───────────
    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            visibleRef.current = entry.isIntersecting;
          }
        },
        { rootMargin: '50px' },
      );
      io.observe(canvas);
    }

    // ── Tab visibility: pause animation when the tab is backgrounded ────────
    const onVisibilityChange = () => {
      pageVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // ── Resize handler (debounced) ──────────────────────────────────────────
    let resizeTimer: ReturnType<typeof setTimeout>;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeRef.current = { w, h };
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Re-init particles if none exist
      if (particlesRef.current.length === 0) {
        initParticles(w, h);
      }
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    }

    resize();
    initParticles(sizeRef.current.w, sizeRef.current.h);
    window.addEventListener('resize', onResize, { passive: true });

    // ── Mouse tracking ──────────────────────────────────────────────────────
    function onMouseMove(e: MouseEvent) {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    }
    function onMouseLeave() {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave, { passive: true });

    // ── Animation loop ──────────────────────────────────────────────────────
    function tick() {
      // Skip frames cheaply when offscreen, hidden, or reduced-motion.
      if (!visibleRef.current || !pageVisibleRef.current || reducedMotionRef.current) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      const { w, h } = sizeRef.current;
      const particles = particlesRef.current;
      const colors = colorsRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx!.clearRect(0, 0, w, h);

      // Update positions
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse repel
        const dmx = p.x - mx;
        const dmy = p.y - my;
        const dMouse = Math.sqrt(dmx * dmx + dmy * dmy);
        if (dMouse < MOUSE_REPEL_DIST && dMouse > 0) {
          const force = (1 - dMouse / MOUSE_REPEL_DIST) * MOUSE_REPEL_FORCE;
          p.vx += (dmx / dMouse) * force;
          p.vy += (dmy / dMouse) * force;
        }

        // Dampen velocity to BASE_SPEED range
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > BASE_SPEED * 3) {
          const scale = (BASE_SPEED * 3) / speed;
          p.vx *= scale;
          p.vy *= scale;
        }
        p.vx += (Math.sign(p.vx) * BASE_SPEED - p.vx) * 0.01;
        p.vy += (Math.sign(p.vy) * BASE_SPEED - p.vy) * 0.01;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        else if (p.y > h + 10) p.y = -10;
      }

      // ── Spatial-grid bucketing ────────────────────────────────────────────
      // Insert each particle into a coarse grid keyed by (cellX, cellY). Then,
      // when drawing connections, each particle only checks its own cell + the
      // 8 neighbouring cells. Worst-case is still O(n²) for a degenerate
      // distribution, but for uniform layouts this drops to ~O(n) work.
      const cols = Math.max(1, Math.ceil(w / CELL_SIZE));
      const rows = Math.max(1, Math.ceil(h / CELL_SIZE));
      const grid: number[][] = new Array(cols * rows);
      for (let i = 0; i < grid.length; i++) grid[i] = [];
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const cx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / CELL_SIZE)));
        const cy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / CELL_SIZE)));
        grid[cy * cols + cx].push(i);
      }

      // ── Draw connections via grid ─────────────────────────────────────────
      // Cache the line color components so we don't re-parse the rgba string
      // inside the hot inner loop (was 80%+ of the per-frame cost).
      const { lineRgb, lineBaseAlpha } = colors;
      ctx!.lineWidth = 0.5;
      const seen = new Set<number>(); // pair hashes to dedupe (i,j) vs (j,i)
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const cell = grid[cy * cols + cx];
          if (cell.length === 0) continue;
          for (let dy = 0; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dy === 0 && dx < 0) continue; // only forward neighbours
              const nx = cx + dx;
              const ny = cy + dy;
              if (nx < 0 || nx >= cols || ny >= rows) continue;
              const nCell = grid[ny * cols + nx];
              for (let a = 0; a < cell.length; a++) {
                const i = cell[a];
                const start = nCell === cell ? a + 1 : 0;
                for (let b = start; b < nCell.length; b++) {
                  const j = nCell[b];
                  // Cantor-style pair hash so we never draw the same pair twice
                  const lo = i < j ? i : j;
                  const hi = i < j ? j : i;
                  const hash = lo * particles.length + hi;
                  if (seen.has(hash)) continue;
                  seen.add(hash);
                  const dxp = particles[i].x - particles[j].x;
                  const dyp = particles[i].y - particles[j].y;
                  const distSq = dxp * dxp + dyp * dyp;
                  if (distSq >= MAX_LINK_DIST_SQ) continue;
                  const opacity = 1 - Math.sqrt(distSq) / MAX_LINK_DIST;
                  ctx!.strokeStyle = `rgba(${lineRgb}, ${(lineBaseAlpha * opacity).toFixed(3)})`;
                  ctx!.beginPath();
                  ctx!.moveTo(particles[i].x, particles[i].y);
                  ctx!.lineTo(particles[j].x, particles[j].y);
                  ctx!.stroke();
                }
              }
            }
          }
        }
      }

      // Draw particles
      ctx!.fillStyle = colors.dot;
      for (let i = 0; i < particles.length; i++) {
        ctx!.beginPath();
        ctx!.arc(particles[i].x, particles[i].y, PARTICLE_RADIUS, 0, Math.PI * 2);
        ctx!.fill();
      }

      animRef.current = requestAnimationFrame(tick);
    }

    if (!reducedMotionRef.current) {
      animRef.current = requestAnimationFrame(tick);
    } else {
      // Render exactly one static frame so the canvas isn't blank.
      const prev = visibleRef.current;
      visibleRef.current = true;
      reducedMotionRef.current = false;
      tick();
      visibleRef.current = prev;
      reducedMotionRef.current = true;
      cancelAnimationFrame(animRef.current);
    }

    // ── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animRef.current);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      motionQuery.removeEventListener?.('change', onMotionChange);
      io?.disconnect();
    };
  }, [initParticles, hidden]);

  if (hidden) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
