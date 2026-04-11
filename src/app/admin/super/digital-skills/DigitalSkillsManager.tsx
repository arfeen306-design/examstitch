'use client';

import { useState, useTransition, useCallback, useRef } from 'react';
import {
  createSkill, updateSkill, deleteSkill,
  createPlaylist, updatePlaylist, deletePlaylist,
  createLesson, updateLesson, deleteLesson,
  reorderPlaylists, reorderLessons,
  uploadDigitalSkillAsset,
} from './actions';
import {
  Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronRight,
  Video, FileText, Eye, EyeOff, Layers, BookOpen,
  Users, Sparkles, ListVideo, ArrowUp, ArrowDown,
  Play, FileDown, PenLine, BrainCircuit, Image,
  GripVertical, ExternalLink, Save, Upload, Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SkillRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  tagline: string | null;
  description: string | null;
  gradient: string;
  glow_color: string;
  is_active: boolean;
  sort_order: number;
}

interface PlaylistRow {
  id: string;
  skill_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

interface LessonRow {
  id: string;
  playlist_id: string;
  title: string;
  video_url: string | null;
  resource_url: string | null;
  notes_url: string | null;
  exercises_url: string | null;
  cheatsheet_url: string | null;
  quiz_url: string | null;
  duration: string | null;
  sort_order: number;
  is_free: boolean;
}

interface Props {
  initialSkills: SkillRow[];
  initialPlaylists: PlaylistRow[];
  initialLessons: LessonRow[];
  skillAccessCounts: Record<string, number>;
}

const GRADIENT_PRESETS = [
  { label: 'Violet', value: 'from-violet-600 to-indigo-700', glow: 'rgba(124,58,237,0.35)' },
  { label: 'Pink', value: 'from-pink-500 to-rose-600', glow: 'rgba(236,72,153,0.35)' },
  { label: 'Cyan', value: 'from-cyan-500 to-blue-600', glow: 'rgba(6,182,212,0.35)' },
  { label: 'Emerald', value: 'from-emerald-500 to-teal-600', glow: 'rgba(16,185,129,0.35)' },
  { label: 'Amber', value: 'from-amber-500 to-orange-600', glow: 'rgba(245,158,11,0.35)' },
  { label: 'Fuchsia', value: 'from-fuchsia-500 to-purple-600', glow: 'rgba(192,38,211,0.35)' },
  { label: 'Sky', value: 'from-sky-500 to-blue-600', glow: 'rgba(14,165,233,0.35)' },
  { label: 'Lime', value: 'from-lime-500 to-green-600', glow: 'rgba(132,204,22,0.35)' },
];

const ICON_OPTIONS = [
  'Code2', 'Palette', 'Brain', 'Globe', 'Shield', 'Database',
  'Smartphone', 'BarChart3', 'Cpu', 'Camera', 'Music', 'Pen',
];

type LessonFormData = {
  title: string;
  video_url: string;
  notes_url: string;
  exercises_url: string;
  cheatsheet_url: string;
  quiz_url: string;
  resource_url: string;
  duration: string;
  is_free: boolean;
};

const EMPTY_LESSON_FORM: LessonFormData = {
  title: '', video_url: '', notes_url: '', exercises_url: '',
  cheatsheet_url: '', quiz_url: '', resource_url: '', duration: '', is_free: false,
};

/** Form controls must set background + text explicitly; browser defaults are light and break dark theme. */
const DS_INPUT =
  'px-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/30';
const DS_INPUT_MONO = `${DS_INPUT} font-mono`;
const DS_TEXTAREA =
  'w-full px-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none resize-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/30';
const DS_SELECT =
  'px-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/30';
const DS_INPUT_BLUE =
  'w-full px-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30';

// ─── Helper: Upload-or-URL field ─────────────────────────────────────────────

function UploadableField({
  label, icon, value, onChange, placeholder, ringColor, folder, accept,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ringColor: string;
  folder: string;
  accept: string;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const res = await uploadDigitalSkillAsset(fd);
      if (res.success && res.url) {
        onChange(res.url);
      } else {
        alert('Upload failed: ' + (res.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Upload error: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-1">
        {icon} {label}
      </label>
      <div className="flex gap-1.5">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 px-3 py-2.5 text-sm font-mono border border-[var(--border-color)] rounded-xl bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 ${ringColor} outline-none`}
        />
        <label className={`shrink-0 px-3 py-2.5 rounded-xl border border-[var(--border-color)] cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Uploading…' : 'Upload'}
          <input type="file" accept={accept} onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
      </div>
      {value && (
        <p className="text-xs text-emerald-400 mt-1 truncate">✓ {value.split('/').pop()}</p>
      )}
    </div>
  );
}

// ─── Helper: Extract YouTube video ID for thumbnail preview ─────────────────
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  // Could be a raw video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function DigitalSkillsManager({
  initialSkills,
  initialPlaylists,
  initialLessons,
  skillAccessCounts,
}: Props) {
  const [skills, setSkills] = useState(initialSkills);
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [lessons, setLessons] = useState(initialLessons);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  // UI state
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);
  const [showNewSkill, setShowNewSkill] = useState(false);
  const [newPlaylistSkillId, setNewPlaylistSkillId] = useState<string | null>(null);

  // Lesson modal state
  const [lessonModal, setLessonModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    playlistId: string;
    lessonId?: string;
  }>({ open: false, mode: 'create', playlistId: '' });
  const [lessonForm, setLessonForm] = useState<LessonFormData>(EMPTY_LESSON_FORM);
  const lessonTitleInputRef = useRef<HTMLInputElement>(null);
  const [isSavingLesson, setIsSavingLesson] = useState(false);

  // Skill editing
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editSkillForm, setEditSkillForm] = useState({ name: '', tagline: '', description: '', icon: '', gradient: '' });

