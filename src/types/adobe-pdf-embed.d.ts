/**
 * Minimal types for Adobe PDF Embed API (View SDK).
 * @see https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/
 */

export interface AdobePreviewFileConfig {
  embedMode?: 'FULL_WINDOW' | 'SIZED_CONTAINER' | 'IN_LINE' | 'LIGHT_BOX';
  defaultViewMode?: string;
  showDownloadPDF?: boolean;
  showPrintPDF?: boolean;
  showAnnotationTools?: boolean;
  showLeftHandPanel?: boolean;
  enableFormFilling?: boolean;
  /** Prefer progressive / linearized fetch when the PDF supports it */
  enableLinearization?: boolean;
}

export type AdobeSaveApiHandler = (
  metaData: Record<string, unknown>,
  content: unknown,
  options: Record<string, unknown>,
) => Promise<{
  code: number;
  data: { metaData: Record<string, unknown> };
}>;

export interface AdobeViewInstance {
  previewFile(
    descriptor: {
      content: { location: { url: string } };
      metaData: { fileName: string; id?: string };
    },
    config: AdobePreviewFileConfig,
  ): Promise<unknown>;
  registerCallback(
    type: number,
    handler: AdobeSaveApiHandler,
    options: Record<string, unknown>,
  ): void;
}

export interface AdobeDCViewConstructor {
  new (options: { clientId: string; divId: string }): AdobeViewInstance;
  Enum?: {
    CallbackType: { SAVE_API: number };
    ApiResponseCode: { SUCCESS: number };
  };
}

declare global {
  interface Window {
    AdobeDC?: {
      View: AdobeDCViewConstructor;
    };
  }
}

export {};
