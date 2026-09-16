// Interaction helpers asserted without a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { copyToastMessage } from '../src/lib/toast.ts';
import { EMAIL } from '../src/content/links.ts';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DRIFT_PX_PER_MS, copiesFor, nextOffset } from '../src/lib/marquee.ts';

test('copy email toast confirms the address, or falls back to showing it', () => {
  assert.equal(copyToastMessage(true, EMAIL), 'Copied Pulin7490@gmail.com');
  assert.equal(copyToastMessage(false, EMAIL), EMAIL);
});

test('the work strip drifts at reading pace and wraps onto its second copy', () => {
  assert.equal(DRIFT_PX_PER_MS, 0.028);
  assert.equal(nextOffset(0, 1000, 1e9), 28);
  assert.ok(Math.abs(nextOffset(999, 100, 1000) - 1.8) < 1e-9, 'past the first copy, the offset wraps');
  assert.equal(nextOffset(5, 0, 0), 5, 'an empty strip never divides by its width');
});

test('a viewport-wide strip gets enough copies that the drift never runs out of scroll', () => {
  // A browser stops at scrollWidth - clientWidth, so all the copies but the last
  // one have to cover the visible width; otherwise the row stalls at the end and
  // snaps back when the offset wraps.
  const loop = 1248; // four 300px tiles and their 12px gaps
  assert.equal(copiesFor(1124, loop), 2, 'inside the content column two copies are enough');
  assert.equal(copiesFor(1440, loop), 3, 'a laptop is wider than one copy');
  assert.equal(copiesFor(2560, loop), 4, 'a wide display needs another');
  for (const width of [320, 1124, 1440, 1920, 2560, 3840]) {
    assert.ok((copiesFor(width, loop) - 1) * loop >= width, `scrollable room at ${width}px`);
  }
  assert.equal(copiesFor(1920, 0), 2, 'an unmeasured strip keeps the two it renders');
});

test('the strip wraps on a measured copy, not on half the scroll width', () => {
  const src = readFileSync(fileURLToPath(new URL('../src/components/WorkMarquee.tsx', import.meta.url)), 'utf8');
  // scrollWidth counts the row's own padding, which is now viewport-sized: half
  // of it is nowhere near one copy of the tiles.
  assert.doesNotMatch(src, /scrollWidth\s*\/\s*2/, 'the loop width is measured off the tiles');
  assert.match(src, /copiesFor\(/, 'the number of copies follows the width of the row');
  assert.match(src, /ResizeObserver/, 'and is recomputed when the row is resized');
});
