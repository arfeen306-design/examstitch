'use client';

import { Download, Printer, FileText, PlayCircle } from 'lucide-react';
import { useRef, useCallback } from 'react';

interface MediaFrameProps {
  id: string;
  mediaType: 'youtube' | 'pdf';
  title: string;
  url: string;
  permissions: { allow_print: boolean; allow_download: boolean };
}

export default function MediaFrame({ mediaType, title, url, permissions }: MediaFrameProps) {
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  const handleDownload = useCallback(async () => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, '_blank');
    }
  }, [url, title]);

  const handlePrint = useCallback(() => {
    if (printFrameRef.current?.contentWindow) {
      printFrameRef.current.contentWindow.print();
    }
  }, []);

  if (mediaType === 'youtube') {
    const videoId = url.includes('youtube.com') || url.includes('youtu.be')
      ? url.replace(/.*(?:youtu\.be\/|v=|embed\/)([^&#?]+).*/, '$1')
      : url;

    return (
      <div className="group rounded-2xl overflow-hidden shadow-sm border transition-shadow hover:shadow-md"
           style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <div className="px-4 py-3 flex items-center gap-2">
          <PlayCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
        </div>
      </div>
    );
  }

  // PDF viewer
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border transition-shadow hover:shadow-md"
         style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b"
           style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {permissions.allow_download && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          )}
          {permissions.allow_print && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          )}
        </div>
      </div>

      {/* PDF embed */}
      <div className="relative w-full" style={{ height: '500px' }}>
        <iframe
          ref={printFrameRef}
          className="w-full h-full"
          src={`${url}#toolbar=0&navpanes=0`}
          title={title}
          loading="lazy"
        />
      </div>
    </div>
  );
}
