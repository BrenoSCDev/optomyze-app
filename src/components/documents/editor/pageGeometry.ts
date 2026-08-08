/**
 * Paper, in one place.
 *
 * The editor canvas and the PDF have to agree about what a page is, or the
 * whole premise ("you are editing the actual document") is a lie. Both are
 * driven from these numbers: the canvas converts them to CSS pixels, the API
 * sends the same millimetres to dompdf's `@page`.
 *
 * Millimetres because that is how paper is specified, and because dompdf
 * accepts mm directly. Pixels are a rendering detail derived at the end, never
 * the source.
 */

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageSettings {
  paper: PaperSize;
  orientation: 'portrait' | 'landscape';
  margins: PageMargins;
  header_offset: number;
  footer_offset: number;
  font_family: string;
  font_size: number;
  line_height: number;
  paragraph_spacing: number;
}

export type PaperSize = 'a4' | 'letter' | 'legal' | 'a3' | 'a5';

/** Width × height in millimetres, portrait. */
export const PAPER_SIZES: Record<PaperSize, { width: number; height: number; label: string }> = {
  a4:     { width: 210, height: 297, label: 'A4' },
  letter: { width: 216, height: 279, label: 'Letter' },
  legal:  { width: 216, height: 356, label: 'Legal' },
  a3:     { width: 297, height: 420, label: 'A3' },
  a5:     { width: 148, height: 210, label: 'A5' },
};

/**
 * Must match DocumentTemplate::DEFAULT_PAGE_SETTINGS on the server.
 *
 * Duplicated deliberately rather than fetched: the editor has to draw a page
 * before any request completes, and a canvas that resizes a moment after it
 * appears reads as a bug.
 */
export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  paper: 'a4',
  orientation: 'portrait',
  margins: { top: 25, right: 20, bottom: 30, left: 20 },
  header_offset: 12,
  footer_offset: 15,
  font_family: 'DejaVu Sans',
  font_size: 11,
  line_height: 1.6,
  paragraph_spacing: 10,
};

/**
 * CSS pixels per millimetre.
 *
 * 96 CSS px per inch is fixed by spec; 25.4 mm per inch is fixed by
 * definition. So this constant is exact, not a calibration — an A4 page drawn
 * at this scale is the same shape as the one dompdf lays out, which is why the
 * editor's page boundaries can be trusted at all.
 */
export const PX_PER_MM = 96 / 25.4;

export const mmToPx = (mm: number): number => mm * PX_PER_MM;

/** Points, for anything that has to line up with the PDF's typography. */
export const mmToPt = (mm: number): number => (mm / 25.4) * 72;

export interface PageBox {
  /** Full paper, in CSS pixels. */
  widthPx: number;
  heightPx: number;
  /** The area text actually flows in, once margins are removed. */
  contentWidthPx: number;
  contentHeightPx: number;
  marginsPx: PageMargins;
}

export function pageBox(settings: PageSettings): PageBox {
  const paper = PAPER_SIZES[settings.paper] ?? PAPER_SIZES.a4;

  const [widthMm, heightMm] =
    settings.orientation === 'landscape'
      ? [paper.height, paper.width]
      : [paper.width, paper.height];

  const marginsPx = {
    top: mmToPx(settings.margins.top),
    right: mmToPx(settings.margins.right),
    bottom: mmToPx(settings.margins.bottom),
    left: mmToPx(settings.margins.left),
  };

  return {
    widthPx: mmToPx(widthMm),
    heightPx: mmToPx(heightMm),
    contentWidthPx: mmToPx(widthMm) - marginsPx.left - marginsPx.right,
    contentHeightPx: mmToPx(heightMm) - marginsPx.top - marginsPx.bottom,
    marginsPx,
  };
}

/** Fill in anything a stored settings object is missing. */
export function withDefaults(partial?: Partial<PageSettings> | null): PageSettings {
  return {
    ...DEFAULT_PAGE_SETTINGS,
    ...(partial ?? {}),
    margins: { ...DEFAULT_PAGE_SETTINGS.margins, ...(partial?.margins ?? {}) },
  };
}

/**
 * Fonts dompdf can actually render.
 *
 * Offering a font the PDF cannot produce is worse than offering fewer: the
 * author would see it in the canvas and the signer would receive something
 * else. DejaVu is the only bundled family with full Latin-1 coverage, which
 * for Portuguese is a correctness requirement, not a preference.
 */
export const AVAILABLE_FONTS = [
  { value: 'DejaVu Sans', label: 'DejaVu Sans', css: '"DejaVu Sans", sans-serif' },
  { value: 'DejaVu Serif', label: 'DejaVu Serif', css: '"DejaVu Serif", serif' },
  { value: 'DejaVu Sans Mono', label: 'DejaVu Sans Mono', css: '"DejaVu Sans Mono", monospace' },
  { value: 'Helvetica', label: 'Helvetica / Arial', css: 'Helvetica, Arial, sans-serif' },
  { value: 'Times', label: 'Times New Roman', css: '"Times New Roman", Times, serif' },
  { value: 'Courier', label: 'Courier New', css: '"Courier New", Courier, monospace' },
];

export const fontCss = (family: string): string =>
  AVAILABLE_FONTS.find((f) => f.value === family)?.css ?? AVAILABLE_FONTS[0].css;
