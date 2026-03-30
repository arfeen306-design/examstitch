'use client';

import { ReactNode } from 'react';

interface VideoContainerProps {
  /** Title shown in the macOS-style top bar */
  title: string;
  /** The video content (iframe, YT.Player div, etc.) */
  children: ReactNode;
  /** Optional max-width class (default: 'max-w-4xl') */
  maxWidth?: string;
  /** Whether to show the "Staying on ExamStitch" badge below */
  showBadge?: boolean;
}

/**
 * Premium browser-frame shell for YouTube embeds.
 * Provides macOS traffic lights, themed accent border, tinted shadow,
 * hover scale, and a 16:9-safe inner viewport.
 */
export default function VideoContainer({
  title,
  children,
  maxWidth = 'max-w-4xl',
  showBadge = false,
}: VideoContainerProps) {
  return (
    <div className={`${maxWidth} mx-auto group/frame`}>
      {/* ── Device Frame Shell ── */}
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300
                   hover:scale-[1.005]"
        style={{
          border: '4px solid var(--accent, #D4AF37)',
          boxShadow: `
            0 4px 20px var(--shadow-color, rgba(0,0,0,0.1)),
            0 20px 60px -15px color-mix(in srgb, var(--accent, #D4AF37) 30%, transparent)
          `,
        }}
      >
        {/* ── macOS Browser Top Bar ── */}
        <div
          className="flex items-center gap-3 px-4"
          style={{
            height: '32px',
            backgroundColor: 'var(--bg-elevated, #ffffff)',
            borderBottom: '1px solid var(--border-subtle, #E8EAF0)',
          }}
        >
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <span className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
            <span className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
            <span className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
          </div>

          {/* Title — centered using negative margin to offset traffic lights */}
          <span
            className="text-[11px] font-medium truncate flex-1 text-center -ml-10"
            style={{
              color: 'var(--text-muted, #596993)',
              fontFamily: 'var(--font-inter, Inter), system-ui, sans-serif',
            }}
          >
            {title}
          </span>
        </div>

        {/* ── Video Viewport ── */}
        <div className="relative w-full bg-black">
          {children}
        </div>
      </div>

      {/* ── Optional badge ── */}
      {showBadge && (
        <div className="flex justify-center mt-3">
          <span
            className="text-[10px] font-medium px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'var(--accent-subtle, #FDF8EB)',
              color: 'var(--accent-text, #9A7523)',
            }}
          >
            🔒 Staying on ExamStitch
          </span>
        </div>
      )}
    </div>
  );
}
