// Responsive rules from the mock. There is no browser in this suite, so these
// assert the stylesheet a browser would apply at each breakpoint, not the layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

/** Body of the `@media (max-width: <px>px)` block in `css`, braces matched. */
function mediaBlock(css, px) {
  const at = css.indexOf(`@media (max-width: ${px}px)`);
  assert.notEqual(at, -1, `no max-width:${px}px block`);
  const start = css.indexOf('{', at);
  let depth = 0;
  for (let i = start; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(start + 1, i);
  }
  throw new Error(`unterminated max-width:${px}px block`);
}

const squash = (s) => s.replace(/\s+/g, ' ');

test('hero is two columns by default and one column below 1024px', () => {
  const css = read('../src/components/Hero.module.css');
  assert.match(squash(css), /\.hero \{[^}]*grid-template-columns: 1\.02fr 1fr/);
  assert.match(squash(mediaBlock(css, 1024)), /\.hero \{[^}]*grid-template-columns: 1fr/);
});

test('tiles become a snapping horizontal scroller below 1024px', () => {
  const css = read('../src/components/SelectedWorkStrip.module.css');
  assert.match(squash(css), /\.tiles \{[^}]*grid-template-columns: repeat\(5, 1fr\)/);
  const narrow = squash(mediaBlock(css, 1024));
  assert.match(narrow, /\.tiles \{[^}]*overflow-x: auto/);
  assert.match(narrow, /\.tiles \{[^}]*scroll-snap-type: x mandatory/);
  assert.match(narrow, /\.tile \{[^}]*scroll-snap-align: start/);
});

test('terminal and ship panel stack, step captions drop, below 640px', () => {
  const phone = squash(mediaBlock(read('../src/components/HowIBuildCard.module.css'), 640));
  assert.match(phone, /\.winBottom \{[^}]*grid-template-columns: 1fr/);
  assert.match(phone, /\.steps small \{[^}]*display: none/);
});

test('the header ask button keeps only its icon below 640px', () => {
  const phone = squash(mediaBlock(read('../src/app/globals.css'), 640));
  assert.match(phone, /\.btn-ask \.label \{[^}]*display: none/);
});

test('reduced motion stills the pulse and the shipping spinner', () => {
  const css = squash(read('../src/app/globals.css'));
  const at = css.indexOf('@media (prefers-reduced-motion: reduce)');
  assert.notEqual(at, -1, 'no reduced-motion block');
  const block = css.slice(at, css.indexOf('}', css.indexOf('}', at) + 1) + 1);
  assert.match(block, /\*, \*::before, \*::after \{[^}]*animation: none !important/);
  assert.match(block, /transition: none !important/);
});

test('globals carry the mock tokens, the grid and both glows', () => {
  const css = squash(read('../src/app/globals.css'));
  assert.match(css, /\[hidden\] \{ display: none !important; \}/);
  assert.match(css, /--cyan: #7de3f5;/);
  assert.match(css, /body \{[^}]*background: var\(--bg\)/);
  assert.equal((css.match(/radial-gradient\(\d+px \d+px at/g) ?? []).length, 2, 'two glows');
  assert.equal((css.match(/1px, transparent 1px\)/g) ?? []).length, 2, 'grid lines');
});
