// Hero card interactions: formulas and timings, asserted without a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  PINNED_CLASS,
  PINNED_TRANSFORM,
  RESET_TRANSFORM,
  canTilt,
  glarePosition,
  pointerOffset,
  tiltTransform,
} from '../src/lib/tilt.ts';
import { doneCountAt, lineDelay } from '../src/lib/buildLog.ts';
import { copyToastMessage } from '../src/lib/toast.ts';
import { EMAIL } from '../src/content/links.ts';
import { HOW_I_BUILD } from '../src/content/copy.ts';

const STAGE = { left: 100, top: 50, width: 400, height: 300 };

test('pointer in the top-right corner tilts the card by the mock formula', () => {
  const corner = pointerOffset(STAGE, 500, 50); // right edge, top edge
  assert.deepEqual(corner, { px: 0.5, py: -0.5 });
  assert.equal(tiltTransform(corner), 'rotateY(8.00deg) rotateX(6.00deg)');
  assert.deepEqual(glarePosition(corner), { gx: '100.0%', gy: '0.0%' });

  const middle = pointerOffset(STAGE, 300, 200);
  assert.equal(tiltTransform(middle), 'rotateY(0.00deg) rotateX(0.00deg)');
  assert.deepEqual(glarePosition(middle), { gx: '50.0%', gy: '50.0%' });

  const bottomLeft = pointerOffset(STAGE, 100, 350);
  assert.equal(tiltTransform(bottomLeft), 'rotateY(-8.00deg) rotateX(-6.00deg)');
});

test('tilt is skipped for touch, for reduced motion and while pinned', () => {
  assert.equal(canTilt({ reduced: false, pinned: false, pointerType: 'mouse' }), true);
  assert.equal(canTilt({ reduced: false, pinned: false, pointerType: 'pen' }), true);
  assert.equal(canTilt({ reduced: false, pinned: false, pointerType: 'touch' }), false);
  assert.equal(canTilt({ reduced: true, pinned: false, pointerType: 'mouse' }), false);
  assert.equal(canTilt({ reduced: false, pinned: true, pointerType: 'mouse' }), false);
});

test('pinning uses the fixed pose; releasing clears the inline transform', () => {
  assert.equal(PINNED_TRANSFORM, 'rotateY(-10deg) rotateX(6deg) scale(1.02)');
  assert.equal(RESET_TRANSFORM, '');
});

test('the pinned class the card gets is the one the stylesheet styles', () => {
  // The card is a CSS module, the pinned pose is a plain class: only :global()
  // rules can reach it, so the stylesheet has to name the same class.
  assert.equal(PINNED_CLASS, 'pinned');
  const css = readFileSync(
    fileURLToPath(new URL('../src/components/HowIBuildCard.module.css', import.meta.url)),
    'utf8',
  ).replace(/\s+/g, ' ');
  assert.match(css, new RegExp(`\\.win:global\\(\\.${PINNED_CLASS}\\) \\{[^}]*box-shadow`), 'pinned pose');
  assert.match(css, new RegExp(`\\.win:global\\(\\.${PINNED_CLASS}\\)::after`), 'pinned glare stays lit');
});

test('terminal lines tick over at 600ms, then one every 420ms', () => {
  const total = HOW_I_BUILD.terminal.lines.length;
  assert.equal(lineDelay(0), 600);
  assert.equal(lineDelay(4), 2280);

  assert.equal(doneCountAt(0, total, false), 0);
  assert.equal(doneCountAt(599, total, false), 0);
  assert.equal(doneCountAt(600, total, false), 1);
  assert.equal(doneCountAt(1020, total, false), 2);
  assert.equal(doneCountAt(2280, total, false), total);
  assert.equal(doneCountAt(3000, total, false), total);
});

test('reduced motion shows every line done at mount', () => {
  const total = HOW_I_BUILD.terminal.lines.length;
  assert.equal(doneCountAt(0, total, true), total);
});

test('copy email toast confirms the address, or falls back to showing it', () => {
  assert.equal(copyToastMessage(true, EMAIL), 'Copied Pulin7490@gmail.com');
  assert.equal(copyToastMessage(false, EMAIL), EMAIL);
});
