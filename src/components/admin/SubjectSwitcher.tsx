'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Monitor, Calculator, Globe, Atom, FlaskConical, Microscope, BookOpen, Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubjectLink {
  name: string;
  href: string;
  icon: typeof Monitor;
  gradient: string;
  section: string;
  /** If set, only show this link when admin manages a subject starting with this prefix */
  subjectPrefix?: string;
}

const ALL_LINKS: SubjectLink[] = [
  { name: 'Super Admin', href: '/admin/super', icon: Globe, gradient: 'from-violet-500 to-purple-600', section: 'Global' },
  { name: 'Main Dashboard', href: '/admin', icon: Calculator, gradient: 'from-blue-500 to-indigo-600', section: 'Dashboards' },
  { name: 'CS Admin', href: '/admin/cs', icon: Monitor, gradient: 'from-emerald-500 to-teal-600', section: 'Subject Portals', subjectPrefix: 'computer-science' },
];

interface Props {
  /** If true, show all links (super admin). If false, filter by managedSubjects. */
  isSuperAdmin?: boolean;
  /** Subject slugs the admin manages, e.g. ["computer-science-0478", "physics-5054"] */
  managedSubjects?: string[];
}

export default function SubjectSwitcher({ isSuperAdmin = true, managedSubjects = [] }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter links based on permissions
  const visibleLinks = isSuperAdmin
    ? ALL_LINKS
    : ALL_LINKS.filter(link => {
        // Always show non-subject links (Dashboard)
        if (!link.subjectPrefix) {
          // Hide "Super Admin" for non-super admins
          return link.section !== 'Global';
        }
        // Show subject portal only if admin manages that subject
        return managedSubjects.some(s => s.startsWith(link.subjectPrefix!));
      });

  const sections = [...new Set(visibleLinks.map(l => l.section))];

  // Don't render if only 1 or fewer links (nothing to switch to)
  if (visibleLinks.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium
                   text-[var(--text-muted)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]
                   border border-[var(--border-subtle)] rounded-lg transition-all"
      >
        <Globe className="w-3.5 h-3.5" />
        Switch Panel
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl z-[9999] overflow-hidden
                        bg-[var(--bg-elevated)] border border-[var(--border-color)]">
          {sections.map((section, si) => (
            <div key={section}>
              {si > 0 && <div className="border-t border-[var(--border-subtle)]" />}
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                {section}
              </p>
              {visibleLinks.filter(l => l.section === section).map(link => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    onClick={() => {
                      router.push(link.href);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                               text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all"
                  >
                    <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${link.gradient} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    {link.name}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
