// Interaction helpers asserted without a browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { copyToastMessage } from '../src/lib/toast.ts';
import { EMAIL } from '../src/content/links.ts';
import { projectStamps, splitRole, stackTags } from '../src/lib/projectMeta.ts';
import { bubblePath, mulberry32, seedOf, wavy } from '../src/lib/sketch.ts';

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

test('copy email toast confirms the address, or falls back to showing it', () => {
  assert.equal(copyToastMessage(true, EMAIL), 'Copied Pulin7490@gmail.com');
  assert.equal(copyToastMessage(false, EMAIL), EMAIL);
});

test('the pen is seeded: the same box wobbles the same way on every visit', () => {
  const a = mulberry32(seedOf(':r1:')), b = mulberry32(seedOf(':r1:')), c = mulberry32(seedOf(':r2:'));
  const first = [a(), a(), a()];
  assert.deepEqual([b(), b(), b()], first);
  assert.notDeepEqual([c(), c(), c()], first);
  for (const v of first) assert.ok(v >= 0 && v < 1);
});

test('speech bubbles put their tail where the speaker is', () => {
  // A bubble above the robot: the tail tip is 38px below the box, at tx of its width.
  const down = bubblePath(400, 120, 'down', { tx: 0.9 });
  assert.match(down, /L360,158L/);
  // Tails on the side leave the box on that side.
  assert.match(bubblePath(300, 90, 'left'), /L-22,88/);
  assert.match(bubblePath(300, 90, 'right'), /L320,88/);
  // Too short for a tail near the top: it stays at the bottom.
  assert.doesNotMatch(bubblePath(300, 90, 'left', { tail: 'top' }), /L-24,84/);
  assert.match(bubblePath(300, 160, 'left', { tail: 'top' }), /L-24,84/);
  assert.match(wavy(0, 7, 100, 3, 4), /^M0,7(Q[\d.,\s-]+){8}$/);
});

test('a card reads its stamps, tags and role accent off the record', () => {
  // A private project is stamped by what it is (live), never by where its code lives.
  assert.deepEqual(projectStamps({ role: 'Solo · live', private: true, site: { label: 'x', url: 'https://x' } }), ['live']);
  assert.deepEqual(projectStamps({ role: 'Solo · open source', private: true }), []);
  assert.deepEqual(projectStamps({ role: 'Solo · open source · live', private: false }), ['live', 'open']);
  assert.deepEqual(projectStamps({ role: 'Solo · B.Eng. capstone', private: false }), ['capstone']);
  assert.deepEqual(projectStamps({ role: 'Solo · open source', private: false }), ['open']);
  assert.deepEqual(stackTags('A · B, C · D · E · F'), ['A', 'B, C', 'D', 'E']);
  assert.deepEqual(splitRole('Product-minded software engineer · fintech × web3 × AI'), ['Product-minded software engineer', 'fintech × web3 × AI']);
  assert.deepEqual(splitRole('Engineer'), ['Engineer', '']);
});

test('the robot walks in once a session, and only when motion is welcome', () => {
  const src = read('../src/components/Assistant.tsx');
  assert.match(src, /const WALKED = "assistant-walked";/);
  assert.match(src, /if \(still\(\) \|\| walked\) \{/, 'reduced motion or a second visit: it is simply there');
  assert.match(src, /sessionStorage\.setItem\(WALKED, "1"\)/, 'remembered once the walk has finished');
  assert.match(src, /useLayoutEffect\(\(\) => \{\n\s+const svg = robot\.current;\n\s+const st = stage\.current;/, 'the walk starts before the first paint');
  // Nothing opens by itself: the chat waits for a click.
  assert.match(src, /const \[open, setOpen\] = useState\(false\);/);
  assert.equal((src.match(/setOpen\(true\)/g) ?? []).length, 1, 'one way in: openChat');
});
