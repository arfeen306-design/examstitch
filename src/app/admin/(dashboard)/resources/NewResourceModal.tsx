import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { X, PlayCircle, FileText, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Category {
  id: string;
  name: string;
  subject_id: string;
  subject: { name: string; code: string };
}

type ModuleType = 'video_topical' | 'solved_past_paper';

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
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [moduleType, setModuleType] = useState<ModuleType>('video_topical');
  const [keepOpen, setKeepOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    subject: 'mathematics-9709',
    category_id: '',
    paper: '',
    year: new Date().getFullYear().toString(),
    video_url: '',
    worksheet_url: '',
    solution_url: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    const fetchCategories = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase.from('categories').select('*, subject:subjects(name, code)');
      if (data) setCategories(data as any[]);
    };
    fetchCategories();
    // Auto-focus the title field when modal opens
    setTimeout(() => titleRef.current?.focus(), 80);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.category_id) {
      showToast({ message: 'Please select a Target Module.', type: 'error' });
      setLoading(false);
      return;
    }

    const validateUrl = (url: string) => {
      if (!url) return true;
      return /^https?:\/\/(drive\.google\.com|youtu\.be|www\.youtube\.com)\/.+/.test(url);
    };

    const richTitle = `${formData.title} ${formData.year ? `(${formData.year})` : ''} ${formData.paper ? `P${formData.paper}` : ''}`.trim();

    const payloads = [];

    if (moduleType === 'video_topical') {
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
        subject: formData.subject,
        category_id: formData.category_id,
        source_url: formData.video_url,
        worksheet_url: formData.worksheet_url || null,
        source_type: 'youtube',
        content_type: 'video',
        module_type: 'video_topical',
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
          subject: formData.subject,
          category_id: formData.category_id,
          source_url: formData.video_url,
          worksheet_url: formData.solution_url,
          source_type: 'youtube',
          content_type: 'video',
          module_type: 'solved_past_paper',
          is_published: true,
          is_locked: false,
          is_watermarked: false,
        });
      } else {
        payloads.push({
          title: richTitle,
          subject: formData.subject,
          category_id: formData.category_id,
          source_url: formData.solution_url,
          source_type: 'google_drive',
          content_type: 'pdf',
          module_type: 'solved_past_paper',
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
          // Clear only the URL fields — keep subject, category, module type
          setFormData(prev => ({ ...prev, title: '', video_url: '', worksheet_url: '', solution_url: '', paper: '' }));
          setTimeout(() => titleRef.current?.focus(), 50);
        } else {
          onSuccess();
          setFormData({ ...formData, title: '', video_url: '', worksheet_url: '', solution_url: '', paper: '' });
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

  const subjectCode = formData.subject.split('-')[1];
  const activeCategories = categories.filter(c => c.subject?.code === subjectCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between p-6 border-b border-navy-50 bg-navy-50/50 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-navy-900">Link Teaching Materials</h2>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Module Type Radio Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-400 mb-2">Content Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModuleType('video_topical')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  moduleType === 'video_topical'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-navy-100 text-navy-500 hover:border-navy-200'
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
                onClick={() => setModuleType('solved_past_paper')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  moduleType === 'solved_past_paper'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-navy-100 text-navy-500 hover:border-navy-200'
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
            <div className="col-span-2">
              <label className="block text-sm font-medium text-navy-700 mb-1">
                {moduleType === 'video_topical' ? 'Topic Name' : 'Paper Title'}
              </label>
              <input
                ref={titleRef}
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500"
                placeholder={moduleType === 'video_topical' ? 'e.g. Differentiation Rules' : 'e.g. May/June 2024 V1'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Subject</label>
              <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value, category_id: '' })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500">
                <option value="mathematics-4024">O-Level / IGCSE (4024/0580)</option>
                <option value="mathematics-9709">A-Level (9709)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Target Module</label>
              <select required value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500">
                <option value="" disabled>Select mapping...</option>
                {activeCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {moduleType === 'solved_past_paper' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Paper # (Optional)</label>
                  <input value={formData.paper} onChange={e => setFormData({ ...formData, paper: e.target.value })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500" placeholder="e.g. 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Year (Optional)</label>
                  <input value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-gold-500 focus:border-gold-500" placeholder="e.g. 2024" />
                </div>
              </>
            )}

            {/* Dynamic Link Inputs */}
            <div className="col-span-2 pt-2 border-t border-navy-50">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-400 mb-3">
                {moduleType === 'video_topical' ? 'Resource Links' : 'PDF Solution Link'}
              </label>
              
              <div className="space-y-3">
                {moduleType === 'video_topical' ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-red-600 mb-1">YouTube Video Link *</label>
                      <input required value={formData.video_url} onChange={e => setFormData({ ...formData, video_url: e.target.value })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-red-500 focus:border-red-500 font-mono text-sm" placeholder="https://www.youtube.com/watch?v=..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-600 mb-1">Worksheet Drive Link (Optional)</label>
                      <input value={formData.worksheet_url} onChange={e => setFormData({ ...formData, worksheet_url: e.target.value })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-green-500 focus:border-green-500 font-mono text-sm" placeholder="https://drive.google.com/file/d/..." />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-blue-600 mb-1">PDF Solution Link *</label>
                      <input required value={formData.solution_url} onChange={e => setFormData({ ...formData, solution_url: e.target.value })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm" placeholder="https://drive.google.com/file/d/..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-red-600 mb-1">YouTube Video Walkthrough (Optional)</label>
                      <input value={formData.video_url} onChange={e => setFormData({ ...formData, video_url: e.target.value })} className="w-full px-3 py-2 border border-navy-100 rounded-lg focus:ring-red-500 focus:border-red-500 font-mono text-sm" placeholder="https://www.youtube.com/watch?v=..." />
                      <p className="text-[10px] text-navy-400 mt-1">Adding a video enables the Interactive Solver (split-screen PDF + Video)</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-navy-50 mt-6 sticky bottom-0 bg-white">
            <label className="flex items-center gap-2 text-sm text-navy-500 cursor-pointer select-none">
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
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 rounded-lg transition">Cancel</button>
              <button type="submit" disabled={loading} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 ${
                moduleType === 'video_topical' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'
              }`}>
                {loading ? 'Processing...' : keepOpen ? '✓ Save & Next' : moduleType === 'video_topical' ? 'Link Video + Topical' : 'Link Past Paper'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
