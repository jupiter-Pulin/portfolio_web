// Responsive rules. There is no browser in this suite, so these
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

test('hero is card + assistant by default, one column below 1060px, and woven together on phones', () => {
  const css = read('../src/components/Hero.module.css');
  assert.match(squash(css), /\.hero \{[^}]*grid-template-columns: 360px minmax\(0, 1fr\)/);
  assert.match(squash(mediaBlock(css, 1060)), /\.hero \{[^}]*grid-template-columns: 1fr/);
  // On a phone the identity column dissolves so the robot sits right under the name.
  assert.match(squash(mediaBlock(css, 680)), /\.hero \{[^}]*grid-template-columns: 104px minmax\(0, 1fr\)/);
  const card = squash(mediaBlock(read('../src/components/IdentityCard.module.css'), 680));
  assert.match(card, /\.me \{ display: contents; \}/);
  assert.match(card, /\.facts \{[^}]*grid-row: 4/);
  assert.match(squash(mediaBlock(read('../src/components/Assistant.module.css'), 680)), /\.assistant \{[^}]*grid-row: 3/);
});

test('the identity card sticks only where it fits, and stacks its facts on phones', () => {
  const css = squash(read('../src/components/IdentityCard.module.css'));
  assert.match(css, /@media \(min-width: 1061px\) and \(min-height: 860px\) \{ \.me \{ position: sticky;/, 'never sticky taller than the screen');
  const phone = squash(mediaBlock(read('../src/components/IdentityCard.module.css'), 680));
  assert.match(phone, /\.polaroid \{[^}]*width: 104px/);
  assert.match(phone, /\.fact \{[^}]*grid-template-columns: 1fr/);
});

test('project cards: three across, two below 1060px, one on phones, the first one wide', () => {
  const css = read('../src/components/Sections.module.css');
  assert.match(squash(css), /\.cards \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(squash(mediaBlock(css, 1060)), /\.cards \{[^}]*grid-template-columns: 1fr 1fr/);
  assert.match(squash(mediaBlock(css, 680)), /\.cards \{[^}]*grid-template-columns: 1fr/);
  const card = read('../src/components/ProjectCard.module.css');
  assert.match(squash(card), /\.feature \{[^}]*grid-column: span 2/);
  assert.match(squash(mediaBlock(card, 680)), /\.feature \{[^}]*grid-column: auto/);
});

test('the header ask button keeps only its icon below 680px', () => {
  const phone = squash(mediaBlock(read('../src/components/Header.module.css'), 680));
  assert.match(phone, /\.askLabel \{[^}]*display: none/);
});

test('reduced motion stills every animation and transition', () => {
  const css = squash(read('../src/app/globals.css'));
  const at = css.indexOf('@media (prefers-reduced-motion: reduce)');
  assert.notEqual(at, -1, 'no reduced-motion block');
  const block = css.slice(at, css.indexOf('}', css.indexOf('}', at) + 1) + 1);
  assert.match(block, /\*, \*::before, \*::after \{[^}]*animation: none !important/);
  assert.match(block, /transition: none !important/);
});

test('globals carry both papers, the grid and the vignette', () => {
  const css = squash(read('../src/app/globals.css'));
  assert.match(css, /\[hidden\] \{ display: none !important; \}/);
  assert.match(css, /:root \{ --paper: #fbf9f3;/, 'light paper by default');
  assert.match(css, /@media \(prefers-color-scheme: dark\) \{ :root:not\(\[data-theme="light"\]\) \{ --paper: #171614;/, 'night paper when the system asks');
  assert.match(css, /:root\[data-theme="dark"\] \{ --paper: #171614;/, 'or when the reader picks it');
  assert.match(css, /body \{[^}]*background: var\(--paper\)/);
  assert.equal((css.match(/1px, transparent 1px\)/g) ?? []).length, 2, 'grid lines');
  assert.match(css, /radial-gradient\(ellipse at center, transparent 58%, var\(--vignette\) 100%\)/);
});

test('the chat is not a fixed window: the page grows with it and the composer floats at the bottom', () => {
  const css = squash(read('../src/components/Assistant.module.css'));
  assert.doesNotMatch(css, /\.chat \{[^}]*height:/, 'no fixed height');
  assert.match(css, /\.composerWrap \{[^}]*position: sticky;[^}]*bottom: 14px/);
  assert.match(css, /\.gutter svg \{[^}]*position: sticky;/, 'the robot keeps to the newest line');
});
