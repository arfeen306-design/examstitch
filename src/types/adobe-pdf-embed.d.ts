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
}

export interface AdobeViewInstance {
  previewFile(
    descriptor: {
      content: { location: { url: string } };
      metaData: { fileName: string };
    },
    config: AdobePreviewFileConfig,
  ): Promise<unknown>;
}

export interface AdobeDCViewConstructor {
  new (options: { clientId: string; divId: string }): AdobeViewInstance;
}

declare global {
  interface Window {
    AdobeDC?: {
      View: AdobeDCViewConstructor;
    };
  }
}

export {};
