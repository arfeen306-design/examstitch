'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { FileText, Download, Printer, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface FramedPDFViewerProps {
  embedUrl: string;
  downloadUrl: string | null;
  title: string;
  /** Optional label shown in the header (defaults to "PDF Resource") */
  label?: string;
  /** Minimum height for the iframe — defaults to 80vh */
  minHeight?: string;
  /** Resource ID — when provided, the PDF is proxied through /api/pdf/[id] to avoid Drive 403s */
  resourceId?: string;
}

/**
 * Branded PDF viewer frame used across all resource pages.
 * When a resourceId is provided, the PDF is served through our own API
 * (server-side fetch + optional watermarking) instead of embedding Google Drive
 * directly — this eliminates 403 errors from Drive sharing restrictions.
 *
 * Uses <object> with <iframe> fallback for maximum compatibility.
 * Includes a 5-second timeout fallback with navy-themed error UI.
 */
export default function FramedPDFViewer({
  embedUrl,
  downloadUrl,
  title,
  label = 'Resource Document',
  minHeight = '80vh',
  resourceId,
}: FramedPDFViewerProps) {
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use our own PDF API proxy when we have a resourceId — avoids Google 403
  const iframeSrc = resourceId
    ? `/api/pdf/${resourceId}?inline=1`
    : embedUrl;

  // Download via our API too (includes watermark)
  const resolvedDownloadUrl = resourceId
    ? `/api/pdf/${resourceId}`
    : downloadUrl;

  // 5-second timeout: if the embed hasn't signalled success, show fallback
  useEffect(() => {
    setLoadState('loading');
    timerRef.current = setTimeout(() => {
      setLoadState((prev) => (prev === 'loading' ? 'error' : prev));
    }, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [iframeSrc]);

  const handleLoad = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoadState('loaded');
  }, []);

  const handleError = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoadState('error');
  }, []);

  const handleRetry = useCallback(() => {
    setLoadState('loading');
    timerRef.current = setTimeout(() => {
      setLoadState((prev) => (prev === 'loading' ? 'error' : prev));
    }, 5000);
  }, []);

  const handlePrint = useCallback(() => {
    const printWindow = window.open(iframeSrc, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => printWindow.print(), 500);
      });
    }
  }, [iframeSrc]);

  return (
    <div
      className="flex flex-col overflow-hidden transition-shadow hover:shadow-2xl h-full"
      style={{
        borderRadius: '12px',
        border: '2px solid rgba(99,102,241,0.15)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 12px 24px -8px rgba(0, 0, 0, 0.15)',
        backgroundColor: '#0d1526',
      }}
    >
      {/* ── PDF Header Bar ────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          borderBottom: '1px solid rgba(99,102,241,0.12)',
          background: 'linear-gradient(135deg, #0f1729 0%, #111d35 100%)',
        }}
      >
        <span
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
          style={{ color: '#94a3b8' }}
        >
          <FileText className="w-4 h-4" style={{ color: '#6366f1' }} />
          {label}
        </span>

        <div className="flex items-center gap-2">
          {resolvedDownloadUrl && (
            <a
              href={resolvedDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all hover:opacity-90 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all hover:bg-white/[0.05]"
            style={{ borderColor: 'rgba(99,102,241,0.2)', color: '#94a3b8' }}
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* ── PDF embed area ────────────────────────────────────────────── */}
      <div
        className="relative flex-1"
        style={{ backgroundColor: '#525659', minHeight }}
      >
        {loadState === 'error' ? (
          /* ── Navy-themed fallback: shown when PDF fails to load ──── */
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center"
            style={{ background: 'linear-gradient(180deg, #0d1526 0%, #111d35 100%)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(251,146,60,0.15) 0%, rgba(245,158,11,0.08) 100%)',
                border: '1px solid rgba(251,146,60,0.2)',
              }}
            >
              <AlertTriangle className="w-8 h-8" style={{ color: '#fb923c' }} />
            </div>
            <div>
              <h3
                className="text-lg font-bold mb-1.5"
                style={{ color: '#e2e8f0' }}
              >
                PDF Preview Unavailable
              </h3>
              <p
                className="text-sm max-w-md leading-relaxed"
                style={{ color: '#64748b' }}
              >
                The document couldn&apos;t be loaded in the viewer.
                Try opening it in a new tab or downloading it directly.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:opacity-90"
                style={{
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  color: '#a5b4fc',
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              {resolvedDownloadUrl && (
                <a
                  href={resolvedDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
              )}
              <a
                href={iframeSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:bg-white/[0.05]"
                style={{
                  border: '1px solid rgba(99,102,241,0.2)',
                  color: '#94a3b8',
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Loading overlay — visible until PDF loads */}
            {loadState === 'loading' && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
                style={{ background: 'linear-gradient(180deg, #0d1526 0%, #111d35 100%)' }}
              >
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                <p className="text-sm font-medium" style={{ color: '#64748b' }}>
                  Loading document...
                </p>
              </div>
            )}

            {/* Primary: <object> for native PDF rendering with <iframe> fallback */}
            <object
              data={iframeSrc}
              type="application/pdf"
              className="w-full border-0"
              style={{ minHeight, height: '100%' }}
              onLoad={handleLoad}
              onError={handleError}
            >
              {/* Fallback: <iframe> for browsers that don't support <object> for PDFs */}
              <iframe
                src={iframeSrc}
                title={title}
                className="w-full border-0"
                style={{ minHeight, height: '100%' }}
                allow="autoplay"
                referrerPolicy="no-referrer"
                loading="lazy"
                onLoad={handleLoad}
                onError={handleError}
              />
            </object>
          </>
        )}
      </div>
    </div>
  );
}
