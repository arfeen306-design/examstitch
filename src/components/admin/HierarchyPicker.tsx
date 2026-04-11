'use client';

/**
 * HierarchyPicker — Universal subject-aware dropdown cascade.
 *
 * Categories are loaded for `subjectId` (public.subjects.id). Slugs match
 * src/config/navigation.ts exactly. A-Level rows are scoped to the correct
 * section parent (as-level / a2-level) so duplicate slug rows cannot attach
 * to the wrong branch.
 */

import { useState, useEffect, useMemo, useId } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchMergedCategoriesForSubject } from '@/lib/db/subject-provisioner';
import { MODULE_TYPES as MT_CONST } from '@/lib/constants';
import { aLevelPapersBySubject } from '@/config/navigation';
import {
  OLEVEL_GRADES,
  ALEVEL_SECTIONS,
  MODULE_TYPES,
  getTaxonomyBySlug,
  type ModuleType,
  type ALevelSection,
  type OLevelGrade,
} from '@/config/taxonomy';

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
  subjectId: string;
  subjectSlug: string;
  onChange: (selection: HierarchySelection) => void;
  accentColor?: string;
  allowedSubjectSlugs?: string[];
}

export default function HierarchyPicker({ subjectId, subjectSlug, onChange, accentColor, allowedSubjectSlugs }: Props) {
  const uid = useId();
  const policyHintId = `${uid}-hierarchy-policy`;
  const idLevel = `${uid}-level`;
  const idModule = `${uid}-module-type`;
  const idGrade = `${uid}-grade`;
  const idSection = `${uid}-section`;
  const idPaper = `${uid}-paper`;
  const idCategory = `${uid}-category`;
  const idMissingSection = `${uid}-missing-section`;
  const idAmbiguous = `${uid}-ambiguous`;
  const idNoMatch = `${uid}-no-match`;

  const taxonomy = useMemo(() => getTaxonomyBySlug(subjectSlug), [subjectSlug]);

  const hasOLevel = !!taxonomy;
  const hasALevel = !!taxonomy?.aLevelCode;
  const defaultLevel: TaxLevel = hasOLevel ? 'olevel' : 'alevel';

  const [level, setLevel] = useState<TaxLevel>(defaultLevel);
  const [grade, setGrade] = useState<OLevelGrade>('grade-9');
  const [section, setSection] = useState<ALevelSection>('as');
  const [routePaperSlug, setRoutePaperSlug] = useState('');
  const [moduleType, setModuleType] = useState<ModuleType>(MT_CONST.VIDEO_TOPICAL);
  const [categoryId, setCategoryId] = useState('');

  const [allCategories, setAllCategories] = useState<CategoryRow[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const accent = accentColor ?? taxonomy?.accentColor ?? '#6366F1';

  useEffect(() => {
    setCategoriesLoading(true);
    const supabase = createClient();
    fetchMergedCategoriesForSubject(supabase, subjectId).then(({ data, error }) => {
      if (error) {
        setAllCategories([]);
        setCategoriesLoading(false);
        return;
      }
      setAllCategories(
        data.map((c) => ({ id: c.id, name: c.name, slug: c.slug, parent_id: c.parent_id })),
      );
      setCategoriesLoading(false);
    });
  }, [subjectId]);

  const aLevelNavKey = taxonomy?.aLevelSlug ?? null;
  const sectionNavKey = section === 'as' ? 'as-level' : 'a2-level';

  const sectionParentId = useMemo(() => {
    const row = allCategories.find((c) => c.slug === sectionNavKey && c.parent_id === null);
    return row?.id ?? null;
  }, [allCategories, sectionNavKey]);

  const papersNav = useMemo(() => {
    if (!aLevelNavKey) return [];
    return aLevelPapersBySubject[aLevelNavKey]?.[sectionNavKey] ?? [];
  }, [aLevelNavKey, sectionNavKey]);

  useEffect(() => {
    if (papersNav.length === 0) {
      setRoutePaperSlug('');
      return;
    }
    setRoutePaperSlug((prev) => (papersNav.some((p) => p.slug === prev) ? prev : papersNav[0].slug));
  }, [papersNav]);

  const targetCategorySlug = level === 'olevel' ? grade : routePaperSlug;

  const filteredCategories = useMemo(() => {
    if (!targetCategorySlug || allCategories.length === 0) return [];

    let rows = allCategories.filter((c) => c.slug === targetCategorySlug);

    if (level === 'olevel') {
      rows = rows.filter((c) => c.parent_id === null);
      return rows;
    }

    if (level === 'alevel') {
      if (sectionParentId) {
        rows = rows.filter((c) => c.parent_id === sectionParentId);
      }
      return rows;
    }

    return rows;
  }, [allCategories, targetCategorySlug, level, sectionParentId]);

  const ambiguousMatches = filteredCategories.length > 1;

  useEffect(() => {
    if (filteredCategories.length === 0) {
      setCategoryId('');
      return;
    }
    if (filteredCategories.length === 1) {
      setCategoryId(filteredCategories[0].id);
      return;
    }
    setCategoryId((prev) => (filteredCategories.some((c) => c.id === prev) ? prev : ''));
  }, [filteredCategories]);

  useEffect(() => {
    if (!categoryId) return;
    onChange({
      categoryId,
      moduleType,
      level,
      grade: level === 'olevel' ? grade : null,
      section: level === 'alevel' ? section : null,
      paper: level === 'alevel' ? routePaperSlug : null,
    });
  }, [categoryId, moduleType, level, grade, section, routePaperSlug, onChange]);

  const selectClass =
    'w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] text-sm focus:ring-2 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-[var(--text-secondary)] mb-1';

  const isLocked = useMemo(() => {
    if (!allowedSubjectSlugs || allowedSubjectSlugs.length === 0) return false;
    return !allowedSubjectSlugs.some((s) => s === subjectSlug || subjectSlug.startsWith(s));
  }, [allowedSubjectSlugs, subjectSlug]);

  if (isLocked) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center" role="alert">
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

  const missingSectionParent = level === 'alevel' && !sectionParentId && hasALevel;

  const noCategoryMatch =
    !categoriesLoading &&
    !ambiguousMatches &&
    !missingSectionParent &&
    filteredCategories.length === 0 &&
    !!targetCategorySlug;

  const categoryDescribedBy = [
    policyHintId,
    missingSectionParent ? idMissingSection : '',
    ambiguousMatches ? idAmbiguous : '',
    noCategoryMatch ? idNoMatch : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-4">
      <p
        id={policyHintId}
        className="text-xs text-[var(--text-muted)] leading-relaxed rounded-lg border border-[var(--border-subtle)] px-3 py-2 bg-[var(--bg-surface)]"
      >
        <span className="font-medium text-[var(--text-secondary)]">Strict navigation match: </span>
        Each choice maps to public course URLs. O-Level grades must be exactly grade-9, grade-10, or grade-11.
        A-Level uses sections as-level and a2-level, then a paper slug listed in navigation for this subject.
        The final category list resolves the exact database row; if duplicate slugs exist, choose the correct row.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={hasALevel ? idLevel : undefined} className={labelClass}>
            Level *
          </label>
          {hasALevel ? (
            <select
              id={idLevel}
              aria-describedby={policyHintId}
              value={level}
              onChange={(e) => setLevel(e.target.value as TaxLevel)}
              className={selectClass}
              style={{ '--tw-ring-color': accent } as React.CSSProperties}
            >
              <option value="olevel">
                O Level — {taxonomy.name} ({taxonomy.oLevelCode})
              </option>
              <option value="alevel">
                A Level — {taxonomy.name} ({taxonomy.aLevelCode})
              </option>
            </select>
          ) : (
            <div className="px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm">
              O Level — {taxonomy.name} ({taxonomy.oLevelCode})
            </div>
          )}
        </div>
        <div>
          <label htmlFor={idModule} className={labelClass}>
            Module Type *
          </label>
          <select
            id={idModule}
            aria-describedby={policyHintId}
            value={moduleType}
            onChange={(e) => setModuleType(e.target.value as ModuleType)}
            className={selectClass}
            style={{ '--tw-ring-color': accent } as React.CSSProperties}
          >
            {MODULE_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {level === 'olevel' ? (
        <div>
          <label htmlFor={idGrade} className={labelClass}>
            Grade *
          </label>
          <select
            id={idGrade}
            aria-describedby={policyHintId}
            value={grade}
            onChange={(e) => setGrade(e.target.value as OLevelGrade)}
            className={selectClass}
            style={{ '--tw-ring-color': accent } as React.CSSProperties}
          >
            {OLEVEL_GRADES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      ) : hasALevel && aLevelNavKey ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={idSection} className={labelClass}>
              Section *
            </label>
            <select
              id={idSection}
              aria-describedby={policyHintId}
              value={section}
              onChange={(e) => setSection(e.target.value as ALevelSection)}
              className={selectClass}
              style={{ '--tw-ring-color': accent } as React.CSSProperties}
            >
              {ALEVEL_SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={idPaper} className={labelClass}>
              Paper *
            </label>
            <select
              id={idPaper}
              aria-describedby={policyHintId}
              value={routePaperSlug}
              onChange={(e) => setRoutePaperSlug(e.target.value)}
              className={selectClass}
              style={{ '--tw-ring-color': accent } as React.CSSProperties}
            >
              {papersNav.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor={idCategory} className={labelClass}>
          Category *
          {categoriesLoading && <span className="text-xs text-[var(--text-muted)] ml-2">Loading…</span>}
        </label>
        <select
          id={idCategory}
          aria-describedby={categoryDescribedBy}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={selectClass}
          disabled={categoriesLoading || (missingSectionParent && level === 'alevel')}
          style={{ '--tw-ring-color': accent } as React.CSSProperties}
        >
          <option value="" disabled>
            {ambiguousMatches ? 'Choose one (duplicate slugs detected)…' : 'Select category…'}
          </option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {ambiguousMatches ? `${c.name} — ${c.id.slice(0, 8)}…` : c.name}
            </option>
          ))}
        </select>
        {missingSectionParent && (
          <p id={idMissingSection} className="text-xs text-red-400 mt-1" role="status">
            Missing top-level category <code className="text-[10px]">{sectionNavKey}</code> for this subject. Create it in Categories first.
          </p>
        )}
        {ambiguousMatches && (
          <p id={idAmbiguous} className="text-xs text-amber-500 mt-1" role="status">
            Multiple rows share slug <code className="text-[10px]">{targetCategorySlug}</code> under this section. Pick the correct category below, or merge duplicates in the database.
          </p>
        )}
        {noCategoryMatch && (
          <p id={idNoMatch} className="text-xs text-amber-500 mt-1" role="status">
            No category with slug <code className="text-[10px]">{targetCategorySlug}</code> for this level/section. Create it in Categories (must match public routes).
          </p>
        )}
      </div>
    </div>
  );
}
