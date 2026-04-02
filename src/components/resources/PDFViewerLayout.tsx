'use client';

import { useState, useRef } from 'react';
import { ExternalLink, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import VideoSolutionsSidebar from './VideoSolutionsSidebar';
import FramedPDFViewer from './FramedPDFViewer';
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
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTimestampClick = (seconds: number) => {
    setVideoStartTime(seconds);
    const solution = solutions.find(
      (s) => (s.timestamp_seconds ?? s.timestampSeconds) === seconds,
    );
    if (solution) {
      setActiveQuestion(solution.question_number ?? solution.questionNumber);
    }
  };

  const hasSolutions = videoId && solutions.length > 0;

  return (
    <div className="space-y-4">
      {/* Zoom / Utility Toolbar */}
      <div className="bg-[var(--hero-from)] rounded-xl p-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white truncate mr-4">{title}</h2>
        <div className="flex items-center gap-1">
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
            onClick={() => containerRef.current?.requestFullscreen()}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content: PDF + Video Sidebar */}
      <div className={`flex flex-col ${hasSolutions ? 'lg:flex-row' : ''} gap-4`}>
        {/* PDF Viewer — FramedPDFViewer with mandatory header */}
        <div ref={containerRef} className={`${hasSolutions ? 'lg:w-[60%]' : 'w-full'}`}>
          <FramedPDFViewer
            embedUrl={`${pdfUrl}#toolbar=0&navpanes=0`}
            downloadUrl={downloadUrl || pdfUrl}
            title={title}
            label="Resource Document"
            minHeight="75vh"
          />
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
