'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FileText, PlayCircle, BookOpen, ChevronRight } from 'lucide-react';

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
  video: { icon: PlayCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Video', accent: 'border-red-200 hover:border-red-400' },
  pdf: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Past Paper', accent: 'border-blue-200 hover:border-blue-400' },
  worksheet: { icon: BookOpen, color: 'text-green-500', bg: 'bg-green-50', label: 'Worksheet', accent: 'border-green-200 hover:border-green-400' },
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
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link href={href} className="block group">
        <div className={`card-hover bg-white border rounded-2xl p-5 transition-all duration-200 ${config.accent} hover:shadow-md`}>
          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-11 h-11 ${config.bg} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
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
              <h3 className="text-sm font-semibold text-navy-900 group-hover:text-gold-700 transition-colors truncate">
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
            <ChevronRight className="w-4 h-4 text-navy-200 group-hover:text-gold-500 transition-colors shrink-0 mt-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
