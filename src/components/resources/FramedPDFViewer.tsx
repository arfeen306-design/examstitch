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
  /**
   * `column` — dual-pane / narrow layouts. Uses SIZED_CONTAINER + explicit height so Adobe
   * fills the host div. `FULL_WINDOW` sizes from the viewport and collapses the doc area here.
   */
  embedLayout?: 'default' | 'column';
  /** Pass through to `/api/pdf` — required for `?mode=worksheet` views so the API serves `worksheet_url`. */
  pdfApiMode?: 'worksheet';
  /** Force iframe mode (skip Adobe SDK) even when client id is available. */
  preferIframe?: boolean;
}

type AdobeInitState = 'off' | 'loading' | 'ready' | 'error';

/**
 * Branded PDF viewer — Adobe PDF Embed API when `NEXT_PUBLIC_ADOBE_CLIENT_ID` + `resourceId`.
 * Adobe SDK + PDF preflight run only after the viewer enters the viewport (saves main-thread + network).
 */
export default function FramedPDFViewer({
  embedUrl,
  downloadUrl,
  title,
  label = 'Resource Document',
  minHeight = '80vh',
  resourceId,
  embedLayout = 'default',
  pdfApiMode,
  preferIframe = false,
}: FramedPDFViewerProps) {
  const [loadState, setLoadState] = useState<'idle' | 'checking' | 'ready' | 'error'>('idle');
  const [adobeState, setAdobeState] = useState<AdobeInitState>('off');
  const [inView, setInView] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  /** After Adobe has mounted once, keep it alive if the user scrolls (avoid re-init flicker). */
  const adobeEverMountedRef = useRef(false);

  const adobeClientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID;
  const canUseAdobeEmbed = Boolean(adobeClientId && resourceId);

  const inlinePdfQuery = (() => {
    if (!resourceId) return '';
    const q = new URLSearchParams();
    q.set('inline', '1');
    if (pdfApiMode === 'worksheet') q.set('mode', 'worksheet');
    return `?${q.toString()}`;
  })();

  const iframeSrc = resourceId ? `/api/pdf/${resourceId}${inlinePdfQuery}` : embedUrl;

  const resolvedDownloadUrl = resourceId
    ? `/api/pdf/${resourceId}${pdfApiMode === 'worksheet' ? '?mode=worksheet' : ''}`
    : downloadUrl;

  const absolutePdfUrl =
    typeof window !== 'undefined' && resourceId
      ? `${window.location.origin}/api/pdf/${resourceId}${inlinePdfQuery}`
      : '';

  const useSizedContainer = canUseAdobeEmbed && embedLayout === 'column';
  // Adobe PDF Embed is unstable in side-by-side narrow columns (stuck spinner / partial viewport),
  // so we use iframe there and keep Adobe for full-width mode.
  const useAdobeEmbed = canUseAdobeEmbed && !useSizedContainer && !preferIframe;
  const shouldFillContainer = useAdobeEmbed && useSizedContainer;
  const viewerMinHeight = useAdobeEmbed ? minHeight || '85vh' : minHeight;
  const adobeEmbedMode = useSizedContainer ? 'SIZED_CONTAINER' : 'FULL_WINDOW';

  // Lazy: start work when the viewer scrolls into view (or is already visible, e.g. modal)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { root: null, rootMargin: '240px 0px', threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Pre-flight PDF only after visible — avoids blocking above-the-fold work
  useEffect(() => {
    if (!inView) return;

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
  }, [inView, iframeSrc]);

  // Adobe PDF Embed API — lazy first paint; keep viewer after first successful mount
  useEffect(() => {
    if (loadState === 'idle' || loadState === 'checking') {
      setAdobeState('off');
    }
  }, [loadState]);

  useEffect(() => {
    if (!useAdobeEmbed || loadState !== 'ready' || !resourceId || !absolutePdfUrl) {
      return;
    }
    if (!inView && !adobeEverMountedRef.current) {
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

        // FULL_WINDOW sizes from the viewport — in narrow dual-pane layouts the doc area collapses; use column + SIZED_CONTAINER there.
        const Enum = window.AdobeDC.View.Enum;
        if (Enum?.CallbackType?.SAVE_API != null && Enum.ApiResponseCode?.SUCCESS != null) {
          adobeDCView.registerCallback(
            Enum.CallbackType.SAVE_API,
            (metaData, _content, _options) =>
              Promise.resolve({
                code: Enum.ApiResponseCode.SUCCESS,
                data: {
                  metaData: { ...metaData, updatedAt: Date.now() },
                },
              }),
            {},
          );
        }

        await adobeDCView.previewFile(
          {
            content: { location: { url: absolutePdfUrl } },
            metaData: {
              fileName: `${sanitizePdfFileName(title)}.pdf`,
              id: resourceId,
            },
          },
          {
            embedMode: adobeEmbedMode,
            showDownloadPDF: true,
            showPrintPDF: true,
            showAnnotationTools: true,
            showLeftHandPanel: true,
            enableFormFilling: true,
            enableLinearization: true,
            defaultViewMode: 'FIT_WIDTH',
          },
        );

        if (!cancelled) {
          adobeEverMountedRef.current = true;
          setAdobeState('ready');
        }
      } catch (e) {
        console.warn('[FramedPDFViewer] Adobe Embed failed, falling back to iframe:', e);
        if (!cancelled) setAdobeState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    inView,
    useAdobeEmbed,
    loadState,
    resourceId,
    absolutePdfUrl,
    title,
    adobeClientId,
    adobeEmbedMode,
  ]);

  useEffect(() => {
    const id = resourceId;
    return () => {
      adobeEverMountedRef.current = false;
      if (id) {
        const el = document.getElementById(`adobe-dc-view-${id}`);
        if (el) el.innerHTML = '';
      }
    };
  }, [resourceId]);

  const handleIframeLoad = useCallback(() => {
    setLoadState((prev) => (prev === 'ready' ? 'ready' : prev));
  }, []);

  const handleRetry = useCallback(() => {
    adobeEverMountedRef.current = false;
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
  const showAdobeContainer =
    Boolean(resourceId) && useAdobeEmbed && loadState === 'ready' && adobeState !== 'error';
  const showAdobeSpinner =
    useAdobeEmbed && loadState === 'ready' && adobeState !== 'ready' && adobeState !== 'error';

  const iframeAccessibleTitle = /^PDF\s+viewer\s+for\s+/i.test(title.trim())
    ? title.trim()
    : `PDF viewer for ${title}`;

  return (
    <div
      ref={rootRef}
      role="region"
      aria-label={iframeAccessibleTitle}
      className={`flex flex-col min-h-0 overflow-hidden transition-shadow hover:shadow-2xl w-full ${
        shouldFillContainer ? 'flex-1 min-h-0 h-full' : 'h-full'
      }`}
      style={{
        borderRadius: '12px',
        border: '2px solid rgba(99,102,241,0.15)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 12px 24px -8px rgba(0, 0, 0, 0.15)',
        backgroundColor: '#0d1526',
        ...(useAdobeEmbed && useSizedContainer ? { minHeight: viewerMinHeight } : {}),
      }}
    >
      <div
        role="toolbar"
        aria-label="PDF document actions"
        className="flex shrink-0 items-center justify-between px-4 py-2.5"
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
            <span className="text-[10px] font-normal normal-case" style={{ color: '#e2e8f0' }}>
              (annotation tools)
            </span>
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

      <div
        className="relative flex-1 w-full min-h-0"
        style={{
          backgroundColor: '#525659',
          ...(shouldFillContainer
            ? {
                flex: '1 1 0%',
                minHeight: 0,
              }
            : useAdobeEmbed
              ? {
                  minHeight: viewerMinHeight,
                  height: viewerMinHeight,
                  flex: '1 1 auto',
                }
              : { minHeight: viewerMinHeight }),
        }}
      >
        {loadState === 'idle' && (
          <div
            className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 px-4 text-center"
            style={{ background: 'linear-gradient(180deg, #0d1526 0%, #111d35 100%)' }}
          >
            <div className="w-7 h-7 border-2 border-indigo-500/20 border-t-indigo-400/80 rounded-full animate-spin" />
            <p className="text-xs font-medium" style={{ color: '#64748b' }}>
              Scroll to load PDF viewer…
            </p>
          </div>
        )}

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
                className={`w-full min-h-0 bg-[#525659] ${
                  shouldFillContainer ? 'absolute inset-0 h-full' : ''
                }`}
                style={
                  shouldFillContainer
                    ? { boxSizing: 'border-box' }
                    : {
                        width: '100%',
                        height: viewerMinHeight,
                        minHeight: viewerMinHeight,
                        boxSizing: 'border-box',
                      }
                }
              />
            )}

            {showIframeFallback && (
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                title={iframeAccessibleTitle}
                className={`max-w-full border-0 ${
                  shouldFillContainer ? 'absolute inset-0 h-full w-full' : 'w-full'
                }`}
                style={
                  shouldFillContainer
                    ? { minHeight: 0 }
                    : { minHeight: viewerMinHeight, height: '100%', width: '100%' }
                }
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
