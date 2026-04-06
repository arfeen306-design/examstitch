'use client';

/**
 * HierarchyPicker — Universal subject-aware dropdown cascade.
 *
 * Accepts a subjectId (DB UUID) and subjectSlug (e.g. 'computer-science-0478'),
 * then renders the correct hierarchy:
 *   - O-Level subjects → Grade 9 / 10 / 11
 *   - A-Level subjects → AS / A2 → Paper cascade
 *   - Subjects with both → Level toggle (O-Level / A-Level) first
 *
 * Outputs:
 *   - categoryId: the selected DB category UUID
 *   - moduleType: 'video_topical' | 'solved_past_paper'
 *   - metadata: { taxonomy, grade?, section?, paper? } for audit trails
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  SUBJECT_TAXONOMY,
  OLEVEL_GRADES,
  ALEVEL_SECTIONS,
  MODULE_TYPES,
  getTaxonomyBySlug,
  type SubjectTaxonomy,
  type ModuleType,
  type ALevelSection,
  type OLevelGrade,
} from '@/config/taxonomy';

// ── Types ───────────────────────────────────────────────────────────────────

type TaxLevel = 'olevel' | 'alevel';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

export interface HierarchySelection {
  categoryId: string;
  moduleType: ModuleType;
  level: TaxLevel;
  grade: OLevelGrade | null;
  section: ALevelSection | null;
  paper: string | null;
}

interface Props {
  /** DB UUID of the subject (used to fetch categories) */
  subjectId: string;
  /** Subject slug, e.g. 'computer-science-0478' or 'physics-5054' */
  subjectSlug: string;
  /** Called on every valid selection change */
  onChange: (selection: HierarchySelection) => void;
  /** Optional override for accent color (uses taxonomy default if omitted) */
  accentColor?: string;
  /** If set, only these subject slugs are selectable (locks out unauthorized subjects) */
  allowedSubjectSlugs?: string[];
}

// ── Component ───────────────────────────────────────────────────────────────

