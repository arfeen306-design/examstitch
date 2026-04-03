'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTheme, type Theme } from '@/components/ui/ThemeProvider';

// ── Theme color palettes ────────────────────────────────────────────────────
const THEME_COLORS: Record<Theme, { dot: string; line: string }> = {
  default: { dot: 'rgba(148, 163, 200, 0.6)',  line: 'rgba(148, 163, 200, 0.12)' },  // soft slate-blue
  dark:    { dot: 'rgba(167, 139, 250, 0.55)', line: 'rgba(167, 139, 250, 0.10)' },  // violet
  beach:   { dot: 'rgba(14, 165, 233, 0.45)',  line: 'rgba(14, 165, 233, 0.08)' },   // sky blue
  forest:  { dot: 'rgba(52, 211, 153, 0.50)',  line: 'rgba(52, 211, 153, 0.09)' },   // emerald
};

// ── Configuration ───────────────────────────────────────────────────────────
const PARTICLE_COUNT = 90;
const MAX_LINK_DIST = 150;
const PARTICLE_RADIUS = 1.4;
const MOUSE_REPEL_DIST = 120;
const MOUSE_REPEL_FORCE = 0.8;
const BASE_SPEED = 0.25;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function PlexusBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const sizeRef = useRef({ w: 0, h: 0 });
  const colorsRef = useRef(THEME_COLORS.beach);
  const { theme } = useTheme();

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

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

      // Re-init particles if none exist or count is way off
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
    window.addEventListener('resize', onResize);

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
    document.addEventListener('mouseleave', onMouseLeave);

    // ── Animation loop ──────────────────────────────────────────────────────
    function tick() {
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
        // Gentle pull back toward base speed
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

      // Draw connections (only check i < j)
      ctx!.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = dx * dx + dy * dy;
          if (dist < MAX_LINK_DIST * MAX_LINK_DIST) {
            const opacity = 1 - Math.sqrt(dist) / MAX_LINK_DIST;
            // Parse the base line color and apply distance-based opacity
            ctx!.strokeStyle = colors.line.replace(
              /[\d.]+\)$/,
              `${(parseFloat(colors.line.match(/[\d.]+\)$/)?.[0] ?? '0.1') * opacity).toFixed(3)})`,
            );
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.stroke();
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

    animRef.current = requestAnimationFrame(tick);

    // ── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animRef.current);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
