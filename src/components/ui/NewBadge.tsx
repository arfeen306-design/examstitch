'use client';

/**
 * NewBadge — shows an orange "NEW" tag on resource cards.
 * 
 * Logic:
 * - Show if: resource was created within 7 days AND id not in localStorage viewed set
 * - On mount: checks localStorage immediately (no SSR flash)
 * - markViewed(id): adds to set, hides badge instantly, persists on refresh
 * 
 * Usage:
 *   <NewBadge resourceId={id} createdAt={created_at} onView={() => markViewed(id)} />
 */

import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'examstitch-viewed';
const NEW_WINDOW_DAYS = 7;

function getViewedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function addViewedId(id: string) {
  const set = getViewedIds();
  set.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

interface NewBadgeProps {
  resourceId: string;
  createdAt: string;
  /** Called so parent can also react (optional) */
  onView?: () => void;
}

export function useIsNew(resourceId: string, createdAt: string) {
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays > NEW_WINDOW_DAYS) return;
    const viewed = getViewedIds();
    if (!viewed.has(resourceId)) {
      setIsNew(true);
    }
  }, [resourceId, createdAt]);

  const markViewed = useCallback(() => {
    addViewedId(resourceId);
    setIsNew(false);
  }, [resourceId]);

  return { isNew, markViewed };
}

export default function NewBadge({ resourceId, createdAt, onView }: NewBadgeProps) {
  const { isNew, markViewed } = useIsNew(resourceId, createdAt);

  if (!isNew) return null;

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        markViewed();
        onView?.();
      }}
      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold
                 uppercase tracking-wider cursor-default select-none
                 animate-pulse"
      style={{
        backgroundColor: '#FF6B35',
        color: '#ffffff',
        letterSpacing: '0.08em',
      }}
      title="New resource — click to dismiss"
    >
      NEW
    </span>
  );
}
