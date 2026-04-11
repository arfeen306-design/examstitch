'use client';

import { useEffect, useRef } from 'react';

type Node = { x: number; y: number; vx: number; vy: number };

/**
 * Lightweight constellation canvas (connected drifting nodes).
 * Respects prefers-reduced-motion: static frame only, no animation loop.
 */
export default function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    const nodes: Node[] = [];

    const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const syncSize = () => {
      dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      width = parent.clientWidth;
      height = Math.max(parent.clientHeight, 480);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const buildNodes = () => {
      nodes.length = 0;
      const area = width * height;
      const cap = width < 640 ? 36 : width < 1024 ? 56 : 78;
      const count = Math.min(cap, Math.max(24, Math.floor(area / 16000)));
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const linkDist = Math.min(140, Math.max(80, width * 0.11));
      ctx.lineWidth = 0.55;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) {
            const alpha = (1 - d / linkDist) * 0.13;
            ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = 'rgba(248, 250, 252, 0.2)';
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.35, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x <= 0 || n.x >= width) n.vx *= -1;
        if (n.y <= 0 || n.y >= height) n.vy *= -1;
        n.x = Math.max(1, Math.min(width - 1, n.x));
        n.y = Math.max(1, Math.min(height - 1, n.y));
      }
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };

    const startAnim = () => {
      if (reducedMotion()) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    const stopAnim = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    const paint = () => {
      syncSize();
      buildNodes();
      draw();
    };

    paint();
    if (!reducedMotion()) startAnim();

    const ro = new ResizeObserver(() => {
      paint();
      if (!reducedMotion()) startAnim();
      else stopAnim();
    });
    ro.observe(parent);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => {
      paint();
      if (reducedMotion()) stopAnim();
      else startAnim();
    };
    mq.addEventListener('change', onMq);

    const onVis = () => {
      if (document.hidden) stopAnim();
      else if (!reducedMotion()) startAnim();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      ro.disconnect();
      mq.removeEventListener('change', onMq);
      document.removeEventListener('visibilitychange', onVis);
      stopAnim();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full min-h-full w-full"
    />
  );
}
