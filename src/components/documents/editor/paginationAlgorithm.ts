/**
 * Where the page boundaries fall — the arithmetic, with no DOM in it.
 *
 * Both paginators depend on this: PaginationExtension for the editor and
 * paginateStaticHtml for the server-rendered Preview. Sharing the function
 * rather than the intention is what actually keeps them identical; when they
 * were two copies, switching between Edit and Preview could reflow the
 * document, which reads as a bug in both panes.
 *
 * Keeping it free of the DOM is also the only way to test it. Layout cannot be
 * measured in a test environment — jsdom reports every rectangle as zero — so
 * the measurements are the input and the decisions are the output.
 *
 * ## Coordinate space
 *
 * Everything is **page space**: y = 0 is the top edge of sheet 1, y grows down
 * across sheets, and the gap between sheets is part of the scale. Callers
 * measure in DOM space, where 0 is the first line of text, and must add the
 * top margin back before calling in. Mixing the two shifts every boundary by
 * exactly one margin, which looks almost right and is entirely wrong.
 */

export interface PageGeometry {
  /** Full sheet height in CSS pixels. */
  pageHeight: number;
  /** Vertical gap drawn between sheets. */
  pageGap: number;
  marginTop: number;
  marginBottom: number;
}

export interface MeasuredBlock {
  /** Caller's identifier — a document position, or an array index. */
  key: number;
  /** Top edge in page space, as if no spacers had been applied. */
  naturalTop: number;
  /** Border-box height. */
  height: number;
  /** True for an explicit page-break node. */
  isPageBreak?: boolean;
}

export interface PaginationResult {
  /** Block key → spacer height in px. Only blocks that need one appear. */
  spacers: Map<number, number>;
  /** How many sheets the content occupies. */
  pageCount: number;
}

export function computePagination(
  blocks: MeasuredBlock[],
  geometry: PageGeometry
): PaginationResult {
  const stride = geometry.pageHeight + geometry.pageGap;
  const printable = geometry.pageHeight - geometry.marginTop - geometry.marginBottom;

  const spacers = new Map<number, number>();

  if (printable <= 0 || blocks.length === 0) {
    return { spacers, pageCount: 1 };
  }

  const pageStart = (page: number) => page * stride + geometry.marginTop;
  const pageEnd = (page: number) => page * stride + geometry.pageHeight - geometry.marginBottom;

  let added = 0;
  let forceNextPage = false;
  let lastBottom = geometry.marginTop;

  blocks.forEach((block, index) => {
    let top = block.naturalTop + added;

    let page = Math.max(0, Math.floor((top - geometry.marginTop + 1) / stride));

    const pushTo = (target: number) => {
      const y = pageStart(target);
      const delta = y - top;

      if (delta > 0.5) {
        spacers.set(block.key, delta);
        added += delta;
        top = y;
      }

      page = target;
    };

    if (forceNextPage) {
      pushTo(page + 1);
      forceNextPage = false;
    }

    // An explicit break ends the page it sits on; the next block opens the
    // following one.
    if (block.isPageBreak) {
      forceNextPage = true;
      lastBottom = Math.max(lastBottom, top + block.height);
      return;
    }

    /*
     * Overflow moves the whole block down. Two exceptions:
     *
     *   - the first block, which has nowhere earlier to go
     *   - a block taller than the printable area, which cannot fit on any
     *     page; pushing it only wastes one, and dompdf will split it in the
     *     PDF regardless, so the two stay in agreement
     */
    if (index > 0 && top + block.height > pageEnd(page) + 0.5 && block.height <= printable) {
      pushTo(page + 1);
    }

    lastBottom = Math.max(lastBottom, top + block.height);
  });

  return {
    spacers,
    pageCount: Math.max(1, Math.floor((lastBottom - geometry.marginTop - 0.5) / stride) + 1),
  };
}
