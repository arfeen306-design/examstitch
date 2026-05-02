// Ambient declarations — this file MUST NOT have any top-level import/export
// or it becomes a module and the `declare module '*.css'` block will only
// apply to importers (breaking side-effect imports like `import './x.css'`).

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// ── YouTube IFrame API ──────────────────────────────────────────────────────
// Centralised shape for `window.YT` so multiple components (MediaFrame,
// EmbeddedViewer, InteractiveSolver, DualMediaViewer) don't each redeclare
// it with a different type and trigger TS2717 errors. Phase 3, Finding C-17.
interface YouTubeIframePlayer {
  destroy?: () => void;
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo?: () => void;
  pauseVideo?: () => void;
  getPlayerState?: () => number;
  getCurrentTime?: () => number;
  getDuration?: () => number;
}

interface YouTubeIframeAPI {
  // The constructor accepts either a DOM element or its ID string per the
  // upstream API; HTMLElement | string covers both without resorting to `any`
  // (the project's ESLint config doesn't load @typescript-eslint, so a
  // disable-next-line for that rule itself becomes a build-failing error).
  Player: new (
    target: HTMLElement | string,
    options: Record<string, unknown>,
  ) => YouTubeIframePlayer;
  PlayerState: { PLAYING: number; ENDED: number; PAUSED: number };
}

// Top-level `interface Window` in a script .d.ts merges with lib.dom's Window.
interface Window {
  YT?: YouTubeIframeAPI;
  onYouTubeIframeAPIReady?: () => void;
}
