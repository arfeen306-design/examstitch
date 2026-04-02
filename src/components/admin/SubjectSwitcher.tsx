'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Monitor, Calculator, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubjectLink {
  name: string;
  slug: string;
  href: string;
  icon: typeof Monitor;
  color: string;
}

const SUBJECT_LINKS: SubjectLink[] = [
  { name: 'Maths Admin', slug: 'maths', href: '/admin', icon: Calculator, color: 'text-orange-500' },
  { name: 'CS Admin', slug: 'computer-science', href: '/admin/cs', icon: Monitor, color: 'text-indigo-500' },
  { name: 'Super Admin', slug: 'super', href: '/admin/super', icon: Globe, color: 'text-violet-500' },
];

export default function SubjectSwitcher() {
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-navy-700 bg-navy-50 hover:bg-navy-100 rounded-lg transition-colors"
      >
        <Globe className="w-4 h-4 text-navy-400" />
        Switch Subject
        <ChevronDown className={`w-3.5 h-3.5 text-navy-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
          {SUBJECT_LINKS.map(link => {
            const Icon = link.icon;
            return (
              <button
                key={link.slug}
                onClick={() => {
                  router.push(link.href);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon className={`w-4 h-4 ${link.color}`} />
                {link.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
