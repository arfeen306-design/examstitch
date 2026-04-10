'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Mail } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { FEATURES } from '@/config/features';
import NotifyMeBox from '@/components/lead-gen/NotifyMeBox';
import { getFooterContextFromPathname } from '@/config/navigation';

export default function Footer() {
  const pathname = usePathname() ?? '/';
  const ctx = getFooterContextFromPathname(pathname);

  return (
    <footer style={{ backgroundColor: 'var(--hero-via)' }} className="text-white/70 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-navy-900" />
              </div>
              <span className="text-lg font-bold text-white">
                Exam<span className="text-gold-500">Stitch</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed">{ctx.brandTagline}</p>
          </div>

          {/* O-Level / IGCSE */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">O-Level / IGCSE</h4>
            <ul className="space-y-2 text-sm">
              {ctx.mode === 'general'
                ? ctx.oLevelLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:text-gold-500 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))
                : ctx.oLevelGradeLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:text-gold-500 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
            </ul>
          </div>

          {/* A-Level — heading includes syllabus code on subject pages */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {ctx.mode === 'subject' && ctx.alevelSlug
                ? `A-Level (${ctx.aLevelHeadingCode})`
                : ctx.mode === 'subject'
                  ? 'A-Level'
                  : 'A-Level'}
            </h4>
            <ul className="space-y-2 text-sm">
              {ctx.mode === 'general' &&
                ctx.aLevelLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-gold-500 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              {ctx.mode === 'subject' && ctx.aLevelPaperLinks.length > 0 &&
                ctx.aLevelPaperLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-gold-500 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              {ctx.mode === 'subject' && ctx.aLevelPaperLinks.length === 0 && (
                <li>
                  <Link href="/alevel" className="hover:text-gold-500 transition-colors">
                    Browse all A-Level subjects
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Notify Me */}
          <div>
            {FEATURES.NOTIFY_ME_ENABLED ? (
              <NotifyMeBox variant="footer" />
            ) : (
              <div>
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Connect</h4>
                <div className="flex gap-3">
                  <a
                    href={siteConfig.links.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.56 9.38.56 9.38.56s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.7 31.7 0 0 0 24 12a31.7 31.7 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                    </svg>
                  </a>
                  <a
                    href={`mailto:${siteConfig.links.email}`}
                    className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} ExamStitch. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-white/40">
            <Link href="/about" className="hover:text-white/60 transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-white/60 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
