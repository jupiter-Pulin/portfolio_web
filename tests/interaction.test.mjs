// Interaction helpers asserted without a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { copyToastMessage } from '../src/lib/toast.ts';
import { EMAIL } from '../src/content/links.ts';
import { DRIFT_PX_PER_MS, nextOffset } from '../src/lib/marquee.ts';

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
