/**
 * Digital Skills quiz: MCQ count scales with video length (~1 question per 2 minutes), max 100.
 */

export type TranscriptSegmentLike = { offset: number; duration: number };

/** Parse admin "duration" field: "12:30", "1:05:20", "15 min", "10 mins". */
export function parseLessonDurationToMinutes(raw: string | null | undefined): number | null {
  if (!raw?.trim()) return null;
  const t = raw.trim().toLowerCase();

  const minWord = t.match(/^(\d+(?:\.\d+)?)\s*(?:min|mins|minutes?)$/);
  if (minWord) return Math.max(0, parseFloat(minWord[1]));

  const compact = t.replace(/\s/g, '');
  const parts = compact.split(':').map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  return null;
}

/** Approximate video length from YouTube transcript segment timings (seconds → minutes). */
export function minutesFromTranscriptSegments(segments: TranscriptSegmentLike[]): number {
  if (!segments.length) return 10;
  let end = 0;
  for (const s of segments) {
    const e = (s.offset ?? 0) + (s.duration ?? 0);
    if (e > end) end = e;
  }
  return Math.max(end / 60, 0.25);
}

/**
 * Target MCQ count: proportional to length (10 min → 5), at least 1, at most 100.
 */
export function mcqCountFromVideoMinutes(minutes: number): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 5;
  const n = Math.round(minutes / 2);
  return Math.min(100, Math.max(1, n));
}
