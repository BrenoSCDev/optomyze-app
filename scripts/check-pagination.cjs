/**
 * Pagination checks for the document editor.
 *
 *     npm run check:pagination
 *
 * A plain Node script rather than a test suite because this repo has no test
 * runner, and adding one to cover a single pure function would be a larger
 * decision than the problem warrants. `computePagination` has no DOM in it
 * precisely so it can be checked this way.
 *
 * These exist because the same feature broke twice: once from measuring in
 * content space while doing arithmetic in page space, and once from pushing
 * blocks with a `margin-top` that collapsed against the previous block's
 * `margin-bottom`. The second never settled, so the page count was never
 * published and a long document rendered under a single sheet. Both are
 * caught below.
 */
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

// Transpiled on the fly with the esbuild that Vite already depends on, so
// running the checks needs no extra install.
const source = path.join(__dirname, '..', 'src', 'components', 'documents', 'editor', 'paginationAlgorithm.ts');
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pagination-')), 'alg.cjs');

execFileSync(
  path.join(__dirname, '..', 'node_modules', '.bin', 'esbuild'),
  [source, '--format=cjs', `--outfile=${out}`, '--log-level=error'],
  { stdio: 'inherit' }
);

const { computePagination } = require(out);

// A4 at 96dpi, the editor's real defaults (25/20/30/20 mm margins).
const PX = 96 / 25.4;
const G = {
  pageHeight: 297 * PX,          // 1122.5
  pageGap: 24,
  marginTop: 25 * PX,            // 94.5
  marginBottom: 30 * PX,         // 113.4
};
const printable = G.pageHeight - G.marginTop - G.marginBottom;
const stride = G.pageHeight + G.pageGap;

let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? '  ok  ' : ' FAIL '} ${name}${detail ? '  — ' + detail : ''}`);
  if (!cond) failures++;
};

/** Lay blocks out naturally, back to back, like a browser would. */
function stack(heights, breaks = new Set()) {
  const blocks = [];
  let y = G.marginTop;
  heights.forEach((h, i) => {
    blocks.push({ key: i, naturalTop: y, height: h, isPageBreak: breaks.has(i) });
    y += h;
  });
  return blocks;
}

/** Where each block actually lands once the spacers are applied. */
function resolve(blocks, spacers) {
  let added = 0;
  return blocks.map((b) => {
    added += spacers.get(b.key) ?? 0;
    return { key: b.key, top: b.naturalTop + added, bottom: b.naturalTop + added + b.height };
  });
}

const pageOf = (y) => Math.floor((y - G.marginTop + 1e-6) / stride);
const pageEnd = (p) => p * stride + G.pageHeight - G.marginBottom;

console.log(`printable height per page: ${printable.toFixed(1)}px\n`);

// ---------------------------------------------------------------- 1
console.log('1. A contract the length of the one that was pasted');
// ~140 blocks: headings, paragraphs, list items, rules — the real mix.
const heights = [];
for (let i = 0; i < 140; i++) {
  heights.push(i % 9 === 0 ? 34 : i % 5 === 0 ? 18 : 46);
}
let blocks = stack(heights);
let { spacers, pageCount } = computePagination(blocks, G);
const natural = heights.reduce((a, b) => a + b, 0);
check('needs many pages', pageCount > 5, `${pageCount} pages for ${natural.toFixed(0)}px of content`);

let placed = resolve(blocks, spacers);
let straddling = placed.filter((p, i) => {
  if (blocks[i].height > printable) return false;
  return pageOf(p.top) !== pageOf(p.bottom - 0.5);
});
check('no block straddles a page boundary', straddling.length === 0,
  straddling.length ? `${straddling.length} straddle, first at key ${straddling[0].key}` : '');

let overflowing = placed.filter((p, i) =>
  blocks[i].height <= printable && p.bottom > pageEnd(pageOf(p.top)) + 0.5);
check('nothing spills past the bottom margin', overflowing.length === 0,
  overflowing.length ? `${overflowing.length} spill` : '');

check('page count matches the furthest block',
  pageCount === pageOf(Math.max(...placed.map((p) => p.bottom)) - 0.5) + 1);

// ---------------------------------------------------------------- 2
console.log('\n2. Convergence — a second pass must be a no-op');
const secondInput = blocks.map((b, i) => ({ ...b })); // same natural tops
const second = computePagination(secondInput, G);
const same = second.spacers.size === spacers.size &&
  [...spacers].every(([k, v]) => Math.abs((second.spacers.get(k) ?? 0) - v) < 0.5);
check('identical input gives identical output', same);
check('page count is stable', second.pageCount === pageCount);

// ---------------------------------------------------------------- 3
console.log('\n3. Explicit page breaks');
blocks = stack([40, 40, 8, 40, 40], new Set([2]));
({ spacers, pageCount } = computePagination(blocks, G));
placed = resolve(blocks, spacers);
check('the break forces the next block onto page 2', pageOf(placed[3].top) === 1,
  `block 3 landed on page ${pageOf(placed[3].top) + 1}`);
check('content before the break stays on page 1', pageOf(placed[1].top) === 0);
check('two pages result', pageCount === 2, `${pageCount}`);

// ---------------------------------------------------------------- 4
console.log('\n4. A block taller than a whole page');
blocks = stack([40, printable + 400, 40]);
({ spacers, pageCount } = computePagination(blocks, G));
check('the oversized block is not pushed (nowhere helps)', !spacers.has(1));
check('the document still reports the pages it spans', pageCount >= 2, `${pageCount}`);

// ---------------------------------------------------------------- 5
console.log('\n5. Edges');
check('empty document is one page', computePagination([], G).pageCount === 1);
check('a single short line is one page',
  computePagination(stack([40]), G).pageCount === 1);
const exact = computePagination(stack([printable]), G);
check('a block exactly filling the page does not spill to a second',
  exact.pageCount === 1, `${exact.pageCount}`);
check('the first block is never pushed', !computePagination(stack([printable + 5, 40]), G).spacers.has(0));

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
