'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FileText, PlayCircle, BookOpen, ChevronRight, Lock } from 'lucide-react';

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
  isLocked?: boolean;
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
  isLocked = false,
}: ResourceCardProps) {
  const config = typeConfig[contentType];
  const Icon = config.icon;
  // Locked cards link to login instead of the resource
  const cardHref = isLocked
    ? `/auth/login?redirectTo=${encodeURIComponent(href)}`
    : href;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link href={cardHref} className="block group">
        <div
          className={`card-hover border rounded-2xl p-5 transition-all duration-200 relative overflow-hidden
            ${isLocked ? 'border-orange-200 hover:border-orange-400' : config.accent + ' hover:shadow-md'}`}
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          {/* Lock badge — top-right corner */}
          {isLocked && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1
                             text-[10px] font-bold px-2 py-0.5 rounded-full z-10"
                  style={{ backgroundColor: '#FF6B35', color: '#fff' }}>
              <Lock className="w-2.5 h-2.5" /> Members Only
            </span>
          )}

          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform
              ${isLocked ? 'bg-orange-50' : config.bg}`}>
              {isLocked
                ? <Lock className="w-5 h-5" style={{ color: '#FF6B35' }} />
                : <Icon className={`w-5 h-5 ${config.color}`} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                  ${isLocked ? 'text-orange-600 bg-orange-50' : config.color + ' ' + config.bg}`}>
                  {isLocked ? 'Restricted' : config.label}
                </span>
                {year && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {session} {year}{variant ? ` V${variant}` : ''}
                  </span>
                )}
              </div>
              <h3
                className="text-sm font-semibold transition-colors truncate"
                style={{ color: isLocked ? 'var(--text-muted)' : 'var(--text-primary)' }}
              >
                <span className="group-hover:hidden">{title}</span>
                <span className="hidden group-hover:inline"
                      style={{ color: isLocked ? '#FF6B35' : 'var(--accent-text)' }}>{title}</span>
              </h3>
              {description && !isLocked && (
                <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{description}</p>
              )}
              {isLocked && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Sign in to access this resource
                </p>
              )}
              {subject && (
                <span
                  className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
                  style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)' }}
                >
                  {subject}
                </span>
              )}
            </div>
            <ChevronRight
              className="w-4 h-4 transition-colors shrink-0 mt-1"
              style={{ color: isLocked ? '#FF6B35' : 'var(--border-color)' }}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
