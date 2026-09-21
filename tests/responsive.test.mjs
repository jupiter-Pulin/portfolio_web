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

test('hero is card + guide by default and one column below 1024px', () => {
  const css = read('../src/components/Hero.module.css');
  assert.match(squash(css), /\.hero \{[^}]*grid-template-columns: 372px minmax\(0, 1fr\)/);
  assert.match(squash(mediaBlock(css, 1024)), /\.hero \{[^}]*grid-template-columns: 1fr/);
});

test('the work strip is one scrollable row at every width, narrower tiles on phones', () => {
  const css = read('../src/components/SelectedWorkStrip.module.css');
  assert.match(squash(css), /\.tiles \{[^}]*overflow-x: auto/);
  assert.match(squash(css), /\.track \{[^}]*width: max-content/);
  assert.match(squash(css), /\.tile \{[^}]*flex: 0 0 300px/);
  assert.match(squash(mediaBlock(css, 640)), /\.tile \{[^}]*flex-basis: 262px/);
});

test('the work strip runs edge to edge while its head keeps the content column', () => {
  const css = squash(read('../src/components/SelectedWorkStrip.module.css'));
  const strip = css.match(/\.strip \{[^}]*\}/)[0];
  assert.doesNotMatch(strip, /max-width/, 'the strip itself is no longer held to the content column');
  assert.doesNotMatch(strip, /padding:[^;]*28px[^;]*28px/, 'no side padding, so the row can reach both edges');
  const head = css.match(/\.stripHead \{[^}]*\}/)[0];
  assert.match(head, /max-width: var\(--maxw\)/, 'the head still sits in the content column');
  assert.match(head, /margin: 0 auto/, 'centred like the rest of the page');
  assert.match(head, /padding: 0 28px/, 'and keeps the 28px gutter');
  // The row is full width, so its own gutter has to reproduce where the centred
  // column starts: half the leftover viewport plus that same 28px.
  assert.match(css, /\.tiles \{[^}]*max\(28px, calc\(50% - var\(--maxw\) \/ 2 \+ 28px\)\)/);
  assert.doesNotMatch(css, /\.tiles \{[^}]*margin: 0 -28px/, 'the negative margin belonged to the boxed strip');
  const phone = squash(mediaBlock(read('../src/components/SelectedWorkStrip.module.css'), 640));
  for (const sel of ['\\.stripHead', '\\.tiles']) {
    assert.match(phone, new RegExp(`${sel} \\{[^}]*padding-left: 18px`), `${sel} narrows its gutter on phones`);
  }
});

test('the identity card stacks its facts and shrinks the avatar below 640px', () => {
  const phone = squash(mediaBlock(read('../src/components/IdentityCard.module.css'), 640));
  assert.match(phone, /\.avatar \{[^}]*width: 92px/);
  assert.match(phone, /\.fact \{[^}]*grid-template-columns: 1fr/);
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

test('the home guide is a fixed-height window: only its thread scrolls', () => {
  const css = squash(read('../src/components/GuideConsole.module.css'));
  assert.match(css, /\.console \{[^}]*height: clamp\(/, 'the window has a height of its own');
  assert.match(css, /\.console \{[^}]*grid-template-rows: auto minmax\(0, 1fr\) auto;/, 'the thread row takes what is left; the composer is the last row');
  assert.match(css, /\.thread \{[^}]*overflow-y: auto/);
  assert.match(css, /\.thread \{[^}]*overscroll-behavior: contain/, 'reaching the end does not scroll the page');
  assert.match(css, /\.thread \{[^}]*min-height: 0/);
  const home = read('../src/components/GuideConsole.tsx');
  const thread = home.indexOf('className={styles.thread}');
  const composer = home.indexOf('<form className={styles.composer}');
  assert.ok(thread > 0 && thread < home.indexOf('{lines > 0 ?') && home.indexOf('{ask.starters ? (') < composer, 'lines and starting points share the scrolling row');
});
