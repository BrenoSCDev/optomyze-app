import { computePagination, type MeasuredBlock, type PageGeometry } from './paginationAlgorithm';

const SPACER_CLASS = 'doc-page-spacer';

/**
 * The same pagination rule, applied to plain DOM.
 *
 * The Preview pane shows HTML the server rendered, not a ProseMirror document,
 * so PaginationExtension cannot reach it. Without this, Preview would show
 * paragraphs straddling page boundaries that the editor beside it had
 * correctly pushed apart — and Preview is the pane people trust, because it is
 * the one that resolves variables and loops.
 *
 * Kept deliberately in step with the plugin, including the two things that
 * matter most:
 *
 *   - spacer **elements**, not margins, because a `margin-top` collapses with
 *     the previous block's `margin-bottom` and lands the block short
 *   - **page space**, where y = 0 is the top edge of sheet 1; the container
 *     starts at the top margin, so that offset is added back
 *
 * @returns how many pages the content now occupies
 */
export function paginateStaticHtml(container: HTMLElement, geometry: PageGeometry): number {
  // Clear the previous pass first: heights must be measured from the natural
  // layout, or each run compounds on the last instead of converging.
  container.querySelectorAll(`.${SPACER_CLASS}`).forEach((el) => el.remove());

  const blocks = Array.from(container.children) as HTMLElement[];

  if (blocks.length === 0) return 1;

  // The container starts at the top margin of sheet 1; the algorithm works in
  // page space, so that offset is added back to every measurement.
  const containerTop = container.getBoundingClientRect().top - geometry.marginTop;

  const measured: MeasuredBlock[] = blocks.map((block, index) => {
    const rect = block.getBoundingClientRect();

    return {
      key: index,
      naturalTop: rect.top - containerTop,
      height: rect.height,
      isPageBreak:
        block.dataset.pageBreak !== undefined || block.classList.contains('page-break'),
    };
  });

  const { spacers, pageCount } = computePagination(measured, geometry);

  spacers.forEach((height, index) => {
    const block = blocks[index];
    if (!block) return;

    const el = document.createElement('div');
    el.className = SPACER_CLASS;
    el.style.height = `${Math.round(height)}px`;
    el.setAttribute('aria-hidden', 'true');

    block.parentNode?.insertBefore(el, block);
  });

  return pageCount;
}
