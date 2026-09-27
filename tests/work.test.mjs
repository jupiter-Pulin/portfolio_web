// The /work screens, asserted against the build artifacts. `next build` prerenders
// the overview and the five case pages to HTML, so no server and no browser is needed.
// One project's cover is set aside for an extra build so both halves of the image
// slot — a real image, and the placeholder — are covered by the same test run.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HOME, SITE, WORK } from '../src/content/copy.ts';
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

test('the gallery shows the five projects in registry order, featured first', () => {
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

  assert.match(cards[0], /<article [^>]*class="[^"]*feature/, 'the first card is the wide one');
  for (let i = 1; i < cards.length; i++) {
    assert.doesNotMatch(cards[i], /<article [^>]*class="[^"]*feature/, `card ${i} is not wide`);
  }
});

test('a card links only inside the site; a private one says so and names no repository', () => {
  const cards = cardsOf(pages.gallery);
  PROJECTS.forEach((p, i) => {
    const external = openTags(cards[i], 'a').filter((a) => a.includes('target="_blank"'));
    assert.equal(external.length, 0, `${p.id}: the case page is where links go out`);
    assert.ok(textOf(cards[i]).includes(HOME.readCase), `${p.id} read the case`);
    assert.match(cards[i], new RegExp(`data-scope="${p.id}"`), `${p.id} can be asked about`);
    if (p.private) {
      assert.ok(textOf(cards[i]).includes(HOME.stamps.private), `${p.id} says the repository is private`);
      assert.doesNotMatch(cards[i], /github\.com/, `no repository link anywhere on the ${p.id} card`);
    }
  });
});

