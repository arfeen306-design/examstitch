'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FileText, PlayCircle, BookOpen, Printer, Download, ExternalLink } from 'lucide-react';

interface ResourceCardProps {
  title: string;
  description?: string;
  contentType: 'video' | 'pdf' | 'worksheet';
  href: string;
  year?: number;
  session?: string;
  variant?: number;
  subject?: string;
  index?: number;
}

const typeConfig = {
  video: { icon: PlayCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Video' },
  pdf: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Past Paper' },
  worksheet: { icon: BookOpen, color: 'text-green-500', bg: 'bg-green-50', label: 'Worksheet' },
};

export default function ResourceCard({
  title,
  description,
  contentType,
  href,
  year,
  session,
  variant,
  subject,
  index = 0,
}: ResourceCardProps) {
  const config = typeConfig[contentType];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={href} className="block group">
        <div className="card-hover bg-white border border-navy-100 rounded-2xl p-5 hover:border-gold-500/30">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-11 h-11 ${config.bg} rounded-xl flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium ${config.color} ${config.bg} px-2 py-0.5 rounded-full`}>
                  {config.label}
                </span>
                {year && (
                  <span className="text-xs text-navy-400">
                    {session} {year}{variant ? ` V${variant}` : ''}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-navy-900 group-hover:text-gold-600 transition-colors truncate">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-navy-500 mt-1 line-clamp-2">{description}</p>
              )}
              {subject && (
                <span className="inline-block mt-2 text-xs text-navy-400 bg-navy-50 px-2 py-0.5 rounded-full">
                  {subject}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons for PDF type */}
          {contentType === 'pdf' && (
            <div className="mt-4 pt-3 border-t border-navy-50 flex gap-2">
              <span className="flex items-center gap-1 text-xs text-navy-400 hover:text-navy-600 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> View
              </span>
              <span className="flex items-center gap-1 text-xs text-navy-400 hover:text-navy-600 transition-colors">
                <Printer className="w-3.5 h-3.5" /> Print
              </span>
              <span className="flex items-center gap-1 text-xs text-navy-400 hover:text-navy-600 transition-colors">
                <Download className="w-3.5 h-3.5" /> Download
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
