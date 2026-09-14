// The pure seams behind the /work screens: the previous/next loop, the keyboard
// map inside the client component, the cover lookup, and the derived card labels.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { keyAction, nextIndex } from '../src/lib/workNav.ts';
import { resolveCover } from '../src/lib/projectMedia.ts';
import { BUILDING_BADGE, detailEyebrow, statusBadge } from '../src/lib/projectMeta.ts';
import { PROJECTS } from '../src/content/projects.ts';

test('previous and next wrap at both ends', () => {
  const total = PROJECTS.length;
  assert.equal(total, 5);
  assert.equal(nextIndex(0, 1, total), 1);
  assert.equal(nextIndex(3, 1, total), 4);
  // bibo (first) goes back to amm (last); amm goes forward to bibo.
  assert.equal(nextIndex(0, -1, total), 4);
  assert.equal(nextIndex(4, 1, total), 0);
  assert.equal(PROJECTS[nextIndex(0, -1, total)].id, 'amm');
  assert.equal(PROJECTS[nextIndex(total - 1, 1, total)].id, 'bibo');
  assert.equal(nextIndex(0, -1, 1), 0);
  assert.equal(nextIndex(0, 1, 0), 0);
});

test('arrows walk the cases, Esc leaves, anything else is ignored', () => {
  assert.equal(keyAction('ArrowLeft', { tagName: 'BODY' }), 'prev');
  assert.equal(keyAction('ArrowRight', { tagName: 'BODY' }), 'next');
  assert.equal(keyAction('Escape', { tagName: 'BODY' }), 'close');
  assert.equal(keyAction('a', { tagName: 'BODY' }), null);
  assert.equal(keyAction('ArrowUp', { tagName: 'BODY' }), null);
  assert.equal(keyAction('Escape', null), 'close');
});

test('a focused field swallows every key', () => {
  for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT', 'input']) {
    assert.equal(keyAction('ArrowRight', { tagName }), null, tagName);
    assert.equal(keyAction('Escape', { tagName }), null, tagName);
  }
  assert.equal(keyAction('ArrowRight', { tagName: 'DIV', isContentEditable: true }), null);
  assert.equal(keyAction('ArrowRight', { tagName: 'DIV', isContentEditable: false }), 'next');
});

test('the cover slot prefers webp, falls back to png, and reports nothing found', () => {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-cover-'));
  try {
    const dir = join(root, 'public', 'projects', 'loop');
    mkdirSync(dir, { recursive: true });

    assert.equal(resolveCover('loop', { root }), null, 'no file, no cover');

    writeFileSync(join(dir, 'cover.png'), 'png');
    assert.deepEqual(resolveCover('loop', { root }), { src: '/projects/loop/cover.png' });

    writeFileSync(join(dir, 'cover.webp'), 'webp');
    assert.deepEqual(resolveCover('loop', { root }), { src: '/projects/loop/cover.webp' }, 'webp wins');

    assert.equal(resolveCover('nope', { root }), null, 'unknown project has no cover');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('only a building record earns a badge', () => {
  assert.equal(statusBadge({ status: 'building' }), BUILDING_BADGE);
  assert.equal(BUILDING_BADGE, 'building');
  assert.equal(statusBadge({}), null, 'no status means shipped');
  assert.equal(statusBadge({ status: 'shipped' }), null);
  assert.equal(statusBadge({ status: 'archived' }), null);
  for (const p of PROJECTS) assert.equal(statusBadge(p), null, `${p.id} ships without a badge`);
});

test('the case eyebrow appends the ISO updated date when a record carries one', () => {
  const role = 'Solo · open source';
  assert.equal(detailEyebrow({ role }), role);
  assert.equal(detailEyebrow({ role, updated: '2026-09-14' }), `${role} · updated 2026-09-14`);
});
