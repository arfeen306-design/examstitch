/**
 * Load Adobe PDF Embed API (View SDK) once and wait until ready to construct AdobeDC.View.
 */

const VIEWER_SCRIPT = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';

let scriptLoadPromise: Promise<void> | null = null;

export function loadAdobePdfEmbedScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.AdobeDC?.View) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${VIEWER_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Adobe View SDK script failed')), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = VIEWER_SCRIPT;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Adobe View SDK script failed'));
    document.head.appendChild(s);
  });

  return scriptLoadPromise;
}

/** Fires after SDK is ready to instantiate AdobeDC.View (same as official samples). */
export function whenAdobeViewSdkReady(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    if (window.AdobeDC?.View) {
      resolve();
      return;
    }
    document.addEventListener('adobe_dc_view_sdk.ready', () => resolve(), { once: true });
  });
}

export function sanitizePdfFileName(title: string): string {
  return (
    title
      .replace(/[^a-zA-Z0-9._\-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'document'
  );
}
