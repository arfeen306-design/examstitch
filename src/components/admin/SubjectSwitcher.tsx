'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Globe, Database, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ADMIN_PORTALS, getPortalsForSubjects } from '@/config/admin-portals';

interface Props {
  /** If true, show all links (super admin). If false, filter by managedSubjects. */
  isSuperAdmin?: boolean;
  /** Subject slugs the admin manages, e.g. ["computer-science-0478", "physics-5054"] */
  managedSubjects?: string[];
}

interface LinkItem {
  label: string;
  href: string;
  gradient: string;
  section: string;
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

  const visibleLinks = useMemo(() => {
    const links: LinkItem[] = [];

    // Super Admin panel link (only for super admins)
    if (isSuperAdmin) {
      links.push({
        label: 'Super Admin',
        href: '/admin/super',
        gradient: 'from-violet-500 to-purple-600',
        section: 'Global',
      });
    }

    // Main dashboard
    links.push({
      label: 'Main Dashboard',
      href: '/admin',
      gradient: 'from-blue-500 to-indigo-600',
      section: 'Dashboards',
    });

    // Subject portals — dynamically from ADMIN_PORTALS
    const portals = isSuperAdmin
      ? ADMIN_PORTALS
      : getPortalsForSubjects(managedSubjects);

    for (const portal of portals) {
      links.push({
        label: portal.label,
        href: `/admin/${portal.routeSegment}`,
        gradient: portal.gradient,
        section: 'Subject Portals',
      });
    }

    return links;
  }, [isSuperAdmin, managedSubjects]);

  const sections = useMemo(
    () => [...new Set(visibleLinks.map(l => l.section))],
    [visibleLinks]
  );

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
              {visibleLinks.filter(l => l.section === section).map(link => (
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
                    {link.section === 'Global' ? (
                      <Shield className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Database className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  {link.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
