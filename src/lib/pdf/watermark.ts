/**
 * src/lib/pdf/watermark.ts
 *
 * Applies two layers to every page of a PDF:
 *   1. A diagonal "ExamStitch" watermark at 15% opacity.
 *   2. A footer bar with the ExamStitch brand, URL, and WhatsApp number.
 *
 * Usage (server-side only — never import in Client Components):
 *   import { applyWatermark } from '@/lib/pdf/watermark';
 *   const watermarkedBuffer = await applyWatermark(originalBuffer);
 */

import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
  type PDFPage,
  type PDFFont,
} from 'pdf-lib';

// ── Brand constants ────────────────────────────────────────────────────────
const BRAND_NAME      = 'ExamStitch';
const BRAND_URL       = 'www.examstitch.com';
const BRAND_WHATSAPP  = 'WhatsApp: +92 300 509 3306';
const FOOTER_HEIGHT   = 24;           // points
const FOOTER_BG       = rgb(0.067, 0.129, 0.251);  // #112040 — navy brand color
const FOOTER_TEXT     = rgb(1, 1, 1);               // white
const WATERMARK_COLOR = rgb(0.067, 0.129, 0.251);   // navy, then alpha via opacity param
const WATERMARK_ALPHA = 0.15;

// ── Internal helpers ───────────────────────────────────────────────────────

function drawDiagonalWatermark(page: PDFPage, font: PDFFont): void {
  const { width, height } = page.getSize();

  // Choose font size proportional to the shorter side so it spans the page
  const shortSide = Math.min(width, height);
  const fontSize = Math.round(shortSide * 0.12);

  // Measure text so we can perfectly center it
  const textWidth  = font.widthOfTextAtSize(BRAND_NAME, fontSize);
  const textHeight = font.heightAtSize(fontSize);

  const x = (width  - textWidth)  / 2;
  const y = (height - textHeight) / 2;

  page.drawText(BRAND_NAME, {
    x,
    y,
    size:     fontSize,
    font,
    color:    WATERMARK_COLOR,
    opacity:  WATERMARK_ALPHA,
    rotate:   degrees(35),      // diagonal, matching ExamSolutions aesthetic
  });
}

function drawFooter(page: PDFPage, boldFont: PDFFont, regularFont: PDFFont): void {
  const { width } = page.getSize();

  // Footer background strip
  page.drawRectangle({
    x:      0,
    y:      0,
    width,
    height: FOOTER_HEIGHT,
    color:  FOOTER_BG,
    opacity: 1,
  });

  // Left section: "✦ ExamStitch" (logo substitute — bold)
  const brandFontSize = 8;
  page.drawText(`✦ ${BRAND_NAME}`, {
    x:      10,
    y:      7,
    size:   brandFontSize,
    font:   boldFont,
    color:  FOOTER_TEXT,
    opacity: 1,
  });

  // Center section: URL
  const urlFontSize  = 7.5;
  const urlTextWidth = regularFont.widthOfTextAtSize(BRAND_URL, urlFontSize);
  page.drawText(BRAND_URL, {
    x:      (width - urlTextWidth) / 2,
    y:      7,
    size:   urlFontSize,
    font:   regularFont,
    color:  FOOTER_TEXT,
    opacity: 1,
  });

  // Right section: WhatsApp number
  const wFontSize  = 7;
  const wTextWidth = regularFont.widthOfTextAtSize(BRAND_WHATSAPP, wFontSize);
  page.drawText(BRAND_WHATSAPP, {
    x:      width - wTextWidth - 10,
    y:      8,
    size:   wFontSize,
    font:   regularFont,
    color:  FOOTER_TEXT,
    opacity: 1,
  });
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Load a PDF from a buffer, stamp every page with the ExamStitch watermark
 * and footer, and return the modified PDF as a Uint8Array.
 *
 * @param pdfBuffer - Raw PDF bytes (Buffer, ArrayBuffer, or Uint8Array).
 * @returns Modified PDF as a Uint8Array ready to stream or save.
 */
export async function applyWatermark(
  pdfBuffer: ArrayBuffer | Uint8Array | Buffer,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, {
    // Ignore minor spec deviations common in scan-generated PDFs
    ignoreEncryption: false,
    updateMetadata:   true,
  });

  // Embed fonts once and reuse across all pages
  const boldFont    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  for (const page of pages) {
    drawDiagonalWatermark(page, boldFont);
    drawFooter(page, boldFont, regularFont);
  }

  // Update PDF metadata
  pdfDoc.setAuthor(BRAND_NAME);
  pdfDoc.setCreator(BRAND_NAME);
  pdfDoc.setProducer(`${BRAND_NAME} — ${BRAND_URL}`);

  return pdfDoc.save();
}

/**
 * Convenience wrapper: accepts a URL, fetches the PDF, watermarks it,
 * and returns the modified bytes. Useful in Route Handlers or Server Actions.
 *
 * @param url - Direct URL to a PDF (e.g. a Google Drive export link).
 */
export async function fetchAndWatermark(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return applyWatermark(buffer);
}