  // Playlist editing
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editPlaylistForm, setEditPlaylistForm] = useState({ title: '', description: '' });

  // Form state for new skill / new playlist
  const [skillForm, setSkillForm] = useState({ name: '', slug: '', icon: 'Code2', tagline: '', description: '', gradient: GRADIENT_PRESETS[0].value });
  const [playlistForm, setPlaylistForm] = useState({ title: '', description: '' });

  // ── Lesson Modal Helpers ──────────────────────────────────────────────────

  const openCreateLessonModal = useCallback((playlistId: string) => {
    setLessonForm(EMPTY_LESSON_FORM);
    setLessonModal({ open: true, mode: 'create', playlistId });
  }, []);

  const openEditLessonModal = useCallback((lesson: LessonRow) => {
    setLessonForm({
      title: lesson.title,
      video_url: lesson.video_url || '',
      notes_url: lesson.notes_url || '',
      exercises_url: lesson.exercises_url || '',
      cheatsheet_url: lesson.cheatsheet_url || '',
      quiz_url: lesson.quiz_url || '',
      resource_url: lesson.resource_url || '',
      duration: lesson.duration || '',
      is_free: lesson.is_free,
    });
    setLessonModal({ open: true, mode: 'edit', playlistId: lesson.playlist_id, lessonId: lesson.id });
  }, []);

  const closeLessonModal = useCallback(() => {
    setLessonModal({ open: false, mode: 'create', playlistId: '' });
    setLessonForm(EMPTY_LESSON_FORM);
  }, []);

  // ── Skill CRUD ────────────────────────────────────────────────────────────

  const handleCreateSkill = () => {
    startTransition(async () => {
      const preset = GRADIENT_PRESETS.find(p => p.value === skillForm.gradient) || GRADIENT_PRESETS[0];
      const result = await createSkill({
        name: skillForm.name,
        slug: skillForm.slug || skillForm.name.toLowerCase().replace(/\s+/g, '-'),
        icon: skillForm.icon,
        tagline: skillForm.tagline || undefined,
        description: skillForm.description || undefined,
        gradient: preset.value,
        glow_color: preset.glow,
      });
      if (result.success && 'skill' in result && result.skill) {
        const row = result.skill;
        setSkills((prev) => [...prev, {
          id: row.id,
          name: row.name,
          slug: row.slug,
          icon: row.icon,
          tagline: row.tagline,
          description: row.description,
          gradient: row.gradient,
          glow_color: row.glow_color,
          is_active: row.is_active,
          sort_order: row.sort_order,
        }].sort((a, b) => a.sort_order - b.sort_order));
        showToast({ message: 'Skill created!', type: 'success' });
        setShowNewSkill(false);
        setSkillForm({ name: '', slug: '', icon: 'Code2', tagline: '', description: '', gradient: GRADIENT_PRESETS[0].value });
      } else {
        showToast({ message: result.error || 'Failed', type: 'error' });
      }
    });
  };

  const handleSaveSkillEdit = (skill: SkillRow) => {
    const preset = GRADIENT_PRESETS.find(p => p.value === editSkillForm.gradient);
    startTransition(async () => {
      const result = await updateSkill(skill.id, {
        name: editSkillForm.name || undefined,
        tagline: editSkillForm.tagline || undefined,
        description: editSkillForm.description || undefined,
        icon: editSkillForm.icon || undefined,
        gradient: editSkillForm.gradient || undefined,
        glow_color: preset?.glow || undefined,
      });
      if (result.success) {
        setSkills(prev => prev.map(s => s.id === skill.id ? {
          ...s,
          name: editSkillForm.name || s.name,
          tagline: editSkillForm.tagline || s.tagline,
          description: editSkillForm.description || s.description,
          icon: editSkillForm.icon || s.icon,
          gradient: editSkillForm.gradient || s.gradient,
          glow_color: preset?.glow || s.glow_color,
        } : s));
        setEditingSkillId(null);
        showToast({ message: 'Skill updated', type: 'success' });
      } else {
        showToast({ message: result.error || 'Failed', type: 'error' });
      }
    });
  };

  const handleToggleSkillActive = (skill: SkillRow) => {
    setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, is_active: !s.is_active } : s));
    startTransition(async () => {
      const result = await updateSkill(skill.id, { is_active: !skill.is_active });
      if (!result.success) {
        setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, is_active: skill.is_active } : s));
        showToast({ message: result.error || 'Failed', type: 'error' });
      }
    });
  };

  const handleDeleteSkill = (skill: SkillRow) => {
    if (!confirm(`Delete "${skill.name}" and all its playlists and lessons? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteSkill(skill.id);
      if (result.success) {
        setSkills(prev => prev.filter(s => s.id !== skill.id));
        setPlaylists(prev => prev.filter(p => p.skill_id !== skill.id));
        showToast({ message: 'Skill deleted', type: 'success' });
      } else {
        showToast({ message: result.error || 'Failed', type: 'error' });
      }
    });
  };

  // ── Playlist CRUD ─────────────────────────────────────────────────────────

  const handleCreatePlaylist = (skillId: string) => {
    startTransition(async () => {
      const result = await createPlaylist({
        skill_id: skillId,
        title: playlistForm.title,
        description: playlistForm.description || undefined,
      });
      if (result.success && 'playlist' in result && result.playlist) {
        const pl = result.playlist;
        setPlaylists((prev) => [...prev, {
          id: pl.id,
          skill_id: pl.skill_id,
          title: pl.title,
          description: pl.description,
          sort_order: pl.sort_order,
        }].sort((a, b) => a.sort_order - b.sort_order));
        showToast({ message: 'Playlist created!', type: 'success' });
        setNewPlaylistSkillId(null);
        setPlaylistForm({ title: '', description: '' });
      } else {
        showToast({ message: result.error || 'Failed', type: 'error' });
      }
    });
  };

  const handleSavePlaylistEdit = (playlist: PlaylistRow) => {
    startTransition(async () => {
      const result = await updatePlaylist(playlist.id, {
        title: editPlaylistForm.title || undefined,
        description: editPlaylistForm.description || undefined,
      });
      if (result.success) {
        setPlaylists(prev => prev.map(p => p.id === playlist.id ? {
          ...p,
          title: editPlaylistForm.title || p.title,
          description: editPlaylistForm.description || p.description,
        } : p));
        setEditingPlaylistId(null);
        showToast({ message: 'Playlist updated', type: 'success' });
      } else {
        showToast({ message: result.error || 'Failed', type: 'error' });
      }
    });
  };

  const handleDeletePlaylist = (playlist: PlaylistRow) => {
    if (!confirm(`Delete playlist "${playlist.title}" and all its lessons?`)) return;
    startTransition(async () => {
      const result = await deletePlaylist(playlist.id);
      if (result.success) {
        setPlaylists(prev => prev.filter(p => p.id !== playlist.id));
        setLessons(prev => prev.filter(l => l.playlist_id !== playlist.id));
        showToast({ message: 'Playlist deleted', type: 'success' });
      } else {
        showToast({ message: result.error || 'Failed', type: 'error' });
      }
    });
  };

  // ── Playlist reorder ──────────────────────────────────────────────────────

  const movePlaylist = (skillId: string, playlistId: string, dir: -1 | 1) => {
    const group = playlists.filter(p => p.skill_id === skillId).sort((a, b) => a.sort_order - b.sort_order);
    const idx = group.findIndex(p => p.id === playlistId);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === group.length - 1)) return;
    const swapWith = group[idx + dir];
    const newOrder = group.map((p, i) => {
      if (p.id === playlistId) return { id: p.id, sort_order: swapWith.sort_order };
      if (p.id === swapWith.id) return { id: p.id, sort_order: group[idx].sort_order };
      return { id: p.id, sort_order: p.sort_order };
    });
    setPlaylists(prev => {
      const rest = prev.filter(p => p.skill_id !== skillId);
      const updated = prev.filter(p => p.skill_id === skillId).map(p => {
        const match = newOrder.find(o => o.id === p.id);
        return match ? { ...p, sort_order: match.sort_order } : p;
      });
      return [...rest, ...updated].sort((a, b) => a.sort_order - b.sort_order);
    });
    startTransition(async () => {
      await reorderPlaylists(newOrder);
    });
  };

  // ── Lesson CRUD ───────────────────────────────────────────────────────────

  const handleSubmitLesson = () => {
    if (isSavingLesson) return;
    if (lessonModal.mode === 'create' && !lessonForm.title.trim()) return;

    setIsSavingLesson(true);
    startTransition(async () => {
      try {
        if (lessonModal.mode === 'create') {
          const result = await createLesson({
            playlist_id: lessonModal.playlistId,
            title: lessonForm.title,
            video_url: lessonForm.video_url || undefined,
            notes_url: lessonForm.notes_url || undefined,
            exercises_url: lessonForm.exercises_url || undefined,
            cheatsheet_url: lessonForm.cheatsheet_url || undefined,
            quiz_url: lessonForm.quiz_url || undefined,
            resource_url: lessonForm.resource_url || undefined,
            duration: lessonForm.duration || undefined,
            is_free: lessonForm.is_free,
          });
          if (result.success && 'lesson' in result && result.lesson) {
            const row = result.lesson;
            setLessons((prev) => [...prev, {
              id: row.id,
              playlist_id: row.playlist_id,
              title: row.title,
              video_url: row.video_url,
              resource_url: row.resource_url,
              notes_url: row.notes_url,
              exercises_url: row.exercises_url,
              cheatsheet_url: row.cheatsheet_url,
              quiz_url: row.quiz_url,
              duration: row.duration,
              sort_order: row.sort_order,
              is_free: row.is_free,
            }].sort((a, b) => a.sort_order - b.sort_order));
            setLessonForm(EMPTY_LESSON_FORM);
            showToast({
              message: 'Lesson saved successfully. Ready for next entry.',
              type: 'success',
            });
            requestAnimationFrame(() => lessonTitleInputRef.current?.focus());
          } else {
            const msg = !result.success && 'error' in result && result.error ? result.error : 'Failed';
            showToast({ message: msg, type: 'error' });
          }
        } else if (lessonModal.lessonId) {
          const result = await updateLesson(lessonModal.lessonId, {
            title: lessonForm.title,
            video_url: lessonForm.video_url || null,
            notes_url: lessonForm.notes_url || null,
            exercises_url: lessonForm.exercises_url || null,
            cheatsheet_url: lessonForm.cheatsheet_url || null,
            quiz_url: lessonForm.quiz_url || null,
            resource_url: lessonForm.resource_url || null,
            duration: lessonForm.duration || null,
            is_free: lessonForm.is_free,
          });
          if (result.success) {
            setLessons(prev => prev.map(l => l.id === lessonModal.lessonId ? {
              ...l,
              title: lessonForm.title,
              video_url: lessonForm.video_url || null,
              notes_url: lessonForm.notes_url || null,
              exercises_url: lessonForm.exercises_url || null,
              cheatsheet_url: lessonForm.cheatsheet_url || null,
              quiz_url: lessonForm.quiz_url || null,
              resource_url: lessonForm.resource_url || null,
              duration: lessonForm.duration || null,
              is_free: lessonForm.is_free,
            } : l));
            closeLessonModal();
            showToast({ message: 'Lesson updated!', type: 'success' });
          } else {
            showToast({ message: result.error || 'Failed', type: 'error' });
          }
        }
      } finally {
        setIsSavingLesson(false);
      }
    });
  };

  const handleToggleLessonFree = (lesson: LessonRow) => {
    setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, is_free: !l.is_free } : l));
    startTransition(async () => {
      const result = await updateLesson(lesson.id, { is_free: !lesson.is_free });
      if (!result.success) {
        setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, is_free: lesson.is_free } : l));
        showToast({ message: result.error || 'Failed', type: 'error' });
      }
    });
  };

  const handleDeleteLesson = (lesson: LessonRow) => {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteLesson(lesson.id);
      if (result.success) {
        setLessons(prev => prev.filter(l => l.id !== lesson.id));
        showToast({ message: 'Lesson deleted', type: 'success' });
      } else {
        showToast({ message: result.error || 'Failed', type: 'error' });
      }
    });
  };

  // ── Lesson reorder ────────────────────────────────────────────────────────

  const moveLesson = (playlistId: string, lessonId: string, dir: -1 | 1) => {
    const group = lessons.filter(l => l.playlist_id === playlistId).sort((a, b) => a.sort_order - b.sort_order);
    const idx = group.findIndex(l => l.id === lessonId);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === group.length - 1)) return;
    const swapWith = group[idx + dir];
    const newOrder = group.map(l => {
      if (l.id === lessonId) return { id: l.id, sort_order: swapWith.sort_order };
      if (l.id === swapWith.id) return { id: l.id, sort_order: group[idx].sort_order };
      return { id: l.id, sort_order: l.sort_order };
    });
    setLessons(prev => {
      const rest = prev.filter(l => l.playlist_id !== playlistId);
      const updated = prev.filter(l => l.playlist_id === playlistId).map(l => {
        const match = newOrder.find(o => o.id === l.id);
        return match ? { ...l, sort_order: match.sort_order } : l;
      });
      return [...rest, ...updated].sort((a, b) => a.sort_order - b.sort_order);
    });
    startTransition(async () => {
      await reorderLessons(newOrder);
    });
  };

  // ── Resource badges for lesson rows ───────────────────────────────────────

  const resourceBadges = (lesson: LessonRow) => {
    const badges: { label: string; color: string }[] = [];
    if (lesson.video_url) badges.push({ label: 'Video', color: 'text-red-400 bg-red-500/15' });
    if (lesson.notes_url) badges.push({ label: 'Notes', color: 'text-blue-400 bg-blue-500/15' });
    if (lesson.exercises_url) badges.push({ label: 'Exercises', color: 'text-amber-400 bg-amber-500/15' });
    if (lesson.cheatsheet_url) badges.push({ label: 'Cheat Sheet', color: 'text-purple-400 bg-purple-500/15' });
    if (lesson.quiz_url) badges.push({ label: 'Quiz', color: 'text-emerald-300 bg-emerald-500/15' });
    if (lesson.resource_url) badges.push({ label: 'Resource', color: 'text-green-400 bg-green-500/15' });
    return badges;
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalLessons = lessons.length;
  const totalPlaylists = playlists.length;

  // ── Render ────────────────────────────────────────────────────────────────

  const ytPreviewId = extractYouTubeId(lessonForm.video_url);

  return (
    <>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Skills', value: skills.length, icon: Sparkles, color: 'text-violet-300', bg: 'bg-violet-500/15' },
            { label: 'Playlists', value: totalPlaylists, icon: Layers, color: 'text-blue-300', bg: 'bg-blue-500/15' },
            { label: 'Lessons', value: totalLessons, icon: ListVideo, color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
            { label: 'Enrolled', value: Object.values(skillAccessCounts).reduce((a, b) => a + b, 0), icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/15' },
          ].map(s => (
            <div key={s.label} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)]">{s.label}</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* New Skill Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Skill Tracks</h3>
          <button
            onClick={() => setShowNewSkill(!showNewSkill)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-[var(--text-primary)] rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Skill
          </button>
        </div>

        {/* New Skill Form */}
        {showNewSkill && (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3">
            <p className="text-sm font-bold text-[var(--text-primary)]">Create New Skill</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={skillForm.name}
                onChange={e => setSkillForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                placeholder="Skill name (e.g. Web Development)"
                className={DS_INPUT}
              />
              <input
                value={skillForm.slug}
                onChange={e => setSkillForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="Slug (auto-generated)"
                className={DS_INPUT_MONO}
              />
              <input
                value={skillForm.tagline}
                onChange={e => setSkillForm(f => ({ ...f, tagline: e.target.value }))}
                placeholder="Tagline (e.g. Build the future)"
                className={DS_INPUT}
              />
              <select
                value={skillForm.icon}
                onChange={e => setSkillForm(f => ({ ...f, icon: e.target.value }))}
                className={DS_SELECT}
              >
                {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <select
                value={skillForm.gradient}
                onChange={e => setSkillForm(f => ({ ...f, gradient: e.target.value }))}
                className={`${DS_SELECT} col-span-full sm:col-span-1`}
              >
                {GRADIENT_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <textarea
              value={skillForm.description}
              onChange={e => setSkillForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description…"
              rows={2}
              className={DS_TEXTAREA}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateSkill}
                disabled={isPending || !skillForm.name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-[var(--text-primary)] text-sm font-semibold rounded-lg transition disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Create
              </button>
              <button
                onClick={() => setShowNewSkill(false)}
                className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] text-sm font-medium rounded-lg hover:bg-[var(--bg-elevated)] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Skills List */}
        <div className="space-y-3">
          {skills.length === 0 && (
            <div className="text-center py-16 text-[var(--text-muted)] text-sm bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)]">
              No skills created yet. Click &ldquo;New Skill&rdquo; to get started.
            </div>
          )}

          {skills.map(skill => {
            const isExpanded = expandedSkill === skill.id;
            const skillPlaylists = playlists.filter(p => p.skill_id === skill.id).sort((a, b) => a.sort_order - b.sort_order);
            const skillLessonCount = skillPlaylists.reduce(
              (acc, p) => acc + lessons.filter(l => l.playlist_id === p.id).length, 0,
            );
            const enrolledCount = skillAccessCounts[skill.id] ?? 0;
            const isEditingThis = editingSkillId === skill.id;

            return (
              <div key={skill.id} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-sm">
                {/* Skill Header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[var(--bg-elevated)]/50 transition-colors"
                  onClick={() => !isEditingThis && setExpandedSkill(isExpanded ? null : skill.id)}
                >
                  <button className="text-[var(--text-muted)]">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${skill.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                    <BookOpen className="w-5 h-5 text-[var(--text-primary)]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[var(--text-primary)]">{skill.name}</h4>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">{skill.slug}</span>
                      {!skill.is_active && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded">HIDDEN</span>
                      )}
                    </div>
                    {skill.tagline && <p className="text-xs text-violet-300/90 italic mt-0.5">{skill.tagline}</p>}
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{skill.description || 'No description'}</p>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-[var(--text-muted)] shrink-0">
                    <div className="text-center"><p className="text-sm font-bold text-[var(--text-primary)]">{skillPlaylists.length}</p><p>playlists</p></div>
                    <div className="text-center"><p className="text-sm font-bold text-[var(--text-primary)]">{skillLessonCount}</p><p>lessons</p></div>
                    <div className="text-center"><p className="text-sm font-bold text-[var(--text-primary)]">{enrolledCount}</p><p>students</p></div>
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        if (isEditingThis) {
                          setEditingSkillId(null);
                        } else {
                          setEditingSkillId(skill.id);
                          setEditSkillForm({
                            name: skill.name,
                            tagline: skill.tagline || '',
                            description: skill.description || '',
                            icon: skill.icon,
                            gradient: skill.gradient,
                          });
                        }
                      }}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition"
                      title="Edit skill"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleSkillActive(skill)}
                      title={skill.is_active ? 'Active — click to hide' : 'Hidden — click to activate'}
                      className={`p-1.5 rounded-lg transition ${skill.is_active ? 'text-emerald-400 hover:bg-emerald-500/15' : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'}`}
                    >
                      {skill.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteSkill(skill)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Skill Edit */}
                {isEditingThis && (
                  <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-4 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input value={editSkillForm.name} onChange={e => setEditSkillForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className={DS_INPUT} />
                      <input value={editSkillForm.tagline} onChange={e => setEditSkillForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Tagline" className={DS_INPUT} />
                      <select value={editSkillForm.icon} onChange={e => setEditSkillForm(f => ({ ...f, icon: e.target.value }))} className={DS_SELECT}>
                        {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                      <select value={editSkillForm.gradient} onChange={e => setEditSkillForm(f => ({ ...f, gradient: e.target.value }))} className={DS_SELECT}>
                        {GRADIENT_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                    <textarea value={editSkillForm.description} onChange={e => setEditSkillForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className={DS_TEXTAREA} />
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveSkillEdit(skill)} disabled={isPending} className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-500 transition disabled:opacity-50">
                        <Save className="w-4 h-4" /> Save
                      </button>
                      <button onClick={() => setEditingSkillId(null)} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] rounded-lg transition">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Expanded: Playlists + Lessons */}
                {isExpanded && (
                  <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Playlists</p>
                      <button
                        onClick={() => {
                          setNewPlaylistSkillId(newPlaylistSkillId === skill.id ? null : skill.id);
                          setPlaylistForm({ title: '', description: '' });
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Playlist
                      </button>
                    </div>

                    {/* New Playlist Form */}
                    {newPlaylistSkillId === skill.id && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-2">
                        <input
                          value={playlistForm.title}
                          onChange={e => setPlaylistForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="Playlist title (e.g. Getting Started)"
                          className={DS_INPUT_BLUE}
                          autoFocus
                        />
                        <input
                          value={playlistForm.description}
                          onChange={e => setPlaylistForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Description (optional)"
                          className={DS_INPUT_BLUE}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCreatePlaylist(skill.id)}
                            disabled={isPending || !playlistForm.title.trim()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-[var(--text-primary)] text-xs font-semibold rounded-lg transition disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Create
                          </button>
                          <button onClick={() => setNewPlaylistSkillId(null)} className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] rounded-lg transition">Cancel</button>
                        </div>
                      </div>
                    )}

                    {skillPlaylists.length === 0 && newPlaylistSkillId !== skill.id && (
                      <p className="text-xs text-[var(--text-muted)] py-4 text-center">No playlists yet.</p>
                    )}

                    {skillPlaylists.map((playlist, pi) => {
                      const isPlaylistExpanded = expandedPlaylist === playlist.id;
                      const playlistLessons = lessons.filter(l => l.playlist_id === playlist.id).sort((a, b) => a.sort_order - b.sort_order);
                      const isEditingPl = editingPlaylistId === playlist.id;

                      return (
                        <div key={playlist.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                          {/* Playlist header */}
                          <div
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--bg-elevated)]/50 transition-colors"
                            onClick={() => !isEditingPl && setExpandedPlaylist(isPlaylistExpanded ? null : playlist.id)}
                          >
                            <button className="text-[var(--text-muted)]">
                              {isPlaylistExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                            <Layers className="w-4 h-4 text-blue-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--text-primary)]">{playlist.title}</p>
                              {playlist.description && <p className="text-xs text-[var(--text-muted)] truncate">{playlist.description}</p>}
                            </div>
                            <span className="text-xs text-[var(--text-muted)] font-mono">{playlistLessons.length} lessons</span>

                            {/* Playlist actions */}
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button onClick={() => movePlaylist(skill.id, playlist.id, -1)} disabled={pi === 0} className="p-1 rounded text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition disabled:opacity-30" title="Move up">
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => movePlaylist(skill.id, playlist.id, 1)} disabled={pi === skillPlaylists.length - 1} className="p-1 rounded text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition disabled:opacity-30" title="Move down">
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (isEditingPl) { setEditingPlaylistId(null); }
                                  else { setEditingPlaylistId(playlist.id); setEditPlaylistForm({ title: playlist.title, description: playlist.description || '' }); }
                                }}
                                className="p-1 rounded text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeletePlaylist(playlist)} className="p-1 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Inline Playlist Edit */}
                          {isEditingPl && (
                            <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 space-y-2">
                              <input value={editPlaylistForm.title} onChange={e => setEditPlaylistForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" className={DS_INPUT_BLUE} />
                              <input value={editPlaylistForm.description} onChange={e => setEditPlaylistForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className={DS_INPUT_BLUE} />
                              <div className="flex gap-2">
                                <button onClick={() => handleSavePlaylistEdit(playlist)} disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-[var(--text-primary)] text-xs font-semibold rounded-lg transition disabled:opacity-50"><Save className="w-3.5 h-3.5" /> Save</button>
                                <button onClick={() => setEditingPlaylistId(null)} className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] rounded-lg transition">Cancel</button>
                              </div>
                            </div>
                          )}

                          {/* Lessons */}
                          {isPlaylistExpanded && (
                            <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Lessons</p>
                                <button
                                  onClick={() => openCreateLessonModal(playlist.id)}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 transition"
                                >
                                  <Plus className="w-3 h-3" /> Add Lesson
                                </button>
                              </div>

                              {playlistLessons.length === 0 && (
                                <p className="text-xs text-[var(--text-muted)] py-3 text-center">No lessons yet.</p>
                              )}

                              {playlistLessons.map((lesson, li) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg group hover:border-[var(--border-color)] transition"
                                >
                                  {/* Order number */}
                                  <span className="text-xs font-bold text-[var(--text-muted)] w-5 text-right tabular-nums">{li + 1}</span>

                                  {lesson.video_url ? (
                                    <Video className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[var(--text-primary)] truncate">{lesson.title}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                      {lesson.duration && <span className="text-[10px] text-[var(--text-muted)]">{lesson.duration}</span>}
                                      {lesson.is_free && <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-1 py-0.5 rounded">FREE</span>}
                                      {resourceBadges(lesson).map(b => (
                                        <span key={b.label} className={`text-[10px] font-semibold px-1 py-0.5 rounded ${b.color}`}>{b.label}</span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Lesson actions */}
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => moveLesson(playlist.id, lesson.id, -1)} disabled={li === 0} className="p-1 rounded text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition disabled:opacity-30" title="Move up">
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => moveLesson(playlist.id, lesson.id, 1)} disabled={li === playlistLessons.length - 1} className="p-1 rounded text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition disabled:opacity-30" title="Move down">
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => openEditLessonModal(lesson)} className="p-1 rounded text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition" title="Edit">
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleToggleLessonFree(lesson)}
                                      title={lesson.is_free ? 'Free — click to lock' : 'Locked — click to make free'}
                                      className={`p-1 rounded transition ${lesson.is_free ? 'text-emerald-400 hover:bg-emerald-500/15' : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'}`}
                                    >
                                      {lesson.is_free ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLesson(lesson)}
                                      className="p-1 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ ADD / EDIT LESSON MODAL ═══ */}
      {lessonModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { if (!isSavingLesson) closeLessonModal(); }}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="relative bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--border-color)]">
            {/* Header */}
            <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {lessonModal.mode === 'create' ? 'Add New Lesson' : 'Edit Lesson'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Fill in the fields that match your content tabs.</p>
              </div>
              <button
                type="button"
                onClick={() => { if (!isSavingLesson) closeLessonModal(); }}
                disabled={isSavingLesson}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <fieldset disabled={isSavingLesson} className="px-6 py-5 space-y-5 border-0 min-w-0 block">
              {/* Title + Duration */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Lesson Title *</label>
                  <input
                    ref={lessonTitleInputRef}
                    value={lessonForm.title}
                    onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Color Theory Essentials"
                    className="w-full px-3 py-2.5 text-sm border border-[var(--border-color)] rounded-xl bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none"
                    autoFocus={lessonModal.mode === 'create'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Duration</label>
                  <input
                    value={lessonForm.duration}
                    onChange={e => setLessonForm(f => ({ ...f, duration: e.target.value }))}
                    placeholder="e.g. 12:30"
                    className="w-full px-3 py-2.5 text-sm border border-[var(--border-color)] rounded-xl bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none"
                  />
                </div>
              </div>

              {/* Video URL with preview */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  <Play className="w-3.5 h-3.5 text-red-500" /> Video URL (YouTube)
                </label>
                <input
                  value={lessonForm.video_url}
                  onChange={e => setLessonForm(f => ({ ...f, video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2.5 text-sm font-mono border border-[var(--border-color)] rounded-xl bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-red-300 focus:border-red-300 outline-none"
                />
                {ytPreviewId && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-[var(--border-color)] bg-black aspect-video max-w-xs">
                    <img
                      src={`https://img.youtube.com/vi/${ytPreviewId}/mqdefault.jpg`}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Resource files — 2-column grid */}
              <div className="border-t border-[var(--border-subtle)] pt-4">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Lesson Resources</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <UploadableField
                    label="Lesson Notes (PDF/Image)"
                    icon={<FileDown className="w-3.5 h-3.5 text-blue-500" />}
                    value={lessonForm.notes_url}
                    onChange={(v) => setLessonForm(f => ({ ...f, notes_url: v }))}
                    placeholder="https://drive.google.com/..."
                    ringColor="focus:ring-blue-300"
                    folder="notes"
                    accept="application/pdf,image/*"
                  />
                  <UploadableField
                    label="Practice Exercises (PDF/Image)"
                    icon={<PenLine className="w-3.5 h-3.5 text-amber-500" />}
                    value={lessonForm.exercises_url}
                    onChange={(v) => setLessonForm(f => ({ ...f, exercises_url: v }))}
                    placeholder="https://drive.google.com/..."
                    ringColor="focus:ring-amber-300"
                    folder="exercises"
                    accept="application/pdf,image/*"
                  />
                  <UploadableField
                    label="Cheat Sheet (Image/PDF)"
                    icon={<Image className="w-3.5 h-3.5 text-purple-500" />}
                    value={lessonForm.cheatsheet_url}
                    onChange={(v) => setLessonForm(f => ({ ...f, cheatsheet_url: v }))}
                    placeholder="https://..."
                    ringColor="focus:ring-purple-300"
                    folder="cheatsheets"
                    accept="image/*,application/pdf"
                  />
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-1">
                      <BrainCircuit className="w-3.5 h-3.5 text-emerald-500" /> Interactive Quiz (Link)
                    </label>
                    <input
                      value={lessonForm.quiz_url}
                      onChange={e => setLessonForm(f => ({ ...f, quiz_url: e.target.value }))}
                      placeholder="https://quiz.examstitch.com/..."
                      className="w-full px-3 py-2.5 text-sm font-mono border border-[var(--border-color)] rounded-xl bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-emerald-300 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Legacy resource_url */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  <ExternalLink className="w-3.5 h-3.5 text-green-500" /> General Resource URL (optional)
                </label>
                <input
                  value={lessonForm.resource_url}
                  onChange={e => setLessonForm(f => ({ ...f, resource_url: e.target.value }))}
                  placeholder="Any additional resource link"
                  className="w-full px-3 py-2.5 text-sm font-mono border border-[var(--border-color)] rounded-xl bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-green-300 outline-none"
                />
              </div>

              {/* Free preview toggle */}
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={lessonForm.is_free}
                  onChange={e => setLessonForm(f => ({ ...f, is_free: e.target.checked }))}
                  className="rounded border-[var(--border-color)] bg-[var(--bg-card)] text-emerald-500 focus:ring-emerald-500"
                />
                <span className="font-medium">Free Preview</span>
                <span className="text-xs text-[var(--text-muted)]">— available without enrollment</span>
              </label>
            </fieldset>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] px-6 py-4 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { if (!isSavingLesson) closeLessonModal(); }}
                  disabled={isSavingLesson}
                  className="px-5 py-2.5 text-sm font-medium text-[var(--text-muted)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] rounded-xl transition disabled:opacity-50"
                >
                  Cancel
                </button>
                {lessonModal.mode === 'create' && (
                  <button
                    type="button"
                    onClick={() => { if (!isSavingLesson) closeLessonModal(); }}
                    disabled={isSavingLesson}
                    className="px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] border border-[var(--border-color)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] rounded-xl transition disabled:opacity-50"
                  >
                    Done
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleSubmitLesson}
                disabled={isSavingLesson || !lessonForm.title.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {isSavingLesson ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    {lessonModal.mode === 'create' ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {lessonModal.mode === 'create' ? 'Add Lesson' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
