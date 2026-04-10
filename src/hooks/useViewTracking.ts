'use client';

import { useEffect } from 'react';

/**
 * Records a single view per resource per browser session.
 * Fire-and-forget — never blocks rendering or shows errors.
 */
export function useViewTracking(resourceId: string | undefined) {
  useEffect(() => {
    if (!resourceId) return;

    const key = `viewed_${resourceId}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, '1');

    fetch('/api/resources/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_id: resourceId }),
    }).catch(() => {
      // Silent — never surface errors to students
    });
  }, [resourceId]);
}
