// Landing page contract: build the site, serve it, and assert the served HTML
// against src/content. No browser, no test framework — fetch plus string checks.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { HERO, HOW_I_BUILD, SITE } from '../src/content/copy.ts';
import { GUIDE } from '../src/content/guide.ts';
import { EMAIL, MAILTO, SOCIALS } from '../src/content/links.ts';
import { PROJECTS } from '../src/content/projects.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const NEXT = fileURLToPath(new URL('../node_modules/.bin/next', import.meta.url));

const decode = (s) =>
  s
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** Visible text only: scripts (and the RSC payload inside them) are dropped. */
const textOf = (html) =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();

/** The opening tag that carries `href="<url>"`, with entities decoded. */
const tagWithHref = (html, url) => {
  const found = decode(html).match(
    new RegExp(`<[a-z]+\\b[^>]*href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'i'),
  );
  return found ? found[0] : null;
};

const freePort = () =>
  new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });

let server;
let base;
const pages = {};

const get = async (path) => {
  const res = await fetch(`${base}${path}`);
  return { status: res.status, html: await res.text() };
};

before(async () => {
  execFileSync(NEXT, ['build'], { cwd: ROOT, stdio: 'ignore' });
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  server = spawn(NEXT, ['start', '-p', String(port)], { cwd: ROOT, stdio: 'ignore' });

  const deadline = Date.now() + 60_000;
  for (;;) {
    try {
      const res = await fetch(base);
      if (res.ok) {
        pages.home = await res.text();
        break;
      }
    } catch {
      // server not up yet
    }
    assert.ok(Date.now() < deadline, 'next start did not become ready');
    await delay(250);
  }
});

after(() => server?.kill());

test('the landing page renders the hero copy verbatim from src/content', async () => {
  const body = textOf(pages.home);
  assert.match(pages.home, new RegExp(`<title>${SITE.title}</title>`));
  assert.ok(body.includes(HERO.badge), 'hero badge');
  assert.ok(body.includes(HERO.headline), 'full headline, accent span included');
  assert.ok(body.includes(HERO.lede), 'lede');
  assert.ok(body.includes(HERO.ctaWork), 'view my work');
  assert.ok(body.includes(HERO.ctaHire), 'hire me');
  assert.ok(body.includes(HERO.ctaCopy), 'copy email');
  assert.ok(body.includes(HERO.tiltHint), 'tilt hint');
});

test('the How I Build card renders every step, log line and ship stat', () => {
  const body = textOf(pages.home);
  assert.ok(body.includes(HOW_I_BUILD.title), 'card title');
  assert.ok(body.includes(HOW_I_BUILD.flow), 'flow line');
  assert.ok(body.includes(HOW_I_BUILD.live), 'live badge');
  assert.ok(body.includes(HOW_I_BUILD.subtitle), 'card subtitle');
  for (const step of HOW_I_BUILD.steps) {
    assert.ok(body.includes(`${step.n}. ${step.name}`), `step ${step.name}`);
    assert.ok(body.includes(step.desc), `step desc ${step.name}`);
  }
  assert.ok(body.includes(HOW_I_BUILD.terminal.prompt), 'terminal prompt');
  for (const line of HOW_I_BUILD.terminal.lines) assert.ok(body.includes(line), line);
  assert.ok(body.includes(HOW_I_BUILD.terminal.shipping), 'shipping line stays');
  assert.ok(body.includes(HOW_I_BUILD.ship.title), 'ship title');
  assert.ok(body.includes(HOW_I_BUILD.ship.text), 'ship text');
  for (const stat of HOW_I_BUILD.ship.stats) {
    assert.ok(body.includes(stat.v), stat.v);
    assert.ok(body.includes(stat.l), stat.l);
  }
});

test('the build log starts unticked and keeps the shipping line spinning', () => {
  // The five lines must arrive as work still to do — a page that ships them
  // already ticked would satisfy the copy assertions but lose the animation.
  const ticks = pages.home.match(/data-done="(true|false)"/g) ?? [];
  assert.deepEqual(ticks, Array(HOW_I_BUILD.terminal.lines.length).fill('data-done="false"'));
  assert.ok(
    textOf(pages.home).includes(HOW_I_BUILD.terminal.shipping),
    'Shipping... is not part of the checklist and never ticks',
  );
});

test('the toast host ships with the page, empty and hidden', () => {
  const tag = pages.home.match(/<div[^>]*class="toast"[^>]*>/i);
  assert.ok(tag, 'no toast element for copy email to write into');
  assert.match(tag[0], /role="status"/);
  assert.match(tag[0], /aria-live="polite"/);
  assert.match(tag[0], /hidden(=""|\s|>)/, 'the toast is hidden until something is copied');
});

test('the hero card announces the tilt hint it will swap on pin', () => {
  const body = textOf(pages.home);
  assert.ok(body.includes(HERO.tiltHint), 'unpinned hint');
  assert.ok(!body.includes(HERO.tiltPinned), 'the pinned hint only appears after a click');
});

test('header socials use the links.ts urls and open in a new tab', () => {
  for (const social of SOCIALS) {
    const tag = tagWithHref(pages.home, social.href);
    assert.ok(tag, `no <a> for ${social.label} (${social.href})`);
    assert.match(tag, /^<a\b/);
    assert.match(tag, /target="_blank"/);
    assert.match(tag, /rel="noopener"/);
    assert.match(tag, new RegExp(`aria-label="${social.label}"`));
    assert.match(tag, new RegExp(`title="${social.title}"`));
  }
});

test('"Any question?" opens the scripted guide drawer', () => {
  const home = decode(pages.home);
  // The placeholder shipped disabled; the drawer it was waiting for is here now.
  assert.equal(
    /<[a-z]+\b[^>]*aria-disabled="true"[^>]*>/i.test(home),
    false,
    'nothing is still disabled',
  );
  assert.ok(!home.includes('Coming in a later task'), 'no pending title is left');

  const tag = home.match(/<button\b[^>]*aria-haspopup="dialog"[^>]*>/);
  assert.ok(tag, 'the header button announces the dialog it opens');
  assert.ok(textOf(pages.home).includes(SITE.askLabel), 'ask label');

  // The drawer renders once, under the page, and says what it is before it is asked.
  assert.match(home, /role="dialog"/, 'the drawer is on the page');
  assert.match(home, /aria-modal="true"/);
  assert.match(home, /aria-labelledby="ask-title"/);
  const text = textOf(pages.home);
  assert.ok(text.includes(GUIDE.pill), 'the guide is labelled as a scripted mock');
  assert.ok(text.includes(GUIDE.send), 'the question form is there');
});

test('Hire Me points at the prefilled mailto from links.ts', () => {
  const tag = tagWithHref(pages.home, MAILTO);
  assert.ok(tag, 'no element with the MAILTO href');
  assert.match(tag, /^<a\b/);
  assert.ok(MAILTO.includes('subject='), 'mailto keeps its prefilled subject');
  assert.ok(textOf(pages.home).includes(EMAIL), 'footer shows the address');
});

test('selected work tiles link to /work/<id> and show role, name and short', () => {
  const body = textOf(pages.home);
  assert.ok(body.includes(SITE.stripTitle), 'strip eyebrow');
  assert.ok(body.includes(SITE.stripOpenAll), 'open all');
  for (const p of PROJECTS) {
    const tag = tagWithHref(pages.home, `/work/${p.id}`);
    assert.ok(tag, `no link to /work/${p.id}`);
    assert.match(tag, /^<a\b/);
    assert.ok(body.includes(`${p.role} ${p.name} ${p.short}`), `tile content for ${p.id}`);
  }
  assert.ok(tagWithHref(pages.home, '/work'), 'View My Work / open all link to /work');
});

test('footer carries the identity block and the three text links', () => {
  const body = textOf(pages.home);
  assert.ok(body.includes(SITE.name), 'name');
  assert.ok(body.includes(SITE.location), 'location');
  assert.ok(body.includes(SITE.footNote), 'foot note');
  for (const social of SOCIALS) assert.ok(body.includes(social.label), social.label);
});

test('/work lists the four projects and links back home', async () => {
  const { status, html } = await get('/work');
  assert.equal(status, 200);
  const body = textOf(html);
  assert.ok(body.includes(SITE.workTitle), 'work title');
  for (const p of PROJECTS) {
    assert.ok(body.includes(p.name), p.name);
    assert.ok(tagWithHref(html, `/work/${p.id}`), `link to /work/${p.id}`);
  }
  assert.ok(tagWithHref(html, '/'), 'link back to /');
});

test('/work/<id> names the project; an unknown id is a 404', async () => {
  for (const p of PROJECTS) {
    const { status, html } = await get(`/work/${p.id}`);
    assert.equal(status, 200, `/work/${p.id}`);
    assert.ok(textOf(html).includes(p.name), `/work/${p.id} names ${p.name}`);
  }
  const missing = await get('/work/nope');
  assert.equal(missing.status, 404);
});
