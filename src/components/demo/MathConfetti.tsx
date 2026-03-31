'use client';

import { useEffect, useRef } from 'react';

const SYMBOLS = ['∫', 'π', '∑', '√', '±', '∞', 'Δ', 'θ', '×', '÷', 'α', 'β', 'λ', '≠', 'ⁿ', '≈'];
const COLORS  = ['#FF6B35', '#0EA5E9', '#22C55E', '#F59E0B', '#A855F7', '#EC4899', '#38BDF8'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  symbol: string;
  color: string;
  size: number;
  opacity: number;
  life: number;     // 0–1, decreases over time
}

function createParticle(canvasWidth: number): Particle {
  return {
    x:             Math.random() * canvasWidth,
    y:             -20,
    vx:            (Math.random() - 0.5) * 3,
    vy:            Math.random() * 3 + 2,
    rotation:      Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.15,
    symbol:        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    color:         COLORS[Math.floor(Math.random() * COLORS.length)],
    size:          Math.random() * 14 + 14,
    opacity:       1,
    life:          1,
  };
}

export default function MathConfetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef  = useRef<number>(0);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      particlesRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Spawn burst immediately then continue for 3 s
    for (let i = 0; i < 40; i++) particlesRef.current.push(createParticle(canvas.width));
    let spawned = 0;
    spawnRef.current = setInterval(() => {
      for (let i = 0; i < 6; i++) particlesRef.current.push(createParticle(canvas.width));
      spawned++;
      if (spawned >= 15 && spawnRef.current) clearInterval(spawnRef.current); // ~3 s
    }, 200);

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.life > 0.01);

      for (const p of particlesRef.current) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.06; // gravity
        p.rotation += p.rotationSpeed;
        p.life     -= 0.006;
        p.opacity   = Math.min(1, p.life * 2);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `bold ${p.size}px 'Georgia', serif`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.symbol, 0, 0);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
      aria-hidden
    />
  );
}
