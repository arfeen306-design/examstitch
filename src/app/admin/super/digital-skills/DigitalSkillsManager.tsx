'use client';

import { useState, useTransition } from 'react';
import {
  createSkill, updateSkill, deleteSkill,
  createPlaylist, updatePlaylist, deletePlaylist,
  createLesson, updateLesson, deleteLesson,
} from './actions';
import {
  Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronRight,
  GripVertical, Video, FileText, Eye, EyeOff, Layers, BookOpen,
  Users, Sparkles, ListVideo,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SkillRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
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

// Available gradient presets
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
  const [newLessonPlaylistId, setNewLessonPlaylistId] = useState<string | null>(null);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Form state
  const [skillForm, setSkillForm] = useState({ name: '', slug: '', icon: 'Code2', description: '', gradient: GRADIENT_PRESETS[0].value });
  const [playlistForm, setPlaylistForm] = useState({ title: '', description: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', video_url: '', resource_url: '', duration: '', is_free: false });

  // ── Skill CRUD ────────────────────────────────────────────────────────────

  const handleCreateSkill = () => {
    startTransition(async () => {
      const preset = GRADIENT_PRESETS.find(p => p.value === skillForm.gradient) || GRADIENT_PRESETS[0];
      const result = await createSkill({
        name: skillForm.name,
        slug: skillForm.slug || skillForm.name.toLowerCase().replace(/\s+/g, '-'),
        icon: skillForm.icon,
        description: skillForm.description || undefined,
        gradient: preset.value,
        glow_color: preset.glow,
      });
      if (result.success) {
        showToast({ message: 'Skill created!', type: 'success' });
        setShowNewSkill(false);
        setSkillForm({ name: '', slug: '', icon: 'Code2', description: '', gradient: GRADIENT_PRESETS[0].value });
        window.location.reload();
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
      if (result.success) {
        showToast({ message: 'Playlist created!', type: 'success' });
        setNewPlaylistSkillId(null);
        setPlaylistForm({ title: '', description: '' });
        window.location.reload();
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

  // ── Lesson CRUD ───────────────────────────────────────────────────────────

  const handleCreateLesson = (playlistId: string) => {
    startTransition(async () => {
      const result = await createLesson({
        playlist_id: playlistId,
        title: lessonForm.title,
        video_url: lessonForm.video_url || undefined,
        resource_url: lessonForm.resource_url || undefined,
        duration: lessonForm.duration || undefined,
        is_free: lessonForm.is_free,
      });
      if (result.success) {
        showToast({ message: 'Lesson added!', type: 'success' });
        setNewLessonPlaylistId(null);
        setLessonForm({ title: '', video_url: '', resource_url: '', duration: '', is_free: false });
        window.location.reload();
      } else {
        showToast({ message: result.error || 'Failed', type: 'error' });
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

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalLessons = lessons.length;
  const totalPlaylists = playlists.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Skills', value: skills.length, icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Playlists', value: totalPlaylists, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Lessons', value: totalLessons, icon: ListVideo, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Enrolled', value: Object.values(skillAccessCounts).reduce((a, b) => a + b, 0), icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* New Skill Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Skill Tracks</h3>
        <button
          onClick={() => setShowNewSkill(!showNewSkill)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Skill
        </button>
      </div>

      {/* New Skill Form */}
      {showNewSkill && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-bold text-violet-800">Create New Skill</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={skillForm.name}
              onChange={e => setSkillForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
              placeholder="Skill name (e.g. Web Development)"
              className="px-3 py-2 text-sm border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-400 outline-none"
            />
            <input
              value={skillForm.slug}
              onChange={e => setSkillForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="Slug (auto-generated)"
              className="px-3 py-2 text-sm font-mono border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-400 outline-none"
            />
            <select
              value={skillForm.icon}
              onChange={e => setSkillForm(f => ({ ...f, icon: e.target.value }))}
              className="px-3 py-2 text-sm border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-400 outline-none"
            >
              {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <select
              value={skillForm.gradient}
              onChange={e => setSkillForm(f => ({ ...f, gradient: e.target.value }))}
              className="px-3 py-2 text-sm border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-400 outline-none"
            >
              {GRADIENT_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <textarea
            value={skillForm.description}
            onChange={e => setSkillForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Short description…"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-400 outline-none resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateSkill}
              disabled={isPending || !skillForm.name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Create
            </button>
            <button
              onClick={() => setShowNewSkill(false)}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Skills List */}
      <div className="space-y-3">
        {skills.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
            No skills created yet. Click &ldquo;New Skill&rdquo; to get started.
          </div>
        )}

        {skills.map(skill => {
          const isExpanded = expandedSkill === skill.id;
          const skillPlaylists = playlists.filter(p => p.skill_id === skill.id);
          const skillLessonCount = skillPlaylists.reduce(
            (acc, p) => acc + lessons.filter(l => l.playlist_id === p.id).length,
            0,
          );
          const enrolledCount = skillAccessCounts[skill.id] ?? 0;

          return (
            <div key={skill.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {/* Skill Header */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedSkill(isExpanded ? null : skill.id)}
              >
                <button className="text-gray-400">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {/* Gradient badge */}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${skill.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                  <BookOpen className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900">{skill.name}</h4>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{skill.slug}</span>
                    {!skill.is_active && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">HIDDEN</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{skill.description || 'No description'}</p>
                </div>

                <div className="flex items-center gap-6 text-xs text-gray-500 shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900">{skillPlaylists.length}</p>
                    <p>playlists</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900">{skillLessonCount}</p>
                    <p>lessons</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900">{enrolledCount}</p>
                    <p>students</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleToggleSkillActive(skill)}
                    title={skill.is_active ? 'Active — click to hide' : 'Hidden — click to activate'}
                    className={`p-1.5 rounded-lg transition ${skill.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    {skill.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteSkill(skill)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded: Playlists + Lessons */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/30 px-5 py-4 space-y-3">
                  {/* Add playlist button */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Playlists</p>
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
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                      <input
                        value={playlistForm.title}
                        onChange={e => setPlaylistForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Playlist title (e.g. Getting Started)"
                        className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                        autoFocus
                      />
                      <input
                        value={playlistForm.description}
                        onChange={e => setPlaylistForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCreatePlaylist(skill.id)}
                          disabled={isPending || !playlistForm.title.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> Create
                        </button>
                        <button onClick={() => setNewPlaylistSkillId(null)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Playlist items */}
                  {skillPlaylists.length === 0 && newPlaylistSkillId !== skill.id && (
                    <p className="text-xs text-gray-400 py-4 text-center">No playlists yet.</p>
                  )}

                  {skillPlaylists.map(playlist => {
                    const isPlaylistExpanded = expandedPlaylist === playlist.id;
                    const playlistLessons = lessons.filter(l => l.playlist_id === playlist.id);

                    return (
                      <div key={playlist.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        {/* Playlist header */}
                        <div
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                          onClick={() => setExpandedPlaylist(isPlaylistExpanded ? null : playlist.id)}
                        >
                          <button className="text-gray-400">
                            {isPlaylistExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                          <Layers className="w-4 h-4 text-blue-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{playlist.title}</p>
                            {playlist.description && <p className="text-xs text-gray-400 truncate">{playlist.description}</p>}
                          </div>
                          <span className="text-xs text-gray-400 font-mono">{playlistLessons.length} lessons</span>
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleDeletePlaylist(playlist)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Lessons */}
                        {isPlaylistExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-3 space-y-2">
                            {/* Add lesson */}
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lessons</p>
                              <button
                                onClick={() => {
                                  setNewLessonPlaylistId(newLessonPlaylistId === playlist.id ? null : playlist.id);
                                  setLessonForm({ title: '', video_url: '', resource_url: '', duration: '', is_free: false });
                                }}
                                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 transition"
                              >
                                <Plus className="w-3 h-3" /> Add Lesson
                              </button>
                            </div>

                            {/* New Lesson Form */}
                            {newLessonPlaylistId === playlist.id && (
                              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                                <div className="grid sm:grid-cols-2 gap-2">
                                  <input
                                    value={lessonForm.title}
                                    onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Lesson title"
                                    className="px-3 py-1.5 text-xs border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
                                    autoFocus
                                  />
                                  <input
                                    value={lessonForm.duration}
                                    onChange={e => setLessonForm(f => ({ ...f, duration: e.target.value }))}
                                    placeholder="Duration (e.g. 12:30)"
                                    className="px-3 py-1.5 text-xs border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
                                  />
                                </div>
                                <input
                                  value={lessonForm.video_url}
                                  onChange={e => setLessonForm(f => ({ ...f, video_url: e.target.value }))}
                                  placeholder="YouTube URL"
                                  className="w-full px-3 py-1.5 text-xs font-mono border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
                                />
                                <input
                                  value={lessonForm.resource_url}
                                  onChange={e => setLessonForm(f => ({ ...f, resource_url: e.target.value }))}
                                  placeholder="Resource URL (PDF, Google Drive — optional)"
                                  className="w-full px-3 py-1.5 text-xs font-mono border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none"
                                />
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={lessonForm.is_free}
                                      onChange={e => setLessonForm(f => ({ ...f, is_free: e.target.checked }))}
                                      className="rounded border-gray-300"
                                    />
                                    Free preview
                                  </label>
                                  <div className="flex gap-2 ml-auto">
                                    <button
                                      onClick={() => handleCreateLesson(playlist.id)}
                                      disabled={isPending || !lessonForm.title.trim()}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                                    >
                                      <Check className="w-3 h-3" /> Add
                                    </button>
                                    <button onClick={() => setNewLessonPlaylistId(null)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Lesson rows */}
                            {playlistLessons.length === 0 && newLessonPlaylistId !== playlist.id && (
                              <p className="text-xs text-gray-400 py-3 text-center">No lessons yet.</p>
                            )}

                            {playlistLessons.map((lesson, li) => (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-100 rounded-lg group hover:border-gray-200 transition"
                              >
                                <span className="text-xs font-bold text-gray-400 w-5 text-right tabular-nums">{li + 1}</span>
                                {lesson.video_url ? (
                                  <Video className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 truncate">{lesson.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {lesson.duration && <span className="text-[10px] text-gray-400">{lesson.duration}</span>}
                                    {lesson.is_free && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">FREE</span>}
                                    {lesson.video_url && <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1 py-0.5 rounded">YT</span>}
                                    {lesson.resource_url && <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1 py-0.5 rounded">PDF</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleToggleLessonFree(lesson)}
                                    title={lesson.is_free ? 'Free preview — click to lock' : 'Locked — click to make free'}
                                    className={`p-1 rounded transition ${lesson.is_free ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                  >
                                    {lesson.is_free ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLesson(lesson)}
                                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
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
  );
}
