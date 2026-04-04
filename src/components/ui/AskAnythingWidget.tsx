'use client';

import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, GripVertical, ExternalLink, Loader2 } from 'lucide-react';

// ── AI Provider Config ──────────────────────────────────────────────────────
const PROVIDERS = [
  {
    id: 'desmos',
    label: 'Calculator',
    url: 'https://www.desmos.com/scientific',
    icon: '🧮',
    accent: 'from-emerald-500 to-teal-400',
    ring: 'ring-teal-400/30',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    icon: '🐋',
    accent: 'from-blue-500 to-cyan-400',
    ring: 'ring-cyan-400/30',
  },
  {
    id: 'qwen',
    label: 'Qwen',
    url: 'https://tongyi.aliyun.com/qianwen/',
    icon: '🔮',
    accent: 'from-violet-500 to-fuchsia-400',
    ring: 'ring-fuchsia-400/30',
  },
] as const;

type ProviderId = (typeof PROVIDERS)[number]['id'];

// ── Size constraints ────────────────────────────────────────────────────────
const MIN_W = 380;
const MIN_H = 420;
const DEFAULT_W = 440;
const DEFAULT_H = 560;

// ── FAB Button ──────────────────────────────────────────────────────────────
const Fab = memo(function Fab({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="group relative w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center
                 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600
                 hover:from-violet-500 hover:via-indigo-500 hover:to-blue-500
                 transition-shadow duration-300 hover:shadow-[0_8px_40px_rgba(99,102,241,0.45)]"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      aria-label="Ask Anything — Open AI Assistant"
    >
      {/* Outer glow ring */}
      <span className="absolute inset-0 rounded-2xl ring-2 ring-indigo-400/20 group-hover:ring-indigo-400/40 transition-all" />
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-indigo-400" style={{ animationDuration: '2.5s' }} />
      <Sparkles className="w-6 h-6 text-white drop-shadow-lg relative z-10" />
    </motion.button>
  );
});

// ── Tab Bar ─────────────────────────────────────────────────────────────────
const TabBar = memo(function TabBar({
  active,
  onSwitch,
}: {
  active: ProviderId;
  onSwitch: (id: ProviderId) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-white/[0.06] border border-white/[0.08]">
      {PROVIDERS.map((p) => {
        const isActive = active === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSwitch(p.id)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'text-white shadow-lg'
                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className={`absolute inset-0 rounded-lg bg-gradient-to-r ${p.accent} opacity-90`}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 text-sm">{p.icon}</span>
            <span className="relative z-10">{p.label}</span>
          </button>
        );
      })}
    </div>
  );
});

// ── Iframe with loading state + X-Frame-Options fallback ────────────────────
const AiFrame = memo(function AiFrame({
  url,
  providerId,
  visible,
}: {
  url: string;
  providerId: string;
  visible: boolean;
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'blocked'>('loading');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Reset on URL change
    setStatus('loading');

    // Fallback timer — if iframe doesn't signal load in 6s, assume blocked
    timerRef.current = setTimeout(() => {
      setStatus((prev) => (prev === 'loading' ? 'blocked' : prev));
    }, 6000);

    return () => clearTimeout(timerRef.current);
  }, [url]);

  const handleLoad = useCallback(() => {
    clearTimeout(timerRef.current);
    setStatus('ready');
  }, []);

  const handleError = useCallback(() => {
    clearTimeout(timerRef.current);
    setStatus('blocked');
  }, []);

  return (
    <div
      className="absolute inset-0"
      style={{ display: visible ? 'block' : 'none' }}
    >
      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30 backdrop-blur-sm z-10">
          <Loader2 className="w-6 h-6 text-white/70 animate-spin" />
          <p className="text-xs text-white/50 font-medium">
            Loading {providerId}...
          </p>
        </div>
      )}

      {/* Blocked fallback */}
      {status === 'blocked' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm z-10 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
            <ExternalLink className="w-6 h-6 text-white/50" />
          </div>
          <p className="text-sm text-white/70 font-medium max-w-[260px]">
            This provider blocks embedded access.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white
                       bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400
                       shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open {providerId} in New Tab
          </a>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={url}
        onLoad={handleLoad}
        onError={handleError}
        title={`${providerId} AI Assistant`}
        className="w-full h-full border-0 rounded-b-2xl bg-[#111]"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        allow="clipboard-write"
      />
    </div>
  );
});

