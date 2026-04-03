'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

/**
 * Client-side hook to fetch resource counts for a list of subject slugs.
 * Only fetches for active subjects (the ones with DB content).
 */
export function useSubjectCounts(activeSlugs: string[]): Record<string, number> {
  const key = activeSlugs.length > 0
    ? `/api/subjects/counts?slugs=${activeSlugs.join(',')}`
    : null;

  const { data } = useSWR<{ counts: Record<string, number> }>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  return data?.counts ?? {};
}
