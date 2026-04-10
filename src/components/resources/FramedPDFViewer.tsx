'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { FileText, Download, Printer, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import {
  loadAdobePdfEmbedScript,
  whenAdobeViewSdkReady,
  sanitizePdfFileName,
} from '@/lib/adobe-pdf-embed';

interface FramedPDFViewerProps {
  embedUrl: string;
  downloadUrl: string | null;
  title: string;
  label?: string;
  minHeight?: string;
  resourceId?: string;
}

type AdobeInitState = 'off' | 'loading' | 'ready' | 'error';

/**
 * Branded PDF viewer — Adobe PDF Embed API when `NEXT_PUBLIC_ADOBE_CLIENT_ID` + `resourceId`
 * (annotation tools, Safari-friendly SIZED_CONTAINER); else same-origin iframe to `/api/pdf/[id]`.
 */
export default function FramedPDFViewer({
  embedUrl,
  downloadUrl,
  title,
  label = 'Resource Document',
  minHeight = '80vh',
  resourceId,
}: FramedPDFViewerProps) {
  const [loadState, setLoadState] = useState<'checking' | 'ready' | 'error'>('checking');
  const [adobeState, setAdobeState] = useState<AdobeInitState>('off');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const adobeClientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID;
  const useAdobeEmbed = Boolean(adobeClientId && resourceId);

  const iframeSrc = resourceId
    ? `/api/pdf/${resourceId}?inline=1`
    : embedUrl;

  const resolvedDownloadUrl = resourceId
    ? `/api/pdf/${resourceId}`
    : downloadUrl;

  const absolutePdfUrl =
    typeof window !== 'undefined' && resourceId
      ? `${window.location.origin}/api/pdf/${resourceId}?inline=1`
      : '';

  // Pre-flight: PDF reachable (same as before)
  useEffect(() => {
    let cancelled = false;
    setLoadState('checking');

    (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(iframeSrc, {
          method: 'GET',
          signal: controller.signal,
          headers: { Range: 'bytes=0-0' },
        });
        clearTimeout(timer);

        if (cancelled) return;

        const ct = res.headers.get('content-type') || '';
        if (res.ok && (ct.includes('application/pdf') || ct.includes('application/octet-stream'))) {
          setLoadState('ready');
        } else {
          setLoadState('error');
        }
      } catch {
        if (!cancelled) setLoadState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [iframeSrc]);

  // Adobe PDF Embed API — annotation tools + Safari-friendly container mode
  useEffect(() => {
    if (!useAdobeEmbed || loadState !== 'ready' || !resourceId || !absolutePdfUrl) {
      setAdobeState('off');
      return;
    }

    let cancelled = false;
    const divId = `adobe-dc-view-${resourceId}`;

    setAdobeState('loading');

    (async () => {
      try {
        await loadAdobePdfEmbedScript();
        await whenAdobeViewSdkReady();
        if (cancelled || !window.AdobeDC?.View) {
          setAdobeState('error');
          return;
        }

        const el = document.getElementById(divId);
        if (!el) {
          setAdobeState('error');
          return;
        }
        el.innerHTML = '';

        const adobeDCView = new window.AdobeDC.View({
          clientId: adobeClientId!,
          divId,
        });

        await adobeDCView.previewFile(
          {
            content: { location: { url: absolutePdfUrl } },
            metaData: { fileName: `${sanitizePdfFileName(title)}.pdf` },
          },
          {
            embedMode: 'SIZED_CONTAINER',
            showDownloadPDF: true,
            showPrintPDF: true,
            showAnnotationTools: true,
            showLeftHandPanel: true,
            enableFormFilling: true,
            defaultViewMode: 'FIT_WIDTH',
          },
        );

        if (!cancelled) setAdobeState('ready');
      } catch (e) {
        console.warn('[FramedPDFViewer] Adobe Embed failed, falling back to iframe:', e);
        if (!cancelled) setAdobeState('error');
      }
    })();

    return () => {
      cancelled = true;
      const el = document.getElementById(divId);
      if (el) el.innerHTML = '';
    };
  }, [useAdobeEmbed, loadState, resourceId, absolutePdfUrl, title, adobeClientId]);

  const handleIframeLoad = useCallback(() => {
    setLoadState((prev) => (prev === 'ready' ? 'ready' : prev));
  }, []);

  const handleRetry = useCallback(() => {
    setLoadState('checking');
    setAdobeState('off');
    if (iframeRef.current) {
      iframeRef.current.src = iframeSrc + (iframeSrc.includes('?') ? '&' : '?') + '_r=' + Date.now();
    }
    (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(iframeSrc, {
          method: 'GET',
          signal: controller.signal,
          headers: { Range: 'bytes=0-0' },
        });
        clearTimeout(timer);
        const ct = res.headers.get('content-type') || '';
        if (res.ok && (ct.includes('application/pdf') || ct.includes('application/octet-stream'))) {
          setLoadState('ready');
        } else {
          setLoadState('error');
        }
      } catch {
        setLoadState('error');
      }
    })();
  }, [iframeSrc]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open(iframeSrc, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => printWindow.print(), 500);
      });
    }
  }, [iframeSrc]);

  const showIframeFallback = loadState === 'ready' && (!useAdobeEmbed || adobeState === 'error');
  /** Mount before `previewFile` — SDK requires the target div to exist in the DOM first */
  const showAdobeContainer =
    Boolean(resourceId) && useAdobeEmbed && loadState === 'ready' && adobeState !== 'error';
  /** Off / loading until Adobe mounts — avoids blank frame before SDK runs */
  const showAdobeSpinner =
    useAdobeEmbed && loadState === 'ready' && adobeState !== 'ready' && adobeState !== 'error';

  /** Safari: avoid collapsing the embed container; Adobe path uses a taller minimum */
  const viewerMinHeight = useAdobeEmbed ? '85vh' : minHeight;

  const iframeAccessibleTitle = /^PDF\s+viewer\s+for\s+/i.test(title.trim())
    ? title.trim()
    : `PDF viewer for ${title}`;

  return (
    <div
      role="region"
      aria-label={iframeAccessibleTitle}
      className="flex flex-col overflow-hidden transition-shadow hover:shadow-2xl h-full"
      style={{
        borderRadius: '12px',
        border: '2px solid rgba(99,102,241,0.15)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 12px 24px -8px rgba(0, 0, 0, 0.15)',
        backgroundColor: '#0d1526',
      }}
    >
      <div
        role="toolbar"
        aria-label="PDF document actions"
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
          <FileText className="w-4 h-4 shrink-0" style={{ color: '#6366f1' }} aria-hidden />
          {label}
          {useAdobeEmbed && adobeState === 'ready' && (
            <span className="text-[10px] font-normal normal-case text-indigo-300/90">(annotation tools)</span>
          )}
        </span>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {resolvedDownloadUrl && (
            <a
              href={resolvedDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Download PDF: ${title}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all hover:opacity-90 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1729]"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
              }}
            >
              <Download className="w-3.5 h-3.5 shrink-0" aria-hidden />
              Download
            </a>
          )}
          <a
            href={iframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open PDF in a new browser tab: ${title}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1729]"
            style={{ borderColor: 'rgba(99,102,241,0.35)', color: '#c7d2fe' }}
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
            Open in new tab
          </a>
          <button
            type="button"
            onClick={handlePrint}
            aria-label={`Print PDF: ${title}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1729]"
            style={{ borderColor: 'rgba(99,102,241,0.2)', color: '#94a3b8' }}
          >
            <Printer className="w-3.5 h-3.5 shrink-0" aria-hidden />
            Print
          </button>
        </div>
      </div>

      <div className="relative flex-1 w-full" style={{ backgroundColor: '#525659', minHeight: viewerMinHeight }}>
        {loadState === 'error' ? (
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
              <h3 className="text-lg font-bold mb-1.5" style={{ color: '#e2e8f0' }}>
                PDF Preview Unavailable
              </h3>
              <p className="text-sm max-w-md leading-relaxed" style={{ color: '#64748b' }}>
                The document couldn&apos;t be loaded in the viewer.
                Try opening it in a new tab or downloading it directly.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <button
                type="button"
                onClick={handleRetry}
                aria-label="Retry loading PDF"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1526]"
                style={{
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  color: '#a5b4fc',
                }}
              >
                <RefreshCw className="w-4 h-4 shrink-0" aria-hidden />
                Retry
              </button>
              {resolvedDownloadUrl && (
                <a
                  href={resolvedDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Download PDF: ${title}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1526]"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                  }}
                >
                  <Download className="w-4 h-4 shrink-0" aria-hidden />
                  Download PDF
                </a>
              )}
              <a
                href={iframeSrc}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open PDF in new tab: ${title}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1526]"
                style={{
                  border: '1px solid rgba(99,102,241,0.2)',
                  color: '#94a3b8',
                }}
              >
                <ExternalLink className="w-4 h-4 shrink-0" aria-hidden />
                Open in New Tab
              </a>
            </div>
          </div>
        ) : (
          <>
            {(loadState === 'checking' || showAdobeSpinner) && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
                style={{ background: 'linear-gradient(180deg, #0d1526 0%, #111d35 100%)' }}
              >
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                <p className="text-sm font-medium" style={{ color: '#64748b' }}>
                  {showAdobeSpinner ? 'Loading Adobe PDF viewer…' : 'Loading document...'}
                </p>
              </div>
            )}

            {showAdobeContainer && (
              <div
                id={`adobe-dc-view-${resourceId}`}
                className="w-full h-full min-h-[85vh] bg-[#525659]"
                style={{ minHeight: viewerMinHeight, width: '100%' }}
              />
            )}

            {showIframeFallback && (
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                title={iframeAccessibleTitle}
                className="w-full max-w-full border-0"
                style={{ minHeight: viewerMinHeight, height: '100%', width: '100%' }}
                {...(resourceId
                  ? {}
                  : { sandbox: 'allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox' })}
                referrerPolicy="no-referrer"
                loading="lazy"
                onLoad={handleIframeLoad}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
