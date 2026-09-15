// The /work screens, asserted against the build artifacts. `next build` prerenders
// the overview and the three case pages to HTML, so no server and no browser is needed.
// One project's cover is set aside for an extra build so both halves of the image
// slot — a real image, and the placeholder — are covered by the same test run.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SITE, WORK } from '../src/content/copy.ts';
import { GUIDE } from '../src/content/guide.ts';
import { PROJECTS, projectById } from '../src/content/projects.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const NEXT = fileURLToPath(new URL('../node_modules/.bin/next', import.meta.url));
const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

// Any bytes will do: the slot is resolved by file name, and next/image is unoptimized.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const COVER_ID = 'amm';
const COVER_DIR = fileURLToPath(new URL(`../public/projects/${COVER_ID}/`, import.meta.url));
// Whatever cover the tree ships for that project, in resolveCover's order; the
// fixture png is only written when the tree has none.
const shipped = ['webp', 'png', 'jpg'].map((ext) => `${COVER_DIR}cover.${ext}`).filter((f) => existsSync(f));
const COVER = shipped[0] ?? `${COVER_DIR}cover.png`;
const COVER_SRC = `/projects/${COVER_ID}/cover.${COVER.split('.').pop()}`;
const hidden = (f) => `${f}.hidden`;

const decode = (s) =>
  s
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** Markup without the RSC payload that `next build` inlines in <script> tags. */
const markup = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' '));

const textOf = (html) =>
  markup(html)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** The opening tag that carries `href="<url>"`. */
