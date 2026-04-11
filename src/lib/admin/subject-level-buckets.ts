/**
 * Maps subject.levels[] (free-text from DB / Subject Factory) to Admin Manager tabs.
 * Avoids fragile substring checks like includes("o level") which miss "O-Level", "Pre-O", etc.
 */

export type AdminSubjectLevelTab = 'olevel' | 'alevel';

function isOLevelish(level: string): boolean {
  const s = level.toLowerCase().trim();
  if (!s) return false;
  if (s.includes('igcse')) return true;
  if (/\bpre[\s.-]*o\b/.test(s)) return true;
  if (/\bo[\s.-]*level\b/.test(s)) return true;
  if (/\bolevel\b/.test(s)) return true;
  if (/\bgcse\b/.test(s)) return true;
  if (s.includes('lower secondary')) return true;
  if (s.includes('key stage 3') || s.includes('key stage 4')) return true;
  return false;
}

function isALevelish(level: string): boolean {
  const s = level.toLowerCase().trim();
  if (!s) return false;
  if (/\bpre[\s.-]*u\b/.test(s)) return true;
  if (/\bas[\s.-]*level\b/.test(s)) return true;
  if (/\ba2\b/.test(s)) return true;
  if (/\ba[\s.-]*level\b/.test(s)) return true;
  if (/\balevel\b/.test(s)) return true;
  return false;
}

/**
 * Whether a subject should appear under the O-Level or A-Level picker tab.
 * If levels are empty or none match known patterns, the subject appears in BOTH tabs
 * so admins are never blocked from assignment by bad or legacy labels.
 */
export function subjectMatchesAdminLevelTab(
  levels: string[] | null | undefined,
  tab: AdminSubjectLevelTab,
): boolean {
  const list = (levels ?? []).map((l) => String(l).trim()).filter(Boolean);
  if (list.length === 0) return true;

  let hasO = false;
  let hasA = false;
  for (const l of list) {
    if (isOLevelish(l)) hasO = true;
    if (isALevelish(l)) hasA = true;
  }

  if (!hasO && !hasA) return true;

  if (tab === 'olevel') return hasO;
  return hasA;
}
