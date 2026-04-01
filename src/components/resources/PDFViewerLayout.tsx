'use client';

import { useState, useRef } from 'react';
import { Printer, Download, ExternalLink, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import VideoSolutionsSidebar from './VideoSolutionsSidebar';
import type { SolutionRow } from './VideoSolutionsSidebar';

interface PDFViewerLayoutProps {
  pdfUrl: string;
  title: string;
  videoId?: string;
  videoTitle?: string;
  solutions?: SolutionRow[];
  downloadUrl?: string;
}

export default function PDFViewerLayout({
  pdfUrl,
  title,
  videoId,
  videoTitle,
  solutions = [],
  downloadUrl,
}: PDFViewerLayoutProps) {
  const [activeQuestion, setActiveQuestion] = useState<number | undefined>();
  const [videoStartTime, setVideoStartTime] = useState(0);
  const [zoom, setZoom] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleTimestampClick = (seconds: number) => {
    setVideoStartTime(seconds);
    // Support both snake_case (DB) and camelCase (demo) naming
    const solution = solutions.find(
      (s) => (s.timestamp_seconds ?? s.timestampSeconds) === seconds,
    );
    if (solution) {
      setActiveQuestion(solution.question_number ?? solution.questionNumber);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  };

  const hasSolutions = videoId && solutions.length > 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-[var(--hero-from)] rounded-xl p-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white truncate mr-4">{title}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-white/50 w-12 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <button
            onClick={handlePrint}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Open in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => iframeRef.current?.requestFullscreen()}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content: PDF + Video Sidebar */}
      <div className={`flex flex-col ${hasSolutions ? 'lg:flex-row' : ''} gap-4`}>
        {/* PDF Viewer */}
        <div className={`${hasSolutions ? 'lg:w-[60%]' : 'w-full'}`}>
          <div
            className="bg-gray-100 rounded-xl overflow-hidden border border-[var(--border-subtle)]"
            style={{ height: '75vh' }}
          >
            <iframe
              ref={iframeRef}
              src={`${pdfUrl}#zoom=${zoom}`}
              title={title}
              className="w-full h-full"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
            />
          </div>
        </div>

        {/* Video Solutions Sidebar */}
        {hasSolutions && (
          <div className="lg:w-[40%] space-y-4">
            <VideoPlayer
              videoId={videoId}
              title={videoTitle || 'Video Solution'}
              startTime={videoStartTime}
            />
            <VideoSolutionsSidebar
              solutions={solutions}
              videoId={videoId}
              videoTitle={videoTitle || 'Video Solution'}
              onTimestampClick={handleTimestampClick}
              activeQuestion={activeQuestion}
            />
          </div>
        )}
      </div>
    </div>
  );
}
