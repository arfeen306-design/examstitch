'use client';

import { useCallback } from 'react';
import { FileText, Download, Printer } from 'lucide-react';

interface FramedPDFViewerProps {
  embedUrl: string;
  downloadUrl: string | null;
  title: string;
  /** Optional label shown in the header (defaults to "PDF Resource") */
  label?: string;
  /** Minimum height for the iframe — defaults to 600px */
  minHeight?: string;
}

const beige = '#f5f0e8';

/**
 * Branded PDF viewer frame used across all resource pages.
 * Features a header bar with Download (primary) + Print (outline) buttons,
 * a subject-themed border, and Drive UI masking overlays.
 */
export default function FramedPDFViewer({
  embedUrl,
  downloadUrl,
  title,
  label = 'PDF Resource',
  minHeight = '600px',
}: FramedPDFViewerProps) {
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
      className="flex flex-col overflow-hidden transition-shadow hover:shadow-xl"
      style={{
        borderRadius: '12px',
        border: '2px solid #E2E8F0',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
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
        <iframe
          src={embedUrl}
          title={title}
          className="w-full border-0"
          style={{ minHeight, height: '100%' }}
          allow="autoplay"
          loading="lazy"
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
      </div>
    </div>
  );
}
