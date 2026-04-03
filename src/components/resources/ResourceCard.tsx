'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FileText, PlayCircle, BookOpen, ArrowRight, Lock } from 'lucide-react';

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
  video:     { icon: PlayCircle, gradient: 'from-red-500 to-rose-600',    badge: 'bg-red-500/20 text-red-300 border-red-400/30',     label: 'Video' },
  pdf:       { icon: FileText,   gradient: 'from-blue-500 to-indigo-600', badge: 'bg-blue-500/20 text-blue-300 border-blue-400/30',   label: 'Past Paper' },
  worksheet: { icon: BookOpen,   gradient: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30', label: 'Worksheet' },
};

export default function ResourceCard({
  title,
  description,
  contentType,
  href,
  year,
  session,
  variant: variantNum,
  subject,
  index = 0,
  isLocked: isLockedProp = false,
}: ResourceCardProps) {
  const isLocked = isLockedProp && !(typeof document !== 'undefined' && document.cookie.includes('admin_mode=1'));
  const config = typeConfig[contentType];
  const Icon = config.icon;
  const cardHref = isLocked ? `/auth/login?redirectTo=${encodeURIComponent(href)}` : href;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link href={cardHref} className="block group">
        <div className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300
                        bg-white/[0.06] backdrop-blur-xl border border-white/[0.1]
                        hover:border-white/[0.2] hover:bg-white/[0.1] hover:shadow-lg
                        ${isLocked ? 'opacity-80' : ''}`}>
          {/* Gradient accent line */}
          <div className={`absolute top-0 left-5 right-5 h-[2px] bg-gradient-to-r ${config.gradient} rounded-full opacity-50`} />

          {/* Lock badge */}
          {isLocked && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1
                             text-[10px] font-bold px-2 py-0.5 rounded-full z-10
                             bg-orange-500/20 text-orange-300 border border-orange-400/30">
              <Lock className="w-2.5 h-2.5" /> Members Only
            </span>
          )}

          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient}
                            flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
              {isLocked
                ? <Lock className="w-5 h-5 text-white/70" />
                : <Icon className="w-5 h-5 text-white" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.badge}`}>
                  {isLocked ? 'Restricted' : config.label}
                </span>
                {year && (
                  <span className="text-[11px] text-white/40">
                    {session} {year}{variantNum ? ` V${variantNum}` : ''}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors truncate">
                {title}
              </h3>
              {description && !isLocked && (
                <p className="text-xs mt-1 text-white/40 line-clamp-2">{description}</p>
              )}
              {isLocked && (
                <p className="text-xs mt-1 text-white/30">Sign in to access this resource</p>
              )}
              {subject && (
                <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 border border-white/[0.08]">
                  {subject}
                </span>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
