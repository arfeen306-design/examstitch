'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  FileText,
  ImageIcon,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   CheatSheetViewer — hybrid image / PDF viewer with zoom & download
   ═══════════════════════════════════════════════════════════════════════════ */

interface CheatSheetViewerProps {
  url: string;
  title?: string;
  onClose: () => void;
  accentGradient?: string;
}

function getFileType(url: string): 'image' | 'pdf' | 'drive' | 'unknown' {
  // Google Drive URLs get their own type — we embed them via iframe
  if (url.includes('drive.google.com')) return 'drive';
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/.test(clean)) return 'image';
  if (/\.pdf$/.test(clean)) return 'pdf';
  // Supabase storage URLs often lack extensions — check path hints
  if (clean.includes('/pdf') || clean.includes('document')) return 'pdf';
  if (clean.includes('/image') || clean.includes('/img')) return 'image';
  return 'image';
}

/** Extract Google Drive file ID from various URL formats */
function extractDriveFileId(url: string): string | null {
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return openMatch[1];
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return null;
}

/** Get Google Drive preview (embed) URL */
function toDrivePreviewUrl(url: string): string {
  const fileId = extractDriveFileId(url);
  if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
  return url;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

export default function CheatSheetViewer({
  url,
  title = 'Cheat Sheet',
  onClose,
  accentGradient = 'from-purple-500 to-purple-600',
}: CheatSheetViewerProps) {
  const fileType = getFileType(url);
  const resolvedUrl = fileType === 'drive' ? toDrivePreviewUrl(url) : url;
  const [zoomIdx, setZoomIdx] = useState(2); // Start at 1x
  const zoom = ZOOM_LEVELS[zoomIdx];

  const zoomIn = useCallback(
    () => setZoomIdx((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1)),
    [],
  );
  const zoomOut = useCallback(
    () => setZoomIdx((i) => Math.max(i - 1, 0)),
    [],
  );
  const resetZoom = useCallback(() => setZoomIdx(2), []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, pointerEvents: 'none' as const }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Backdrop — clicks close modal but don't block navbar during exit */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-[95vw] max-w-5xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl"
          style={{ backgroundColor: '#0F1A2B' }}
        >
          {/* ── Header bar ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.03]">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accentGradient} flex items-center justify-center`}
              >
                {fileType === 'pdf' || fileType === 'drive' ? (
                  <FileText className="w-4 h-4 text-white" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {title}
                </p>
                <p className="text-white/40 text-xs">
                  {fileType === 'pdf' ? 'PDF Document' : fileType === 'drive' ? 'Google Drive' : 'Image'} •{' '}
                  {Math.round(zoom * 100)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Zoom controls (image only) */}
              {fileType === 'image' && (
                <>
                  <button
                    onClick={zoomOut}
                    disabled={zoomIdx === 0}
                    className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors disabled:opacity-30"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4 text-white/70" />
                  </button>
                  <button
                    onClick={resetZoom}
                    className="px-2 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors text-xs text-white/60 font-mono"
                    title="Reset zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-white/50 mr-1" />
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    onClick={zoomIn}
                    disabled={zoomIdx === ZOOM_LEVELS.length - 1}
                    className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors disabled:opacity-30"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4 text-white/70" />
                  </button>
                  <div className="w-px h-5 bg-white/[0.08] mx-1" />
                </>
              )}

              {/* Open in new tab */}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors"
                title="Open in new tab"
              >
                <Maximize2 className="w-4 h-4 text-white/70" />
              </a>

              {/* Download */}
              <a
                href={url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className={`h-8 px-3 rounded-lg bg-gradient-to-r ${accentGradient} flex items-center gap-1.5 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-shadow`}
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>

              {/* Close */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-red-500/20 flex items-center justify-center transition-colors ml-1"
              >
                <X className="w-4 h-4 text-white/60 hover:text-red-400" />
              </button>
            </div>
          </div>

          {/* ── Content area ───────────────────────────────────────── */}
          <div className="flex-1 overflow-auto relative">
            {fileType === 'pdf' ? (
              <PdfContent url={resolvedUrl} />
            ) : fileType === 'drive' ? (
              <DriveContent url={resolvedUrl} title={title} />
            ) : (
              <ImageContent url={resolvedUrl} zoom={zoom} title={title} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── PDF sub-component ──────────────────────────────────────────────────── */

function PdfContent({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Use Google Docs viewer as fallback for cross-origin PDFs
  const embedUrl = url.includes('drive.google.com')
    ? url
    : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

  return (
    <div className="relative w-full h-full min-h-[70vh]">
      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0F1A2B]">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-sm text-white/40">Loading PDF...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0F1A2B] px-6 text-center">
          <FileText className="w-10 h-10 text-white/20" />
          <p className="text-sm text-white/50">PDF preview unavailable.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-semibold text-white rounded-lg bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
          >
            Open in New Tab
          </a>
        </div>
      )}
      <iframe
        src={embedUrl}
        title="Cheat Sheet PDF"
        className={`w-full h-full min-h-[70vh] border-0 ${error ? 'hidden' : ''}`}
        style={{ backgroundColor: '#f5f0e8' }}
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}

/* ── Google Drive sub-component (iframe embed) ─────────────────────────── */

function DriveContent({ url, title }: { url: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-full min-h-[70vh]">
      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0F1A2B]">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-sm text-white/40">Loading document...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0F1A2B] px-6 text-center">
          <FileText className="w-10 h-10 text-white/20" />
          <p className="text-sm text-white/50">Document preview unavailable.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-semibold text-white rounded-lg bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
          >
            Open in New Tab
          </a>
        </div>
      )}
      <iframe
        src={url}
        title={title}
        className={`w-full h-full min-h-[70vh] border-0 ${error ? 'hidden' : ''}`}
        allow="autoplay"
        sandbox="allow-same-origin allow-scripts"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}

/* ── Image sub-component with zoom ──────────────────────────────────────── */

function ImageContent({
  url,
  zoom,
  title,
}: {
  url: string;
  zoom: number;
  title: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="flex items-center justify-center p-6 min-h-[70vh] overflow-auto">
      {/* Glow effect behind image */}
      <div className="relative">
        {loaded && (
          <div
            className="absolute -inset-4 rounded-2xl opacity-30 blur-2xl pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse, rgba(168,85,247,0.4), transparent 70%)',
            }}
          />
        )}

        {/* The image */}
        <motion.img
          src={url}
          alt={title}
          onLoad={() => setLoaded(true)}
          animate={{ scale: zoom }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative max-w-full rounded-xl shadow-2xl shadow-black/40 cursor-grab active:cursor-grabbing"
          style={{
            transformOrigin: 'center center',
            maxHeight: '75vh',
            objectFit: 'contain',
          }}
          draggable={false}
        />

        {/* Loading skeleton */}
        {!loaded && (
          <div className="w-[600px] h-[400px] rounded-xl bg-white/[0.04] animate-pulse flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-white/10" />
          </div>
        )}
      </div>
    </div>
  );
}
