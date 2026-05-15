'use client';

/**
 * ThemeToggle — used to be a 4-way theme picker. After the brand
 * consolidation it renders a non-interactive Leaf badge so the navbar
 * keeps the same footprint without a dead dropdown trigger.
 */

import { Leaf } from 'lucide-react';

export default function ThemeToggle() {
  return (
    <span
      title="Theme: Dark Forest & Beach"
      aria-label="Theme: Dark Forest & Beach"
      className="inline-flex items-center justify-center p-2 rounded-lg"
    >
      <Leaf className="w-4 h-4" style={{ color: 'var(--accent)' }} aria-hidden />
    </span>
  );
}
