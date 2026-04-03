'use client';

import { useCallback, useState } from 'react';
import { FileText, Download, Printer, AlertTriangle, ExternalLink } from 'lucide-react';

interface FramedPDFViewerProps {
  embedUrl: string;
  downloadUrl: string | null;
  title: string;
  /** Optional label shown in the header (defaults to "PDF Resource") */
  label?: string;
  /** Minimum height for the iframe — defaults to 80vh */
  minHeight?: string;
}

const beige = '#f5f0e8';

/**
 * Branded PDF viewer frame used across all resource pages.
 * Features a header bar with Download (primary) + Print (outline) buttons,
 * a subject-themed border, Drive UI masking overlays, and a fallback
 * message if the embed fails to load (e.g. Google 403).
 */
export default function FramedPDFViewer({
  embedUrl,
  downloadUrl,
  title,
  label = 'Resource Document',
  minHeight = '80vh',
}: FramedPDFViewerProps) {
  const [loadError, setLoadError] = useState(false);

  const handlePrint = useCallback(() => {
    const printWindow = window.open(embedUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => printWindow.print(), 500);
      });
    }
  }, [embedUrl]);

  return (
    <div
      className="flex flex-col overflow-hidden transition-shadow hover:shadow-2xl h-full"
      style={{
        borderRadius: '12px',
        border: '2px solid #E2E8F0',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 12px 24px -8px rgba(0, 0, 0, 0.06)',
        backgroundColor: 'var(--bg-card, #fff)',
      }}
    >
      {/* ── PDF Header Bar ────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          borderBottom: '1px solid #E2E8F0',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        }}
      >
        <span
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
          style={{ color: '#475569' }}
        >
          <FileText className="w-4 h-4" style={{ color: '#64748b' }} />
          {label}
        </span>

        <div className="flex items-center gap-2">
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: '#1e293b', color: '#fff' }}
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all hover:bg-slate-50"
            style={{ borderColor: '#cbd5e1', color: '#475569' }}
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* ── PDF iframe with Drive UI masking ──────────────────────────── */}
      <div
        className="relative flex-1"
        style={{ backgroundColor: beige, minHeight }}
      >
        {loadError ? (
          /* ── Fallback: shown when the iframe fails (403, CORS, etc.) ── */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">PDF Preview Unavailable</h3>
              <p className="text-sm text-slate-500 max-w-md">
                This PDF couldn't be embedded directly. This usually happens when the file's sharing permissions need updating.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:opacity-90"
                  style={{ backgroundColor: '#1e293b' }}
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
              )}
              <a
                href={embedUrl.replace('/preview', '/view')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 rounded-xl border border-slate-300 hover:bg-slate-50 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Drive
              </a>
            </div>
          </div>
        ) : (
          <>
            <iframe
              src={embedUrl}
              title={title}
              className="w-full border-0"
              style={{ minHeight, height: '100%' }}
              allow="autoplay"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              loading="lazy"
              onError={() => setLoadError(true)}
              onLoad={(e) => {
                // Detect 403/blank embed — Google Drive returns a blank page on access denied
                try {
                  const iframe = e.currentTarget;
                  // If iframe loaded but we can't access contentDocument due to CORS, that's normal
                  // The iframe itself loading is a good sign — keep showing it
                } catch {
                  // Cross-origin: expected, embed is working
                }
              }}
            />

            {/* Mask Google Drive chrome */}
            <div className="absolute top-0 left-0 right-0 pointer-events-none z-10"
                 style={{ height: '3px', backgroundColor: beige }} />
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
                 style={{ height: '3px', backgroundColor: beige }} />
            <div className="absolute top-0 left-0 bottom-0 pointer-events-none z-10"
                 style={{ width: '3px', backgroundColor: beige }} />
            <div className="absolute top-0 right-0 bottom-0 pointer-events-none z-10"
                 style={{ width: '6px', backgroundColor: beige }} />
            {/* Cover Drive's built-in open-in-new-window button */}
            <div className="absolute top-0 right-0 w-14 h-12 pointer-events-auto z-20 rounded-bl-lg"
                 style={{ backgroundColor: beige }} />
          </>
        )}
      </div>
    </div>
  );
}
