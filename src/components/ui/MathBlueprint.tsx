'use client';

/**
 * MathBlueprint — Decorative mathematical formula watermarks
 *
 * Renders subtle, hand-drawn-style math equations as SVG text scattered
 * across the background. Adapts color & opacity to the active theme.
 *
 * Usage:
 *   <div className="relative overflow-hidden">
 *     <MathBlueprint />
 *     {children}
 *   </div>
 *
 * On light themes  → slate color, 4-5% opacity
 * On dark themes   → accent/white color, 6-8% opacity
 */

import { memo } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Mathematical formula definitions
// Each has text content, position, rotation, and scale
// ─────────────────────────────────────────────────────────────────────────────

interface MathElement {
  text: string;
  x: string;        // % position
  y: string;
  rotate: number;   // degrees
  scale: number;    // relative size
  font: string;     // serif for formulas, mono for code-like
}

const FORMULAS: MathElement[] = [
  // Quadratic formula
  { text: 'x = (-b ± √(b²-4ac)) / 2a', x: '5%', y: '15%', rotate: -12, scale: 1.1, font: 'serif' },
  // Trig identity
  { text: '1 + cot²θ = csc²θ', x: '72%', y: '8%', rotate: 8, scale: 0.95, font: 'serif' },
  // Derivative
  { text: 'd/dx sin(x) = cos(x)', x: '60%', y: '78%', rotate: -6, scale: 1, font: 'serif' },
  // Euler's identity
  { text: 'e^(iπ) + 1 = 0', x: '85%', y: '45%', rotate: 15, scale: 1.15, font: 'serif' },
  // Integration
  { text: '∫ x² dx = x³/3 + C', x: '8%', y: '72%', rotate: 5, scale: 1.05, font: 'serif' },
  // Pythagorean
  { text: 'a² + b² = c²', x: '38%', y: '88%', rotate: -8, scale: 0.9, font: 'serif' },
  // Sum formula
  { text: 'Σ(n=1→∞) 1/n² = π²/6', x: '25%', y: '35%', rotate: 12, scale: 0.85, font: 'serif' },
  // Binomial
  { text: '(a+b)ⁿ = Σ C(n,k) aⁿ⁻ᵏ bᵏ', x: '78%', y: '65%', rotate: -4, scale: 0.8, font: 'serif' },
  // Limit
  { text: 'lim(x→0) sin(x)/x = 1', x: '42%', y: '5%', rotate: -15, scale: 0.9, font: 'serif' },
  // Chain rule
  { text: 'd/dx f(g(x)) = f′(g(x))·g′(x)', x: '15%', y: '50%', rotate: 7, scale: 0.75, font: 'serif' },
  // Log identity
  { text: 'ln(ab) = ln(a) + ln(b)', x: '55%', y: '42%', rotate: -10, scale: 0.85, font: 'serif' },
  // Area of circle
  { text: 'A = πr²', x: '90%', y: '25%', rotate: 18, scale: 1.2, font: 'serif' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Geometric shapes (triangles, angles, axes)
// ─────────────────────────────────────────────────────────────────────────────

function GeometricShapes({ color }: { color: string }) {
  return (
    <>
      {/* 30-60-90 triangle */}
      <g transform="translate(120, 280) rotate(-5) scale(0.6)">
        <path d="M0,0 L80,0 L80,140 Z" stroke={color} strokeWidth="1.5" fill="none" />
        <text x="85" y="75" fill={color} fontSize="11" fontFamily="serif, Georgia">60°</text>
        <text x="30" y="-5" fill={color} fontSize="11" fontFamily="serif, Georgia">30°</text>
        <text x="75" y="155" fill={color} fontSize="11" fontFamily="serif, Georgia">90°</text>
      </g>

      {/* Sine wave */}
      <g transform="translate(680, 120) rotate(3) scale(0.5)">
        <path
          d="M0,30 Q25,0 50,30 Q75,60 100,30 Q125,0 150,30 Q175,60 200,30"
          stroke={color} strokeWidth="1.5" fill="none"
        />
        <line x1="0" y1="30" x2="200" y2="30" stroke={color} strokeWidth="0.5" opacity="0.5" />
      </g>

      {/* Small coordinate axes */}
      <g transform="translate(850, 320) rotate(-8) scale(0.5)">
        <line x1="0" y1="50" x2="100" y2="50" stroke={color} strokeWidth="1" />
        <line x1="50" y1="0" x2="50" y2="100" stroke={color} strokeWidth="1" />
        {/* Arrow tips */}
        <path d="M95,47 L100,50 L95,53" stroke={color} strokeWidth="1" fill="none" />
        <path d="M47,5 L50,0 L53,5" stroke={color} strokeWidth="1" fill="none" />
        <text x="102" y="53" fill={color} fontSize="11" fontFamily="serif">x</text>
        <text x="53" y="-2" fill={color} fontSize="11" fontFamily="serif">y</text>
        {/* Parabola */}
        <path
          d="M20,15 Q50,85 80,15"
          stroke={color} strokeWidth="1.2" fill="none"
        />
      </g>

      {/* Small circle with radius */}
      <g transform="translate(350, 350) rotate(6) scale(0.45)">
        <circle cx="40" cy="40" r="35" stroke={color} strokeWidth="1" fill="none" />
        <line x1="40" y1="40" x2="75" y2="40" stroke={color} strokeWidth="1" />
        <text x="50" y="37" fill={color} fontSize="10" fontFamily="serif">r</text>
      </g>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main MathBlueprint component
// ─────────────────────────────────────────────────────────────────────────────

interface MathBlueprintProps {
  /** 'hero' renders in hero gradient sections (uses light text on dark bg),
   *  'section' renders in light content areas (uses dark text on light bg) */
  variant?: 'hero' | 'section';
  className?: string;
}

const MathBlueprint = memo(function MathBlueprint({
  variant = 'section',
  className = '',
}: MathBlueprintProps) {
  // For hero sections (dark bg): use white/gold with slightly higher opacity
  // For content sections (light bg): use slate with very low opacity
  const isHero = variant === 'hero';

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 1000 400"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          opacity: isHero ? 0.07 : 0.04,
          color: isHero
            ? 'var(--text-on-dark, #ffffff)'
            : 'var(--text-primary, #1A2B56)',
        }}
      >
        {/* Text formulas */}
        {FORMULAS.map((f, i) => (
          <text
            key={i}
            x={f.x}
            y={f.y}
            transform={`rotate(${f.rotate}, ${parseFloat(f.x) * 10}, ${parseFloat(f.y) * 4})`}
            fill="currentColor"
            fontSize={13 * f.scale}
            fontFamily={`${f.font === 'serif' ? 'Georgia, "Times New Roman", serif' : '"Fira Code", monospace'}`}
            fontWeight="400"
            letterSpacing="0.5"
          >
            {f.text}
          </text>
        ))}

        {/* Geometric shapes */}
        <GeometricShapes color="currentColor" />
      </svg>
    </div>
  );
});

export default MathBlueprint;