test('the whole card opens its case: "Read the case" is stretched over it', () => {
  const cards = cardsOf(pages.gallery);
  PROJECTS.forEach((p, i) => {
    const open = openTags(cards[i], 'a').filter((a) => a.includes(`href="/work/${p.id}"`) && /class="[^"]*__open[\s"]/.test(a));
    assert.equal(open.length, 1, `${p.id}: one stretched case link`);
  });
  const css = read('../src/components/ProjectCard.module.css');
  assert.match(css, /\.open::after\s*{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*z-index:\s*1;/, 'the link covers the card');
  assert.match(css, /\.name a,\s*\.ask\s*{[^}]*position:\s*relative;[^}]*z-index:\s*2;/, 'the name and "ask about it" stay clickable above it');
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
  for (const key of ['role', 'name', 'tagline', 'thesis', 'wrong', 'mechanism']) {
    assert.ok(body.includes(p[key]), `loop ${key}`);
  }
  for (const part of p.stack.split(' · ')) assert.ok(body.includes(part), `loop stack: ${part}`);
  assert.ok(body.includes(WORK.wrong) && body.includes(WORK.mechanism), 'the two pair labels');
  // Loop Conductor shows no run figures; a project that has figures shows each one.
  assert.equal(p.stats.length, 0);
  const live = projectById('live');
  assert.equal(live.stats.length, 4);
  for (const s of live.stats) {
    assert.ok(textOf(pages.live).includes(s.v), `stat ${s.v}`);
    assert.ok(textOf(pages.live).includes(s.l), `stat ${s.l}`);
  }
  assert.match(pages.loop, /<title>Loop Conductor · Nolan Tang<\/title>/);

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
  const privates = PROJECTS.filter((x) => x.private);
  assert.ok(privates.length > 0, 'platter is private');
  for (const p of privates) {
    const body = textOf(pages[p.id]);
    assert.ok(body.includes(WORK.privateRepo), `${p.id} lock label`);
    assert.ok(body.includes(p.scope), `${p.id} scope note`);
    // The header and footer link the GitHub account; the case itself links no repository.
    const html = markup(pages[p.id]);
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    assert.doesNotMatch(main, /github\.com/, `no github link in the ${p.id} case`);
    if (p.readme) {
      // Design notes stand in for the private README: shown in full, scrollable, not a clipped preview.
      assert.ok(body.includes(WORK.privateNotes), `${p.id} notes label`);
      const pre = markup(pages[p.id]).match(/<pre\b[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/pre>/);
      assert.ok(pre, `${p.id} notes are a <pre>`);
      assert.match(pre[1], /notes/, `${p.id} notes scroll in place`);
      assert.equal(pre[2].split('\n')[0], p.readme.split('\n')[0]);
    }
  }
});

test('a demo takes the cover slot, the live site is linked, the architecture spans the page', () => {
  const p = projectById('platter');
  const html = markup(pages.platter);
  const video = openTags(html, 'video');
  assert.equal(video.length, 1, 'one walkthrough video');
  assert.ok(video[0].includes(`src="${p.demo.src}"`) && video[0].includes(`poster="${p.demo.poster}"`), 'video src and poster');
  assert.match(video[0], /preload="none"/, 'nothing downloads before play');
  assert.match(video[0], /controls/);
  assert.ok(textOf(pages.platter).includes(p.demo.caption), 'demo caption');

  const site = tagWithHref(pages.platter, p.site.url);
  assert.ok(site && /target="_blank"/.test(site) && /rel="noopener"/.test(site), 'live site opens safely');
  assert.ok(textOf(pages.platter).includes(`${WORK.visitSite} ${p.site.label}`), 'live site label');

  const img = openTags(html, 'img').find((t) => t.includes(`src="${p.architecture.src}"`));
  assert.ok(img, 'architecture image');
  assert.ok(img.includes(`alt="${p.architecture.alt}"`), 'architecture alt text');
  assert.ok(textOf(pages.platter).includes(p.architecture.caption), 'architecture caption');
  assert.ok(tagWithHref(pages.platter, p.architecture.src), 'full-size link');

  // The other cases keep their cover; the only video they may carry is their explainer.
  for (const q of PROJECTS.filter((x) => !x.demo)) {
    const vids = openTags(markup(pages[q.id]), 'video');
    assert.equal(vids.length, q.explainer ? 1 : 0, `${q.id} videos`);
    if (q.explainer) assert.ok(vids[0].includes(`src="${q.explainer.src}"`), `${q.id}: the one video is its explainer`);
  }
  // A private card on the overview still links nothing out: the site lives on the case page.
  assert.doesNotMatch(cardFor(pages.gallery, 'platter'), /platterfi\.trade"/);
});

test('an explainer takes the README preview\'s place; the README stays one click away', () => {
  const withExplainer = PROJECTS.filter((x) => x.explainer);
  assert.deepEqual(withExplainer.map((x) => x.id), ['loop', 'live']);
  for (const p of withExplainer) {
    const html = markup(pages[p.id]);
    const video = openTags(html, 'video');
    assert.equal(video.length, 1, `${p.id}: one explainer video`);
    assert.ok(video[0].includes(`src="${p.explainer.src}"`) && video[0].includes(`poster="${p.explainer.poster}"`), `${p.id}: video src and poster`);
    assert.match(video[0], /preload="none"/, `${p.id}: nothing downloads before play`);
    assert.match(video[0], /controls/);
    assert.ok(textOf(pages[p.id]).includes(WORK.explainerFile), `${p.id}: panel title`);
    assert.ok(textOf(pages[p.id]).includes(p.explainer.caption), `${p.id}: explainer caption`);
    assert.doesNotMatch(html, /<pre\b/, `${p.id}: no README preview beside the video`);
    assert.ok(tagWithHref(pages[p.id], p.readmeUrl), `${p.id}: Open README on GitHub`);
    // The page drops the preview, not the text: the assistant still answers from the README.
    assert.ok(p.readme, `${p.id} keeps its README text`);
  }
  assert.ok(projectById('loop').readme.startsWith('# Loop Conductor'));
});

test('README notes: a caveat bar with a preview, plain copy without one', () => {
  for (const id of ['live']) {
    const p = projectById(id);
    const note = markup(pages[id]).match(/<p class="[^"]*rmNote[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    assert.ok(note, `${id} shows the amber README note bar`);
    assert.equal(note[1], p.readmeNote);
    // The caveat is about the README behind the link, so it stays when an explainer replaces the preview.
    if (p.explainer) assert.equal(openTags(markup(pages[id]), 'video').length, 1, `${id} shows its explainer`);
    else assert.ok(markup(pages[id]).includes('<pre'), `${id} still previews the README`);
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
  assert.ok(textOf(pages.platter).includes(`Platter · 1 of ${total}`), 'subtitle counts the position');
  assert.ok(textOf(pages.platter).includes(`1 / ${total}`), 'footer counter');
  assert.ok(tagWithHref(pages.loop, '/work'), '← All work');
  assert.ok(tagWithHref(pages.loop, '/'), 'close goes home');

  // A case page carries exactly two /work/<id> links: previous, then next.
  const nav = (id) => {
    const tags = openTags(markup(pages[id]), 'a').filter((a) => /href="\/work\/[a-z0-9-]+"/.test(a));
    assert.equal(tags.length, 2, `${id} has previous and next`);
    return { prev: tags[0], next: tags[1] };
  };
  // platter is first: previous wraps to amm (last), next is loop.
  assert.match(nav('platter').prev, /href="\/work\/amm"/);
  assert.match(nav('platter').next, /href="\/work\/loop"/);
  // amm is last: next wraps back to platter.
  assert.match(nav('amm').next, /href="\/work\/platter"/);
  assert.ok(textOf(pages.amm).includes(`${total} / ${total}`), 'amm is the last of five');

  PROJECTS.forEach((p, i) => {
    assert.ok(textOf(pages[p.id]).includes(`${p.name} · ${i + 1} of ${total}`), `${p.id} subtitle`);
    assert.ok(textOf(pages[p.id]).includes(WORK.prev) && textOf(pages[p.id]).includes(WORK.next));
  });
});

const cardFor = (galleryHtml, id) => cardsOf(galleryHtml)[PROJECTS.findIndex((p) => p.id === id)];

test('a cover file replaces the placeholder on the case page, with no code change', () => {
  const html = markup(pages[COVER_ID]);
  assert.match(html, new RegExp(`<img[^>]+src="${COVER_SRC}"`), 'the case renders the cover');
  assert.ok(html.includes('alt="AMM DEX"'), 'the cover is labelled');
  assert.ok(!html.includes(SITE.imageSlot), 'no slot caption once a file exists');
  // The cards draw the mechanism instead of showing a picture.
  assert.doesNotMatch(cardFor(pages.gallery, COVER_ID), /<img[^>]+src="\/projects\//);
});

test('without a cover file the project drawing stands in, captioned as a slot', () => {
  const html = markup(noCover[COVER_ID]);
  assert.match(html, /<figure[^>]*>[\s\S]*?<svg/, 'the case draws the project');
  assert.ok(html.includes(SITE.imageSlot), 'and says the image is a slot');
  assert.doesNotMatch(html, /<img[^>]+src="\/projects\//, 'no cover to show');
});

test('the overview shares the home page cards: three across, then two, then one', () => {
  const css = read('../src/components/Sections.module.css');
  assert.match(squash(css), /\.cards \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(squash(mediaBlock(css, 1060)), /\.cards \{[^}]*grid-template-columns: 1fr 1fr/);
  assert.match(squash(mediaBlock(css, 680)), /\.cards \{[^}]*grid-template-columns: 1fr/);
  assert.match(read('../src/components/WorkGallery.tsx'), /<ProjectCard /);
});

test('the case page goes single column below 1060px and unsticks the figure', () => {
  const css = read('../src/components/WorkCase.module.css');
  assert.match(squash(css), /\.case \{[^}]*grid-template-columns: 1\.05fr 1fr/);
  assert.match(squash(css), /\.figCol \{[^}]*position: sticky/);
  const narrow = squash(mediaBlock(css, 1060));
  assert.match(narrow, /\.case \{[^}]*grid-template-columns: 1fr/);
  assert.match(narrow, /\.figCol \{[^}]*position: static/);
});

test('nothing on either screen can push the page wider than a 375px viewport', () => {
  // No browser here: assert the rules that keep the layout inside the viewport.
  const cards = squash(read('../src/components/Sections.module.css') + read('../src/components/ProjectCard.module.css'));
  const cover = squash(read('../src/components/ProjectCover.module.css'));
  assert.match(cover, /\.frame \{[^}]*max-width: 100%/);
  assert.doesNotMatch(cards, /min-width:\s*(?:[4-9]\d\d|\d{4,})px/, 'no card wider than a phone');
  assert.match(squash(mediaBlock(read('../src/components/WorkCase.module.css'), 680)), /\.page \{[^}]*padding: 18px 16px/);
  assert.match(squash(read('../src/components/WorkCase.module.css')), /\.rmBody \{[^}]*overflow: auto/, 'a README scrolls inside its box');
});