export default function HierarchyPicker({ subjectId, subjectSlug, onChange, accentColor, allowedSubjectSlugs }: Props) {
  // Resolve taxonomy from slug
  const taxonomy = useMemo(() => getTaxonomyBySlug(subjectSlug), [subjectSlug]);

  const hasOLevel = !!taxonomy;
  const hasALevel = !!taxonomy?.aLevelCode;
  const defaultLevel: TaxLevel = hasOLevel ? 'olevel' : 'alevel';

  // State
  const [level, setLevel] = useState<TaxLevel>(defaultLevel);
  const [grade, setGrade] = useState<OLevelGrade>('grade-9');
  const [section, setSection] = useState<ALevelSection>('as');
  const [paper, setPaper] = useState<string>('');
  const [moduleType, setModuleType] = useState<ModuleType>('video_topical');
  const [categoryId, setCategoryId] = useState('');

  // Categories from DB
  const [allCategories, setAllCategories] = useState<CategoryRow[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const accent = accentColor ?? taxonomy?.accentColor ?? '#6366F1';

  // Load categories on mount
  useEffect(() => {
    setCategoriesLoading(true);
    const supabase = createClient();
    supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .eq('subject_id', subjectId)
      .order('sort_order')
      .then(({ data }) => {
        setAllCategories(data ?? []);
        setCategoriesLoading(false);
      });
  }, [subjectId]);

  // Init paper when section or taxonomy changes
  useEffect(() => {
    if (!taxonomy?.aLevelPapers) return;
    const papers = taxonomy.aLevelPapers[section];
    if (papers?.length) setPaper(papers[0].value);
  }, [section, taxonomy]);

  // Category slug hint for filtering
  const slugHint = useMemo(() => {
    if (level === 'olevel') return grade;
    return paper || '';
  }, [level, grade, paper]);

  // Filter categories by slug/name match
  const filteredCategories = useMemo(() => {
    if (!slugHint || allCategories.length === 0) return allCategories;

    // Slug-based match (most reliable)
    const slugMatched = allCategories.filter(c => c.slug.includes(slugHint));
    if (slugMatched.length > 0) return slugMatched;

    // Name-based fallback
    const nameHints: Record<string, string[]> = {
      'grade-9': ['grade 9', 'g9', 'year 9'],
      'grade-10': ['grade 10', 'g10', 'year 10'],
      'grade-11': ['grade 11', 'g11', 'year 11'],
      'paper-1': ['paper 1', 'p1'],
      'paper-2': ['paper 2', 'p2'],
      'paper-3': ['paper 3', 'p3'],
      'paper-4': ['paper 4', 'p4'],
      'paper-5': ['paper 5', 'p5'],
    };
    const hints = nameHints[slugHint] || [];
    const nameMatched = allCategories.filter(c =>
      hints.some(h => c.name.toLowerCase().includes(h))
    );
    if (nameMatched.length > 0) return nameMatched;

    // Show all as fallback
    return allCategories;
  }, [allCategories, slugHint]);

  // Reset category when hierarchy changes
  useEffect(() => {
    setCategoryId('');
  }, [level, grade, section, paper]);

  // Auto-select first matching category
  useEffect(() => {
    if (filteredCategories.length > 0 && !categoryId) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, categoryId]);

  // Emit selection to parent
  useEffect(() => {
    if (!categoryId) return;
    onChange({
      categoryId,
      moduleType,
      level,
      grade: level === 'olevel' ? grade : null,
      section: level === 'alevel' ? section : null,
      paper: level === 'alevel' ? paper : null,
    });
  }, [categoryId, moduleType, level, grade, section, paper, onChange]);

  // Style helpers
  const selectClass = "w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-sm focus:ring-2 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1";

  // Lockdown: if allowedSubjectSlugs is set, verify this subject is permitted
  const isLocked = useMemo(() => {
    if (!allowedSubjectSlugs || allowedSubjectSlugs.length === 0) return false;
    return !allowedSubjectSlugs.some(s => s === subjectSlug || subjectSlug.startsWith(s));
  }, [allowedSubjectSlugs, subjectSlug]);

  if (isLocked) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
        <p className="text-sm text-red-400 font-medium">
          You do not have permission to manage resources for this subject.
        </p>
      </div>
    );
  }

  if (!taxonomy) {
    return (
      <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center">
        <p className="text-sm text-[var(--text-muted)]">
          No taxonomy found for subject <code className="text-xs">{subjectSlug}</code>.
        </p>
      </div>
    );
  }

  const papers = taxonomy.aLevelPapers?.[section] ?? [];

  return (
    <div className="space-y-4">
      {/* Row 1: Level toggle + Module Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Level *</label>
          {hasALevel ? (
            <select
              value={level}
              onChange={e => setLevel(e.target.value as TaxLevel)}
              className={selectClass}
              style={{ '--tw-ring-color': accent } as React.CSSProperties}
            >
              <option value="olevel">O Level — {taxonomy.name} ({taxonomy.oLevelCode})</option>
              <option value="alevel">A Level — {taxonomy.name} ({taxonomy.aLevelCode})</option>
            </select>
          ) : (
            <div className="px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm">
              O Level — {taxonomy.name} ({taxonomy.oLevelCode})
            </div>
          )}
        </div>
        <div>
          <label className={labelClass}>Module Type *</label>
          <select
            value={moduleType}
            onChange={e => setModuleType(e.target.value as ModuleType)}
            className={selectClass}
            style={{ '--tw-ring-color': accent } as React.CSSProperties}
          >
            {MODULE_TYPES.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Conditional Grade / Section+Paper */}
      {level === 'olevel' ? (
        <div>
          <label className={labelClass}>Grade *</label>
          <select
            value={grade}
            onChange={e => setGrade(e.target.value as OLevelGrade)}
            className={selectClass}
            style={{ '--tw-ring-color': accent } as React.CSSProperties}
          >
            {OLEVEL_GRADES.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
      ) : hasALevel && taxonomy.aLevelPapers ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Section *</label>
            <select
              value={section}
              onChange={e => setSection(e.target.value as ALevelSection)}
              className={selectClass}
              style={{ '--tw-ring-color': accent } as React.CSSProperties}
            >
              {ALEVEL_SECTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Paper *</label>
            <select
              value={paper}
              onChange={e => setPaper(e.target.value)}
              className={selectClass}
              style={{ '--tw-ring-color': accent } as React.CSSProperties}
            >
              {papers.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {/* Row 3: Category (filtered by level/paper selection) */}
      <div>
        <label className={labelClass}>
          Category *
          {categoriesLoading && <span className="text-xs text-[var(--text-muted)] ml-2">Loading…</span>}
        </label>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className={selectClass}
          disabled={categoriesLoading}
          style={{ '--tw-ring-color': accent } as React.CSSProperties}
        >
          <option value="" disabled>Select category…</option>
          {filteredCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {!categoriesLoading && filteredCategories.length === 0 && (
          <p className="text-xs text-amber-500 mt-1">
            No categories found for this level/paper. Create one in the Super Admin panel first.
          </p>
        )}
      </div>
    </div>
  );
}