// ── Main Widget ─────────────────────────────────────────────────────────────
export default function AskAnythingWidget() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProviderId>('desmos');

  // ── Dragging state ──────────────────────────────────────────────────────
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const dragging = useRef(false);
  const resizing = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Initialize position to bottom-right on first open
  const initialized = useRef(false);
  useEffect(() => {
    if (open && !initialized.current) {
      initialized.current = true;
      setPos({
        x: window.innerWidth - DEFAULT_W - 24,
        y: window.innerHeight - DEFAULT_H - 90,
      });
    }
  }, [open]);

  // ── Drag handlers ───────────────────────────────────────────────────────
  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    },
    [pos],
  );

  // ── Resize handlers ─────────────────────────────────────────────────────
  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizing.current = true;
      resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };
    },
    [size],
  );

  // Unified mousemove/mouseup at document level
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (dragging.current) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - size.w));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 60));
        setPos({ x: newX, y: newY });
      }
      if (resizing.current) {
        const dw = e.clientX - resizeStart.current.x;
        const dh = e.clientY - resizeStart.current.y;
        setSize({
          w: Math.max(MIN_W, resizeStart.current.w + dw),
          h: Math.max(MIN_H, resizeStart.current.h + dh),
        });
      }
    }
    function onUp() {
      dragging.current = false;
      resizing.current = false;
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [size.w]);

  // Prevent iframe from capturing mouse during drag/resize
  const interacting = dragging.current || resizing.current;

  const activeProvider = PROVIDERS.find((p) => p.id === activeTab)!;

  return (
    <>
      {/* ── FAB ── */}
      <div className="fixed bottom-6 right-6 z-[9998]">
        <AnimatePresence>
          {!open && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            >
              <Fab onClick={() => setOpen(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modal Window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 60 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed z-[9999] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{
              left: pos.x,
              top: pos.y,
              width: size.w,
              height: size.h,
              background: 'linear-gradient(145deg, rgba(15,15,30,0.92) 0%, rgba(10,10,25,0.96) 100%)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 60px rgba(99,102,241,0.08)',
            }}
          >
            {/* ── Title bar (draggable) ── */}
            <div
              onMouseDown={onDragStart}
              className="shrink-0 flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing select-none
                         border-b border-white/[0.06]"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <GripVertical className="w-3.5 h-3.5 text-white/20" />
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${activeProvider.accent} flex items-center justify-center shadow-lg`}>
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[13px] font-semibold text-white/80 tracking-tight">
                    Ask Anything
                  </span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                           text-white/30 hover:text-white/80 hover:bg-white/[0.08]
                           transition-all duration-150"
                aria-label="Close AI Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Tab bar ── */}
            <div className="shrink-0 px-3 py-2.5">
              <TabBar active={activeTab} onSwitch={setActiveTab} />
            </div>

            {/* ── Iframe container ── */}
            <div className="relative flex-1 min-h-0">
              {/* Invisible overlay during drag/resize so iframe doesn't steal mouse */}
              {interacting && (
                <div className="absolute inset-0 z-20" />
              )}
              {PROVIDERS.map((p) => (
                <AiFrame
                  key={p.id}
                  url={p.url}
                  providerId={p.label}
                  visible={activeTab === p.id}
                />
              ))}
            </div>

            {/* ── Resize handle (bottom-right corner) ── */}
            <div
              onMouseDown={onResizeStart}
              className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-30 group"
              aria-label="Resize"
            >
              <svg
                className="w-3 h-3 absolute bottom-1 right-1 text-white/15 group-hover:text-white/40 transition-colors"
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="6" cy="10" r="1.5" />
                <circle cx="10" cy="6" r="1.5" />
                <circle cx="2" cy="10" r="1.5" />
                <circle cx="10" cy="2" r="1.5" />
                <circle cx="6" cy="6" r="1.5" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
