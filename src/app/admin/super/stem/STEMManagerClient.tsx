'use client';

import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, X, Save, Play,
  FlaskConical, Code2, ChevronDown, Columns2, Monitor,
  ExternalLink, AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  createSimulation,
  updateSimulation,
  deleteSimulation,
  toggleSimulationStatus,
} from './actions';

// ── Types ────────────────────────────────────────────────────────────────────

interface DBSimulation {
  id: string;
  title: string;
  slug: string;
  subject: string;
  category: string;
  description: string;
  instructions: string;
  icon: string;
  gradient: string;
  glow_color: string;
  difficulty: string;
  tags: string[];
  html_code: string;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface FormState {
  title: string;
  slug: string;
  subject: string;
  category: string;
  description: string;
  instructions: string;
  icon: string;
  gradient: string;
  glow_color: string;
  difficulty: string;
  tags: string;
  html_code: string;
  status: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  subject: 'mathematics',
  category: '',
  description: '',
  instructions: '',
  icon: 'Sparkles',
  gradient: 'from-blue-500 to-indigo-600',
  glow_color: 'rgba(99,102,241,0.35)',
  difficulty: 'Beginner',
  tags: '',
  html_code: '',
  status: 'draft',
};

const SUBJECT_OPTIONS = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
];

const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

const ICON_OPTIONS = [
  'Sparkles', 'Box', 'Move3D', 'TrendingUp', 'Atom', 'Activity',
  'Hexagon', 'FlaskConical', 'Pi', 'Zap', 'Globe', 'Cpu',
];

const GRADIENT_PRESETS = [
  { label: 'Blue → Indigo', value: 'from-blue-500 to-indigo-600' },
  { label: 'Blue → Cyan', value: 'from-blue-500 to-cyan-400' },
  { label: 'Violet → Purple', value: 'from-violet-500 to-purple-500' },
  { label: 'Emerald → Teal', value: 'from-emerald-500 to-teal-500' },
  { label: 'Amber → Yellow', value: 'from-amber-500 to-yellow-400' },
  { label: 'Rose → Pink', value: 'from-rose-500 to-pink-500' },
  { label: 'Teal → Emerald', value: 'from-teal-500 to-emerald-500' },
  { label: 'Amber → Orange', value: 'from-amber-500 to-orange-600' },
];

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const isPublished = status === 'published';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        isPublished
          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
          : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      {isPublished ? 'Published' : 'Draft'}
    </span>
  );
}