const tagWithHref = (html, url) => {
  const found = markup(html).match(
    new RegExp(`<[a-z]+\\b[^>]*href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'i'),
  );
  return found ? found[0] : null;
};

/** One <article> per gallery card, in document order. */
const cardsOf = (html) =>
  markup(html)
    .split('<article')
    .slice(1)
    .map((s) => `<article${s.slice(0, s.indexOf('</article>'))}`);

const openTags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);

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

const pages = {};
const noCover = {};
let buildOutput = '';

const build = () => execFileSync(NEXT, ['build'], { cwd: ROOT, encoding: 'utf8' });
const readGallery = () => read('../.next/server/app/work.html');
const readCase = (id) => read(`../.next/server/app/work/${id}.html`);
const restore = () => {
  for (const f of shipped) if (existsSync(hidden(f))) renameSync(hidden(f), f);
  if (shipped.length === 0) rmSync(COVER, { force: true });
};

before(() => {
  // First build with the project's cover files set aside, then put them back (or drop
  // the fixture in) and build again, so both halves of the slot are observed on the
  // same project — and so the tree is left holding exactly the build a plain
  // `npm run build` would produce.
  for (const f of shipped) renameSync(f, hidden(f));
  build();
  noCover.gallery = readGallery();
  noCover[COVER_ID] = readCase(COVER_ID);

  restore();
  if (shipped.length === 0) {
    mkdirSync(COVER_DIR, { recursive: true });
    writeFileSync(COVER, PNG);
  }
  buildOutput = build();
  pages.gallery = readGallery();
  for (const p of PROJECTS) pages[p.id] = readCase(p.id);
});

after(restore);

test('the build prerenders the overview and one static page per project', () => {
  assert.match(buildOutput, /\/work\/\[id\]/, 'build output lists the dynamic route');
  for (const p of PROJECTS) {
    assert.ok(existsSync(`${ROOT}.next/server/app/work/${p.id}.html`), `/work/${p.id} is static`);
  }
});

test('the gallery shows the three projects in registry order, featured first', () => {
  const cards = cardsOf(pages.gallery);
  assert.equal(cards.length, PROJECTS.length);
  assert.ok(textOf(pages.gallery).includes(SITE.workTitle), 'work title');
  assert.ok(textOf(pages.gallery).includes(SITE.workSubtitle), 'work subtitle');

  PROJECTS.forEach((p, i) => {
    const body = textOf(cards[i]);
    assert.ok(body.includes(p.name), `card ${i} is ${p.name}`);
    assert.ok(body.includes(p.role), `${p.id} role`);
    assert.ok(body.includes(p.short), `${p.id} short`);
    assert.ok(tagWithHref(cards[i], `/work/${p.id}`), `${p.id} card links to its case page`);
  });

  assert.match(cards[0], /<article class="[^"]*featured/, 'the first card is the featured one');
  assert.ok(textOf(cards[0]).includes(PROJECTS[0].tagline), 'the featured card carries the tagline');
  for (let i = 1; i < cards.length; i++) {
    assert.doesNotMatch(cards[i], /<article class="[^"]*featured/, `card ${i} is not featured`);
  }
});

test('a private project shows a chip, a public one a README link', () => {
  const cards = cardsOf(pages.gallery);
  PROJECTS.forEach((p, i) => {
    const external = openTags(cards[i], 'a').filter((a) => a.includes('target="_blank"'));
    if (p.private) {
      assert.ok(textOf(cards[i]).includes(WORK.privateRepo), `${p.id} says the repository is private`);
      assert.equal(external.length, 0, 'a private project links nothing out');
      assert.doesNotMatch(cards[i], /github\.com/, `no repository link anywhere on the ${p.id} card`);
    } else {
      assert.equal(external.length, 1, `${p.id} has exactly one outbound link`);
      assert.ok(external[0].includes(`href="${p.readmeUrl}"`), `${p.id} links its readmeUrl`);
      assert.match(external[0], /rel="noopener"/, `${p.id} README link is safe`);
      assert.ok(textOf(cards[i]).includes(WORK.readmeLink), `${p.id} README label`);
    }
  });
});

test('no anchor on either screen is nested inside another', () => {
  for (const [name, html] of Object.entries(pages)) {
    let depth = 0;
    for (const m of markup(html).matchAll(/<(\/?)a\b[^>]*>/gi)) {
      depth += m[1] ? -1 : 1;
      assert.ok(depth <= 1, `${name}: an <a> is nested inside an <a> at index ${m.index}`);
    }
    assert.equal(depth, 0, `${name}: unbalanced <a> tags`);
  }
});

test('a case page renders every field of its record', () => {
  const p = projectById('loop');
  const body = textOf(pages.loop);
  for (const key of ['role', 'name', 'tagline', 'thesis', 'wrong', 'mechanism', 'stack', 'statsNote']) {
    assert.ok(body.includes(p[key]), `loop ${key}`);
  }
  assert.ok(body.includes(WORK.wrong) && body.includes(WORK.mechanism), 'the two pair labels');
  assert.equal(p.stats.length, 4);
  for (const s of p.stats) {
    assert.ok(body.includes(s.v), `stat ${s.v}`);
    assert.ok(body.includes(s.l), `stat ${s.l}`);
  }
  assert.match(pages.loop, /<title>Loop Conductor · Nolan Tang<\/title>/);

  const pre = markup(pages.loop).match(/<pre\b[^>]*>([\s\S]*?)<\/pre>/);
  assert.ok(pre, 'the README preview is a <pre>');
  assert.equal(pre[1].split('\n')[0], '# Loop Conductor');

  const readmeBtn = tagWithHref(pages.loop, p.readmeUrl);
  assert.ok(readmeBtn && readmeBtn.includes('target="_blank"'), 'Open README on GitHub');
  for (const r of p.repos) {
    const tag = tagWithHref(pages.loop, r.url);
    assert.ok(tag, `repo button for ${r.label}`);
    assert.match(tag, /rel="noopener"/);
    assert.ok(body.includes(r.label), `repo label ${r.label}`);
  }
});

test('a case page without stats renders no stats block', () => {
  for (const p of PROJECTS.filter((x) => x.stats.length === 0)) {
    assert.doesNotMatch(markup(pages[p.id]), /class="[^"]*statsNote/, `${p.id} has no stats note`);
    assert.doesNotMatch(markup(pages[p.id]), /class="[^"]*__stats\b/, `${p.id} has no stats grid`);
  }
});

test('a private case page shows the scope note and links no repository', () => {
  // No record is private today; this holds the line for the next one that is.
  for (const p of PROJECTS.filter((x) => x.private)) {
    const body = textOf(pages[p.id]);
    assert.ok(body.includes(WORK.privateRepo), `${p.id} lock label`);
    assert.ok(body.includes(p.scope), `${p.id} scope note`);
    assert.doesNotMatch(markup(pages[p.id]), /github\.com/, `no github link on the ${p.id} case page`);
  }
});

test('README notes: a caveat bar with a preview, plain copy without one', () => {
  for (const id of ['live']) {
    const p = projectById(id);
    const note = markup(pages[id]).match(/<p class="[^"]*rmNote[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    assert.ok(note, `${id} shows the amber README note bar`);
    assert.equal(note[1], p.readmeNote);
    assert.ok(markup(pages[id]).includes('<pre'), `${id} still previews the README`);
  }
  const amm = projectById('amm');
  assert.equal(amm.readme, null);
  assert.doesNotMatch(markup(pages.amm), /<pre/, 'amm has no preview to show');
  assert.doesNotMatch(markup(pages.amm), /class="[^"]*rmNote/, 'amm has no caveat bar');
  assert.ok(textOf(pages.amm).includes(amm.readmeNote), 'amm explains itself in plain copy');
  for (const r of amm.repos) assert.ok(tagWithHref(pages.amm, r.url), `amm repo ${r.label}`);
  assert.equal(amm.repos.length, 2);
});

test('the ask button is live on every case page and carries its own scope', () => {
  for (const p of PROJECTS) {
    const html = markup(pages[p.id]);
    const tag = html.match(/<button\b[^>]*data-scope="[^"]*"[^>]*>/);
    assert.ok(tag, `${p.id} has the ask button`);
    // The placeholder is gone: the button opens the drawer, scoped to this page.
    assert.doesNotMatch(tag[0], /aria-disabled/, `${p.id} ask button is not disabled`);
    assert.doesNotMatch(tag[0], /title="Coming in a later task"/);
    assert.match(tag[0], /aria-haspopup="dialog"/, `${p.id} announces the dialog`);
    assert.match(tag[0], new RegExp(`data-scope="${p.id}"`));
    assert.ok(textOf(pages[p.id]).includes(WORK.askProject), `${p.id} ask label`);
    // …and the dialog it points at is on the page, labelled as the mock it is.
    assert.match(html, /role="dialog"/, `${p.id} renders the drawer`);
    assert.match(html, /aria-modal="true"/);
    assert.ok(textOf(pages[p.id]).includes(GUIDE.pill), `${p.id} says the guide is scripted`);
    assert.doesNotMatch(html, /aria-disabled="true"/, `${p.id}: nothing is left pending`);
  }
});

test('the case pages walk in a loop and offer both ways out', () => {
  const total = PROJECTS.length;
  assert.ok(textOf(pages.loop).includes(`Loop Conductor · 1 of ${total}`), 'subtitle counts the position');
  assert.ok(textOf(pages.loop).includes(`1 / ${total}`), 'footer counter');
  assert.ok(tagWithHref(pages.loop, '/work'), '← All work');
  assert.ok(tagWithHref(pages.loop, '/'), 'close goes home');

  // A case page carries exactly two /work/<id> links: previous, then next.
  const nav = (id) => {
    const tags = openTags(markup(pages[id]), 'a').filter((a) => /href="\/work\/[a-z0-9-]+"/.test(a));
    assert.equal(tags.length, 2, `${id} has previous and next`);
    return { prev: tags[0], next: tags[1] };
  };
  // loop is first: previous wraps to amm (last), next is live.
  assert.match(nav('loop').prev, /href="\/work\/amm"/);
  assert.match(nav('loop').next, /href="\/work\/live"/);
  // amm is last: next wraps back to loop.
  assert.match(nav('amm').next, /href="\/work\/loop"/);
  assert.ok(textOf(pages.amm).includes(`${total} / ${total}`), 'amm is the last of three');

  PROJECTS.forEach((p, i) => {
    assert.ok(textOf(pages[p.id]).includes(`${p.name} · ${i + 1} of ${total}`), `${p.id} subtitle`);
    assert.ok(textOf(pages[p.id]).includes(WORK.prev) && textOf(pages[p.id]).includes(WORK.next));
  });
});

const cardFor = (galleryHtml, id) => cardsOf(galleryHtml)[PROJECTS.findIndex((p) => p.id === id)];

test('a cover file replaces the placeholder, on both screens, with no code change', () => {
  const views = [
    ['card', cardFor(pages.gallery, COVER_ID)],
    ['case', markup(pages[COVER_ID])],
  ];
  for (const [where, html] of views) {
    assert.match(html, new RegExp(`<img[^>]+src="${COVER_SRC}"`), `${where} renders the cover`);
    assert.ok(html.includes('alt="AMM DEX"'), `${where} cover is labelled`);
    assert.ok(!html.includes(SITE.imageSlot), `${where} drops the slot caption once a file exists`);
  }
});

test('without a cover file the ported diagram stands in, captioned as a slot', () => {
  const views = [
    ['amm card', cardFor(noCover.gallery, COVER_ID)],
    ['amm case', markup(noCover[COVER_ID])],
  ];
  for (const [where, html] of views) {
    assert.match(html, /<figure[^>]*>[\s\S]*?<svg/, `${where} renders ProjectArt`);
    assert.ok(html.includes(SITE.imageSlot), `${where} says the image is a slot`);
    assert.doesNotMatch(html, /<img[^>]+src="\/projects\//, `${where} has no cover to show`);
  }
});

test('the overview goes single column below 1000px and stacks the card below 560px', () => {
  const css = read('../src/components/WorkGallery.module.css');
  assert.match(squash(css), /\.gallery \{[^}]*grid-template-columns: 1fr 1fr/);
  assert.match(squash(css), /\.featured \{[^}]*grid-column: 1 \/ -1/);
  const narrow = squash(mediaBlock(css, 1000));
  assert.match(narrow, /\.gallery \{[^}]*grid-template-columns: 1fr/);
  assert.match(narrow, /\.gtag \{[^}]*display: none/, 'the featured card degrades to a normal one');
  const phone = squash(mediaBlock(css, 560));
  assert.match(phone, /\.gcard,\s*\.featured \{[^}]*grid-template-columns: 1fr/, 'image over text');
});

test('the case page goes single column below 900px and unsticks the figure', () => {
  const css = read('../src/components/WorkCase.module.css');
  assert.match(squash(css), /\.case \{[^}]*grid-template-columns: 1\.05fr 1fr/);
  assert.match(squash(css), /\.fig \{[^}]*position: sticky/);
  const narrow = squash(mediaBlock(css, 900));
  assert.match(narrow, /\.case \{[^}]*grid-template-columns: 1fr/);
  assert.match(narrow, /\.fig \{[^}]*position: static/);
});

test('nothing on either screen can push the page wider than a 375px viewport', () => {
  // No browser here: assert the rules that keep the layout inside the viewport.
  const gallery = squash(read('../src/components/WorkGallery.module.css'));
  const cover = squash(read('../src/components/ProjectCover.module.css'));
  const shell = squash(read('../src/components/WorkShell.module.css'));
  assert.match(cover, /\.frame \{[^}]*max-width: 100%/);
  assert.match(shell, /\.ovBody \{[^}]*overflow: auto/);
  assert.doesNotMatch(gallery, /min-width:\s*(?:[4-9]\d\d|\d{4,})px/, 'no card wider than a phone');
  assert.match(squash(mediaBlock(read('../src/components/WorkShell.module.css'), 560)), /padding-left: 16px/);
});
