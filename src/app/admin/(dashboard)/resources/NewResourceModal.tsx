'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { X, PlayCircle, FileText, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { MODULE_TYPES, CONTENT_TYPES } from '@/lib/constants';

interface SubjectRow {
  id: string;
  name: string;
  code: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  subject_id: string;
}

type ModuleType = typeof MODULE_TYPES.VIDEO_TOPICAL | typeof MODULE_TYPES.SOLVED_PAST_PAPER;

const SESSION_OPTIONS = [
  { value: 'mj', label: 'May/June' },
  { value: 'on', label: 'Oct/Nov' },
  { value: 'fm', label: 'Feb/March' },
] as const;

function generateDisplayTitle(session: string, year: string, variant: string): string {
  const sessionLabel = SESSION_OPTIONS.find(s => s.value === session)?.label ?? session;
  const parts = [sessionLabel];
  if (year) parts.push(year);
  if (variant) parts.push(`- Paper ${variant}`);
  return parts.join(' ');
}

export default function NewResourceModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const { showToast } = useToast();
  const [moduleType, setModuleType] = useState<ModuleType>(MODULE_TYPES.VIDEO_TOPICAL);
  const [keepOpen, setKeepOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    category_id: '',
    paper: '',
    year: new Date().getFullYear().toString(),
    video_url: '',
    worksheet_url: '',
    solution_url: '',
    session: 'mj',
    variant: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setCategoriesLoading(true);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      // Fetch all subjects from the new subjects table (post-migration 012)
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id, name, slug')
        .order('name');
      if (subjectData) {
        // Map slug to a display code for backward compatibility
        const mapped = subjectData.map(s => ({
          ...s,
          code: s.slug === 'maths' ? '4024/9709' : s.slug === 'computer-science' ? '0478/9618' : s.slug,
        }));
        setSubjects(mapped as SubjectRow[]);
        if (!formData.subject_id && mapped.length > 0) {
          setFormData(prev => ({ ...prev, subject_id: mapped[0].id }));
        }
      }
      // Fetch all categories (filtered client-side by selected subject)
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name, subject_id')
        .order('sort_order');
      if (catData) setCategories(catData as Category[]);
      setCategoriesLoading(false);
    };
    fetchData();
    setTimeout(() => titleRef.current?.focus(), 80);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.subject_id) {
      showToast({ message: 'Please select a Subject.', type: 'error' });
      setLoading(false);
      return;
    }

    if (!formData.category_id) {
      showToast({ message: 'Please select a Target Module.', type: 'error' });
      setLoading(false);
      return;
    }

    const validateUrl = (url: string) => {
      if (!url) return true;
      return /^https?:\/\/(drive\.google\.com|youtu\.be|www\.youtube\.com)\/.+/.test(url);
    };

    const richTitle = moduleType === MODULE_TYPES.SOLVED_PAST_PAPER
      ? generateDisplayTitle(formData.session, formData.year, formData.variant)
      : formData.title;

    const payloads = [];

    // Resolve the subject slug for the DB `subject` column
    const selectedSubject = subjects.find(s => s.id === formData.subject_id);
    const subjectSlug = selectedSubject?.slug ?? '';
    const subjectId = formData.subject_id;

    if (moduleType === MODULE_TYPES.VIDEO_TOPICAL) {
      // Must have at least a video URL
      if (!formData.video_url) {
        showToast({ message: 'Please provide a YouTube Video link.', type: 'error' });
        setLoading(false);
        return;
      }
      if (!validateUrl(formData.video_url)) {
        showToast({ message: 'Video URL must be a valid YouTube link.', type: 'error' });
        setLoading(false);
        return;
      }
      if (formData.worksheet_url && !validateUrl(formData.worksheet_url)) {
        showToast({ message: 'Worksheet URL must be a valid Google Drive link.', type: 'error' });
        setLoading(false);
        return;
      }

      payloads.push({
        title: richTitle,
        subject: subjectSlug,
        subject_id: subjectId,
        category_id: formData.category_id,
        source_url: formData.video_url,
        worksheet_url: formData.worksheet_url || null,
        source_type: 'youtube',
        content_type: CONTENT_TYPES.VIDEO,
        module_type: MODULE_TYPES.VIDEO_TOPICAL,
        is_published: true,
        is_locked: false,
        is_watermarked: false,
      });

    } else {
      // Solved Past Paper — single PDF link
      if (!formData.solution_url) {
        showToast({ message: 'Please provide a PDF Solution link.', type: 'error' });
        setLoading(false);
        return;
      }
      if (!validateUrl(formData.solution_url)) {
        showToast({ message: 'Solution URL must be a valid Google Drive link.', type: 'error' });
        setLoading(false);
        return;
      }

      // If admin also provided a YouTube video → save as video resource with PDF as worksheet
      // This enables the Interactive Solver dual-pane view
      const hasVideo = formData.video_url && validateUrl(formData.video_url);

      if (hasVideo) {
        payloads.push({
          title: richTitle,
          subject: subjectSlug,
          subject_id: subjectId,
          category_id: formData.category_id,
          source_url: formData.video_url,
          worksheet_url: formData.solution_url,
          source_type: 'youtube',
          content_type: CONTENT_TYPES.VIDEO,
          module_type: MODULE_TYPES.SOLVED_PAST_PAPER,
          is_published: true,
          is_locked: false,
          is_watermarked: false,
        });
      } else {
        payloads.push({
          title: richTitle,
          subject: subjectSlug,
          subject_id: subjectId,
          category_id: formData.category_id,
          source_url: formData.solution_url,
          source_type: 'google_drive',
          content_type: CONTENT_TYPES.PDF,
          module_type: MODULE_TYPES.SOLVED_PAST_PAPER,
          is_published: true,
          is_locked: false,
          is_watermarked: false,
        });
      }
    }

    try {
      const { bulkInsertResources } = await import('../../actions');
      const { success, error } = await bulkInsertResources(payloads);

      if (success) {
        showToast({ message: `Saved! ${keepOpen ? 'Ready for next entry.' : ''}`, type: 'success' });
        if (keepOpen) {
          // Clear only the URL fields — keep subject, category, module type, session
          setFormData(prev => ({ ...prev, title: '', video_url: '', worksheet_url: '', solution_url: '', paper: '', variant: '' }));
          setTimeout(() => titleRef.current?.focus(), 50);
        } else {
          onSuccess();
          setFormData({ ...formData, title: '', video_url: '', worksheet_url: '', solution_url: '', paper: '', variant: '' });
        }
      } else {
        showToast({ message: error || 'Failed to link resources', type: 'error' });
      }
    } catch (err: any) {
      showToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter categories to only show those belonging to the selected subject
  const activeCategories = categories.filter(c => c.subject_id === formData.subject_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[var(--bg-elevated)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8 border border-[var(--border-color)]">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Link Teaching Materials</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Module Type Radio Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Content Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModuleType(MODULE_TYPES.VIDEO_TOPICAL)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  moduleType === MODULE_TYPES.VIDEO_TOPICAL
                    ? 'border-red-500/50 bg-red-500/10 text-red-300'
                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-color)]'
                }`}
              >
                <PlayCircle className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Video + Topical</div>
                  <div className="text-xs opacity-70">Linked pair</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setModuleType(MODULE_TYPES.SOLVED_PAST_PAPER)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  moduleType === MODULE_TYPES.SOLVED_PAST_PAPER
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--border-color)]'
                }`}
              >
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Solved Past Paper</div>
                  <div className="text-xs opacity-70">PDF + optional Video</div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* ── Title section: Topic Name for videos, Session/Year/Variant for past papers ── */}
            {moduleType === MODULE_TYPES.VIDEO_TOPICAL ? (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Topic Name</label>
                <input
                  ref={titleRef}
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-orange-500/50 focus:border-orange-500/50 bg-[var(--bg-card)] text-[var(--text-primary)]"
                  placeholder="e.g. Differentiation Rules"
                />
              </div>
            ) : (
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Paper Identity</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Session</label>
                    <select
                      value={formData.session}
                      onChange={e => setFormData({ ...formData, session: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-orange-500/50 focus:border-orange-500/50 bg-[var(--bg-card)] text-[var(--text-primary)]"
                    >
                      {SESSION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Year</label>
                    <input
                      ref={titleRef}
                      required
                      value={formData.year}
                      onChange={e => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-orange-500/50 focus:border-orange-500/50 bg-[var(--bg-card)] text-[var(--text-primary)]"
                      placeholder="e.g. 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Paper Variant</label>
                    <input
                      required
                      value={formData.variant}
                      onChange={e => setFormData({ ...formData, variant: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-orange-500/50 focus:border-orange-500/50 bg-[var(--bg-card)] text-[var(--text-primary)]"
                      placeholder="e.g. 12, 22"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                  Preview: <span className="font-semibold text-[var(--text-secondary)]">{generateDisplayTitle(formData.session, formData.year, formData.variant) || '—'}</span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Subject</label>
              <select value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value, category_id: '' })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-orange-500/50 focus:border-orange-500/50 bg-[var(--bg-card)] text-[var(--text-primary)]">
                <option value="" disabled>Select subject…</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Target Module</label>
              {categoriesLoading ? (
                <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-muted)] border border-[var(--border-color)] rounded-lg bg-[var(--bg-surface)]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading modules…
                </div>
              ) : activeCategories.length === 0 && formData.subject_id ? (
                <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-amber-400 border border-amber-500/20 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>No modules found for this subject. Create one in Taxonomy Manager.</span>
                </div>
              ) : (
                <select required value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-orange-500/50 focus:border-orange-500/50 bg-[var(--bg-card)] text-[var(--text-primary)]">
                  <option value="" disabled>Select mapping...</option>
                  {activeCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Dynamic Link Inputs */}
            <div className="col-span-2 pt-2 border-t border-[var(--border-subtle)]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
                {moduleType === MODULE_TYPES.VIDEO_TOPICAL ? 'Resource Links' : 'PDF Solution Link'}
              </label>

              <div className="space-y-3">
                {moduleType === MODULE_TYPES.VIDEO_TOPICAL ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-red-600 mb-1">YouTube Video Link *</label>
                      <input required value={formData.video_url} onChange={e => setFormData({ ...formData, video_url: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-red-500/50 focus:border-red-500/50 bg-[var(--bg-card)] text-[var(--text-primary)] font-mono text-sm" placeholder="https://www.youtube.com/watch?v=..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-600 mb-1">Worksheet Drive Link (Optional)</label>
                      <input value={formData.worksheet_url} onChange={e => setFormData({ ...formData, worksheet_url: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-emerald-500/50 focus:border-emerald-500/50 bg-[var(--bg-card)] text-[var(--text-primary)] font-mono text-sm" placeholder="https://drive.google.com/file/d/..." />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-blue-600 mb-1">PDF Solution Link *</label>
                      <input required value={formData.solution_url} onChange={e => setFormData({ ...formData, solution_url: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-blue-500/50 focus:border-blue-500/50 bg-[var(--bg-card)] text-[var(--text-primary)] font-mono text-sm" placeholder="https://drive.google.com/file/d/..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-red-600 mb-1">YouTube Video Walkthrough (Optional)</label>
                      <input value={formData.video_url} onChange={e => setFormData({ ...formData, video_url: e.target.value })} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-red-500/50 focus:border-red-500/50 bg-[var(--bg-card)] text-[var(--text-primary)] font-mono text-sm" placeholder="https://www.youtube.com/watch?v=..." />
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">Adding a video enables the Interactive Solver (split-screen PDF + Video)</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] mt-6 sticky bottom-0 bg-[var(--bg-elevated)]">
            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keepOpen}
                onChange={e => setKeepOpen(e.target.checked)}
                className="w-4 h-4 accent-gold-500 cursor-pointer"
              />
              <RotateCcw className="w-3.5 h-3.5" />
              Keep open after save
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-card)] rounded-lg transition">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] rounded-lg transition disabled:opacity-50 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700">
                {loading ? 'Processing...' : keepOpen ? '✓ Save & Next' : moduleType === MODULE_TYPES.VIDEO_TOPICAL ? 'Link Video + Topical' : 'Link Past Paper'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
