import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { computePagination, type MeasuredBlock, type PageGeometry } from './paginationAlgorithm';

export type { PageGeometry } from './paginationAlgorithm';

/**
 * Real pagination inside a single editor.
 *
 * ## The problem
 *
 * The document is one continuous ProseMirror instance drawn on top of stacked
 * page-shaped sheets. Left alone, text flows down that column and pays no
 * attention to where one sheet ends and the next begins: a paragraph lands
 * half on page 1 and half on page 2, straddling the gap between them, and
 * nothing stops at the bottom margin.
 *
 * ## The approach
 *
 * Rather than splitting the document across several editors — which breaks
 * selections, undo and tables that span a break — top-level blocks are
 * measured and any block that would cross the bottom of its page is pushed
 * whole onto the next one.
 *
 * The push is a **widget spacer**, not a margin. Margins collapse: a
 * `margin-top` of 400px against a previous paragraph's 13px `margin-bottom`
 * resolves to 400px total, not 413px, so the block lands 13px short of where
 * the arithmetic expected. Each pass then tries to correct it, the offsets
 * never settle, and — because the page count is only published once they do —
 * the canvas is left showing a single sheet under an arbitrarily long
 * document. An inserted block element cannot collapse with anything.
 *
 * All measurement happens in **page space**: y = 0 is the top edge of sheet 1,
 * not the first line of text. The editor's own DOM starts at the top margin,
 * so that offset is added back on. Mixing the two spaces silently shifts every
 * boundary by one margin.
 *
 * ## What it does not do
 *
 * A single block taller than the printable area — a 40-row table, a full-page
 * image — cannot be pushed anywhere that helps, so it flows and crosses the
 * boundary. Word does the same, and dompdf will split it too, so the two
 * agree.
 *
 * This is a *preview* of pagination, not the authority. dompdf lays out the
 * PDF, and its line breaking will not match the browser's to the pixel.
 */

export const paginationPluginKey = new PluginKey('documentPagination');

interface PaginationOptions {
  /** Read fresh each pass so page-setup changes take effect immediately. */
  geometry: () => PageGeometry;
  /** Reports how many sheets the content now needs. */
  onPageCount?: (pages: number) => void;
}

interface Offsets {
  /** Document position of a top-level block → spacer height, in px. */
  map: Map<number, number>;
}

const EMPTY: Offsets = { map: new Map() };

/**
 * Measurement runs after layout, so it can only ever react to the previous
 * frame. This caps how many times it may react to its own output before giving
 * up, so a pathological document degrades to slightly wrong spacing rather
 * than a pinned CPU.
 */
const MAX_PASSES = 6;

/** Two offset maps agree if every block asks for the same spacer, to the pixel. */
function sameOffsets(a: Map<number, number>, b: Map<number, number>): boolean {
  if (a.size !== b.size) return false;

  for (const [pos, height] of b) {
    if (Math.abs((a.get(pos) ?? -1) - height) > 0.5) return false;
  }

  return true;
}

function spacer(height: number): HTMLElement {
  const el = document.createElement('div');

  el.className = 'doc-page-spacer';
  el.style.height = `${Math.round(height)}px`;
  el.setAttribute('aria-hidden', 'true');
  el.contentEditable = 'false';

  return el;
}

export const PaginationExtension = Extension.create<PaginationOptions>({
  name: 'documentPagination',

  addOptions() {
    return {
      geometry: () => ({ pageHeight: 1123, pageGap: 24, marginTop: 94, marginBottom: 113 }),
      onPageCount: undefined,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: paginationPluginKey,

        state: {
          init: () => EMPTY,
          apply(tr, value) {
            const next = tr.getMeta(paginationPluginKey) as Offsets | undefined;

            if (next) return next;

            if (!tr.docChanged || value.map.size === 0) return value;

            // Positions move as the document changes; mapping them keeps each
            // spacer attached to its block until the next measurement lands.
            const mapped = new Map<number, number>();

            value.map.forEach((height, pos) => {
              const newPos = tr.mapping.map(pos, -1);
              if (newPos >= 0) mapped.set(newPos, height);
            });

            return { map: mapped };
          },
        },

        props: {
          decorations(state) {
            const { map } = paginationPluginKey.getState(state) as Offsets;

            if (map.size === 0) return DecorationSet.empty;

            const decorations: Decoration[] = [];

            map.forEach((height, pos) => {
              if (height > 0.5 && pos <= state.doc.content.size) {
                decorations.push(
                  // side: -1 keeps the spacer above the block it pushes, and
                  // out of the way of a caret placed at the block's start.
                  Decoration.widget(pos, () => spacer(height), {
                    side: -1,
                    ignoreSelection: true,
                    key: `page-spacer-${Math.round(height)}`,
                  })
                );
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },

        view(view) {
          let frame: number | null = null;
          let passes = 0;

          const publish = (pages: number) => {
            options.onPageCount?.(Math.max(1, pages));
          };

          const measure = () => {
            frame = null;

            const geometry = options.geometry();
            if (!view.dom.isConnected) return;

            /*
             * The editor's DOM begins at the top margin of sheet 1, because
             * the padding that places it there lives on the canvas wrapper.
             * Everything below works in page space, so that margin is added
             * back to every measured position.
             */
            const containerTop = view.dom.getBoundingClientRect().top - geometry.marginTop;
            const current = (paginationPluginKey.getState(view.state) as Offsets).map;

            /*
             * Measure only. Every block's *natural* top is its measured top
             * minus the spacers already standing above it, so the arithmetic
             * below always starts from an unpaginated document and converges
             * instead of compounding on its own last answer.
             */
            const measured: MeasuredBlock[] = [];
            let appliedSoFar = 0;

            view.state.doc.forEach((node, offset) => {
              const dom = view.nodeDOM(offset) as HTMLElement | null;

              if (!dom || dom.nodeType !== 1) return;

              appliedSoFar += current.get(offset) ?? 0;

              const rect = dom.getBoundingClientRect();

              measured.push({
                key: offset,
                naturalTop: rect.top - containerTop - appliedSoFar,
                height: rect.height,
                isPageBreak: node.type.name === 'pageBreak',
              });
            });

            const { spacers: next, pageCount: pages } = computePagination(measured, geometry);

            // Publish on every pass, not only the settled one. Waiting for
            // convergence is what left the canvas showing a single sheet under
            // an arbitrarily long document whenever the offsets kept adjusting.
            publish(pages);

            /*
             * Compared against what is actually in the plugin state, not
             * against a remembered string. Editing remaps every position, so a
             * remembered signature can match while the decorations underneath
             * it belong to the previous document.
             */
            if (sameOffsets(current, next)) {
              passes = 0;
              return;
            }

            if (passes >= MAX_PASSES) {
              passes = 0;
              return;
            }

            passes += 1;

            view.dispatch(
              view.state.tr
                .setMeta(paginationPluginKey, { map: next })
                .setMeta('addToHistory', false)
            );
          };

          const schedule = () => {
            if (frame !== null) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
          };

          schedule();

          // Images and web fonts settle after first layout and change every
          // height below them.
          const observer = new ResizeObserver(schedule);
          observer.observe(view.dom);

          return {
            update: schedule,
            destroy() {
              observer.disconnect();
              if (frame !== null) cancelAnimationFrame(frame);
            },
          };
        },
      }),
    ];
  },
});

export default PaginationExtension;
