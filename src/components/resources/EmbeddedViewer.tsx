'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { toEmbedUrl, toDownloadUrl } from '@/lib/url-transform';

interface EmbeddedViewerProps {
  title: string;
  sourceUrl: string;
  contentType: 'video' | 'pdf' | 'worksheet';
  backHref: string;
  backLabel: string;
}

export default function EmbeddedViewer({
  title,
  sourceUrl,
  contentType,
  backHref,
  backLabel,
}: EmbeddedViewerProps) {
  const { embedUrl, type } = toEmbedUrl(sourceUrl);
  const downloadUrl = toDownloadUrl(sourceUrl);
  const isVideo = contentType === 'video' || type === 'youtube';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-navy-500 hover:text-navy-800 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {backLabel}
        </Link>

        <div className="flex items-center gap-2">
          {downloadUrl && (contentType === 'worksheet' || contentType === 'pdf') && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-navy-900 rounded-lg hover:bg-navy-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </a>
          )}
        </div>
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
        {title}
      </h1>

      {/* Embedded Content */}
      {isVideo ? (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-navy-100 bg-black" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            title={title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-navy-100 bg-white">
          <iframe
            src={embedUrl}
            title={title}
            className="w-full border-0"
            style={{ minHeight: 'max(800px, 85vh)' }}
            allow="autoplay"
            loading="lazy"
          />
          {/* Overlay to cover Google Drive's external link icon on the right */}
          <div className="absolute top-0 right-0 w-12 h-16 bg-white pointer-events-auto z-10 rounded-bl-lg" />
        </div>
      )}

      {/* Content type badge */}
      <div className="flex items-center gap-2 pt-2">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          isVideo ? 'bg-red-50 text-red-600' :
          contentType === 'worksheet' ? 'bg-green-50 text-green-600' :
          'bg-blue-50 text-blue-600'
        }`}>
          {isVideo ? '▶ Video' : contentType === 'worksheet' ? '📄 Worksheet' : '📋 Past Paper'}
        </span>
      </div>
    </motion.div>
  );
}

