'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { PlayCircle, FileText, ChevronRight } from 'lucide-react';
import { toEmbedUrl } from '@/lib/url-transform';

export interface LearningModule {
  id: string;
  title: string;
  videoUrl: string;
  worksheetUrl?: string | null;
}

interface UnifiedModuleGridProps {
  modules: LearningModule[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
}

function SkeletonModule() {
  return (
    <div className="bg-white border border-navy-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-navy-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-navy-100 rounded-full w-2/3" />
        <div className="h-3 bg-navy-50 rounded-full w-1/3" />
      </div>
    </div>
  );
}

export default function UnifiedModuleGrid({
  modules,
  isLoading = false,
  emptyTitle = 'No learning modules yet',
  emptyMessage = 'Upload your first video via the admin dashboard.',
}: UnifiedModuleGridProps) {

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonModule key={i} />)}
      </div>
    );
  }

  if (!modules.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 bg-navy-50 rounded-2xl flex items-center justify-center mb-4">
          <PlayCircle className="w-8 h-8 text-navy-300" />
        </div>
        <h3 className="text-base font-semibold text-navy-700 mb-1">{emptyTitle}</h3>
        <p className="text-sm text-navy-400 max-w-xs">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {modules.map((mod, index) => {
        const { embedUrl } = toEmbedUrl(mod.videoUrl);
        
        return (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
            className="bg-white border border-navy-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
          >
            {/* Video Player */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedUrl}
                title={mod.title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>

            {/* Info Bar */}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-navy-900 truncate group-hover:text-gold-600 transition-colors">
                  {mod.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    ▶ Video
                  </span>
                  {mod.worksheetUrl && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      📄 Worksheet
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {mod.worksheetUrl && (
                  <Link
                    href={`/view/${mod.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> Worksheet
                  </Link>
                )}
                <Link
                  href={`/view/${mod.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-navy-600 bg-navy-50 border border-navy-200 rounded-lg hover:bg-navy-100 transition-colors"
                >
                  Full View <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
