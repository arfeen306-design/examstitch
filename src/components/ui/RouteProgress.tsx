'use client';

/**
 * RouteProgress — slim top-bar loading indicator for Next.js App Router.
 * Shows a gold progress bar during route transitions so the UI feels responsive
 * even when the destination page is still loading.
 *
 * Uses monkey-patching of history.pushState/replaceState to detect route changes
 * (the App Router doesn't expose navigation events natively).
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    // Clear any running timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setProgress(15);
    setVisible(true);

    // Trickle the bar forward
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        // Slow down as it approaches 90
        const increment = p < 50 ? 8 : p < 70 ? 4 : 1;
        return Math.min(p + increment, 90);
      });
    }, 200);
  }, []);

  const done = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    setProgress(100);
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  // Intercept link clicks to start progress immediately
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;

      // Same-page link — don't show progress
      if (href === pathname) return;

      // Internal navigation — start the bar
      start();
    }

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [pathname, start]);

  // Complete when pathname changes (route finished loading)
  useEffect(() => {
    done();
  }, [pathname, done]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
    >
      <div
        className="h-full bg-gradient-to-r from-gold-400 via-orange-400 to-gold-500"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 0.2s ease' : 'width 0.4s ease',
          boxShadow: '0 0 8px rgba(212, 175, 55, 0.5)',
        }}
      />
    </div>
  );
}