// ── Delete confirmation ──────────────────────────────────────────────────────
function DeleteConfirm({
  name,
  onConfirm,
  onCancel,
  pending,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Delete Simulation</h3>
            <p className="text-xs text-[var(--text-muted)]">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Are you sure you want to delete <strong className="text-[var(--text-primary)]">{name}</strong>?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 px-4 py-2 text-sm font-bold text-[var(--text-primary)] bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {pending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Editor workspace ─────────────────────────────────────────────────────────
function EditorWorkspace({
  form,
  setForm,
  onSave,
  onCancel,
  pending,
  isNew,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
  isNew: boolean;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [layout, setLayout] = useState<'code' | 'split' | 'preview'>('code');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-generate slug from title
  const updateTitle = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: isNew
        ? title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : prev.slug,
    }));
  };

  // Tab key inserts spaces in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      ta.value = val.substring(0, start) + '  ' + val.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
      setForm((prev) => ({ ...prev, html_code: ta.value }));
    }
  };

  const showCodePanel = layout !== 'preview';
  const showPreviewPanel = layout !== 'code';

  return (
    <div className="fixed inset-0 z-[150] bg-[var(--bg-primary)] flex flex-col">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-[var(--border-subtle)]"
        style={{ background: 'linear-gradient(90deg, rgba(11,17,32,0.95), rgba(15,20,38,0.95))' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-[var(--text-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {isNew ? 'New Simulation' : `Edit: ${form.title}`}
            </h3>
            <p className="text-[10px] text-[var(--text-muted)]">Simulation Factory</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout toggle */}
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-0.5">
            <button
              onClick={() => setLayout('code')}
              className={`p-1.5 rounded-md transition-colors ${layout === 'code' ? 'bg-violet-500/20 text-violet-300' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              title="Code only"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('split')}
              className={`p-1.5 rounded-md transition-colors ${layout === 'split' ? 'bg-violet-500/20 text-violet-300' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              title="Split view"
            >
              <Columns2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('preview')}
              className={`p-1.5 rounded-md transition-colors ${layout === 'preview' ? 'bg-violet-500/20 text-violet-300' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              title="Preview only"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onSave}
            disabled={pending}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[var(--text-primary)] bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20"
          >
            <Save className="w-3.5 h-3.5" />
            {pending ? 'Saving...' : isNew ? 'Create' : 'Save Changes'}
          </button>
          <button
            onClick={onCancel}
            className="p-2 text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left: Form + Code Editor ───────────────────────────────────── */}
        {showCodePanel && (
          <div className={`flex flex-col overflow-hidden ${showPreviewPanel ? 'w-1/2 border-r border-[var(--border-subtle)]' : 'w-full'}`}>
            {/* Form fields (collapsible) */}
            <div className="shrink-0 p-4 border-b border-[var(--border-subtle)] overflow-y-auto max-h-[320px]">
              <div className="grid grid-cols-2 gap-3">
                {/* Title */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => updateTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg outline-none focus:border-violet-500/40 transition-colors"
                    placeholder="e.g. 3D Geometry Explorer"
                  />
                </div>
                {/* Slug */}
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg outline-none focus:border-violet-500/40 transition-colors font-mono"
                    placeholder="geometry-explorer"
                  />
                </div>
                {/* Subject */}
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg outline-none focus:border-violet-500/40 transition-colors"
                  >
                    {SUBJECT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value} className="bg-[var(--bg-elevated)]">{o.label}</option>
                    ))}
                  </select>
                </div>
                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Category</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg outline-none focus:border-violet-500/40 transition-colors"
                    placeholder="e.g. Geometry, Atomic"
                  />
                </div>
                {/* Difficulty */}
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg outline-none focus:border-violet-500/40 transition-colors"
                  >
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <option key={d} value={d} className="bg-[var(--bg-elevated)]">{d}</option>
                    ))}
                  </select>
                </div>
                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Description</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg outline-none focus:border-violet-500/40 transition-colors"
                    placeholder="Brief description shown on the card"
                  />
                </div>
                {/* Instructions */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Instructions</label>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg outline-none focus:border-violet-500/40 transition-colors resize-none"
                    placeholder="How to use the simulation (shown in the instructions panel)"
                  />
                </div>
                {/* Tags */}
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Tags (comma-separated)</label>
                  <input
                    value={form.tags}
                    onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg outline-none focus:border-violet-500/40 transition-colors"
                    placeholder="Shapes, Volume, Area"
                  />
                </div>
                {/* Gradient preset */}
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Gradient</label>
                  <select
                    value={form.gradient}
                    onChange={(e) => setForm((p) => ({ ...p, gradient: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg outline-none focus:border-violet-500/40 transition-colors"
                  >
                    {GRADIENT_PRESETS.map((g) => (
                      <option key={g.value} value={g.value} className="bg-[var(--bg-elevated)]">{g.label}</option>
                    ))}
                  </select>
                </div>
                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg outline-none focus:border-violet-500/40 transition-colors"
                  >
                    <option value="draft" className="bg-[var(--bg-elevated)]">Draft</option>
                    <option value="published" className="bg-[var(--bg-elevated)]">Published</option>
                  </select>
                </div>
                {/* Icon */}
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Icon</label>
                  <select
                    value={form.icon}
                    onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg outline-none focus:border-violet-500/40 transition-colors"
                  >
                    {ICON_OPTIONS.map((ic) => (
                      <option key={ic} value={ic} className="bg-[var(--bg-elevated)]">{ic}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Code editor */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Simulation Code</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {form.html_code.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={form.html_code}
                onChange={(e) => setForm((p) => ({ ...p, html_code: e.target.value }))}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="flex-1 w-full px-4 py-3 text-[13px] leading-relaxed text-emerald-300/90 bg-[var(--bg-surface)] font-mono outline-none resize-none
                           selection:bg-violet-500/30 placeholder:text-[var(--text-muted)]"
                placeholder="Paste your full HTML document here...

<!DOCTYPE html>
<html>
<head>
  <style>/* your styles */</style>
</head>
<body>
  <canvas id=&quot;c&quot;></canvas>
  <script>/* your simulation code */</script>
</body>
</html>"
              />
            </div>
          </div>
        )}

        {/* ── Right: Live Preview ────────────────────────────────────────── */}
        {showPreviewPanel && (
          <div className={`flex flex-col ${showCodePanel ? 'w-1/2' : 'w-full'}`}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Live Preview</span>
              </div>
              {form.slug && (
                <a
                  href={`/stem/${form.subject}/${form.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-violet-400/60 hover:text-violet-400 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open page
                </a>
              )}
            </div>
            <div className="flex-1 bg-[var(--bg-primary)] relative">
              {form.html_code.trim() ? (
                <iframe
                  key={form.html_code.length} // Re-render on code change
                  srcDoc={form.html_code}
                  sandbox="allow-scripts allow-same-origin"
                  className="absolute inset-0 w-full h-full border-0"
                  title="Simulation Preview"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Code2 className="w-10 h-10 text-[var(--text-muted)] mb-3" />
                  <p className="text-sm text-[var(--text-muted)]">Paste HTML code to see preview</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function STEMManagerClient({
  initialSimulations,
}: {
  initialSimulations: DBSimulation[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [simulations, setSimulations] = useState(initialSimulations);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<DBSimulation | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>('all');

  const filtered = filterSubject === 'all'
    ? simulations
    : simulations.filter((s) => s.subject === filterSubject);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (sim: DBSimulation) => {
    setEditingId(sim.id);
    setForm({
      title: sim.title,
      slug: sim.slug,
      subject: sim.subject,
      category: sim.category,
      description: sim.description,
      instructions: sim.instructions,
      icon: sim.icon,
      gradient: sim.gradient,
      glow_color: sim.glow_color,
      difficulty: sim.difficulty,
      tags: sim.tags.join(', '),
      html_code: sim.html_code,
      status: sim.status,
    });
    setEditorOpen(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = { ...form, tags };

      let result;
      if (editingId) {
        result = await updateSimulation(editingId, payload);
      } else {
        result = await createSimulation(payload);
      }

      if (result.success) {
        showToast({ message: editingId ? 'Simulation updated!' : 'Simulation created!', type: 'success' });
        setEditorOpen(false);
        router.refresh();
      } else {
        showToast({ message: result.error || 'Something went wrong', type: 'error' });
      }
    });
  };

  const handleDelete = (sim: DBSimulation) => {
    setDeleteTarget(sim);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteSimulation(deleteTarget.id);
      if (result.success) {
        showToast({ message: 'Simulation deleted', type: 'success' });
        setDeleteTarget(null);
        router.refresh();
      } else {
        showToast({ message: result.error || 'Failed to delete', type: 'error' });
      }
    });
  };

  const handleToggleStatus = (sim: DBSimulation) => {
    startTransition(async () => {
      const result = await toggleSimulationStatus(sim.id, sim.status);
      if (result.success) {
        const newStatus = sim.status === 'published' ? 'draft' : 'published';
        showToast({
          message: `Simulation ${newStatus === 'published' ? 'published' : 'unpublished'}!`,
          type: 'success',
        });
        router.refresh();
      } else {
        showToast({ message: result.error || 'Failed to toggle status', type: 'error' });
      }
    });
  };

  // Keep local state in sync when server refreshes
  useEffect(() => {
    setSimulations(initialSimulations);
  }, [initialSimulations]);

  return (
    <>
      {/* ── Header + Actions ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Subject filter */}
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-0.5">
            {['all', 'mathematics', 'science'].map((v) => (
              <button
                key={v}
                onClick={() => setFilterSubject(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filterSubject === v
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {v === 'all' ? 'All' : v === 'mathematics' ? 'Maths' : 'Science'}
              </button>
            ))}
          </div>
          <span className="text-xs text-[var(--text-muted)]">{filtered.length} simulation{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[var(--text-primary)] bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-lg transition-all shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          New Simulation
        </button>
      </div>

      {/* ── Simulation Table ────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FlaskConical className="w-12 h-12 text-[var(--text-muted)] mb-3" />
            <p className="text-sm text-[var(--text-muted)] mb-4">No simulations yet</p>
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create your first simulation
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Subject</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Code</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sim) => (
                <tr
                  key={sim.id}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors group"
                >
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{sim.title}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono">{sim.slug}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-[var(--text-muted)] capitalize">{sim.subject}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-[var(--text-muted)]">{sim.category}</span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={sim.status} />
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {sim.html_code ? `${(sim.html_code.length / 1024).toFixed(1)} KB` : 'empty'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggleStatus(sim)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title={sim.status === 'published' ? 'Unpublish' : 'Publish'}
                      >
                        {sim.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => openEdit(sim)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sim)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Editor Modal ────────────────────────────────────────────────── */}
      {editorOpen && (
        <EditorWorkspace
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onCancel={() => setEditorOpen(false)}
          pending={isPending}
          isNew={!editingId}
        />
      )}

      {/* ── Delete Confirmation ─────────────────────────────────────────── */}
      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.title}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          pending={isPending}
        />
      )}
    </>
  );
}
