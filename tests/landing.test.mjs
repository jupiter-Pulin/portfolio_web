// Landing page contract: build the site, serve it, and assert the served HTML
// against src/content. No browser, no test framework — fetch plus string checks.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { HOME, IDENTITY, SITE } from '../src/content/copy.ts';
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

test('the landing page renders the identity card and the guide from src/content', () => {
  const body = textOf(pages.home);
  assert.match(pages.home, new RegExp(`<title>${SITE.title}</title>`));
  assert.ok(body.includes(IDENTITY.status), 'open to work');
  assert.ok(body.includes(SITE.name) && body.includes(IDENTITY.role), 'name and role');
  for (const f of IDENTITY.facts) assert.ok(body.includes(`${f.label} ${f.text}`), f.label);
  assert.ok(body.includes(IDENTITY.ctaHire) && body.includes(IDENTITY.ctaCopy), 'hire me / copy email');
  const avatar = decode(pages.home).match(/<img\b[^>]*src="\/avatar\.jpg"[^>]*>/);
  assert.ok(avatar, 'the avatar is a plain image from public/');
  assert.ok(avatar[0].includes(`alt="${IDENTITY.avatarAlt}"`), 'the avatar carries its alt text');

  // The assistant arrives with a hello and nothing else: no chat box until it is asked for.
  const { hi, q, cta } = GUIDE.hero.welcome;
  assert.ok(body.includes(`${hi} ${q} ${cta}`) || body.includes(`${hi}${q}${cta}`), 'the welcome bubble is in the page');
  assert.ok(body.includes(GUIDE.hero.stageCaption), 'it says what it is');
  assert.match(decode(pages.home), new RegExp(`aria-label="${GUIDE.hero.robotLabel}"`), 'the robot is a button');
  assert.match(pages.home, /data-state="idle"/, 'the page opens on the stage, not the chat');
  assert.ok(!body.includes(GUIDE.hero.greetLead), 'the chat greeting waits for a click');
  assert.ok(!body.includes(GUIDE.hero.hideChat), 'no chat to hide yet');
  assert.ok(!body.includes('questions a day per visitor') && !body.includes('usually under'), 'no rules line');
  assert.match(pages.home, new RegExp(`maxlength="${GUIDE.limits.maxQuestionChars}"`, 'i'), 'the drawer keeps the question limit');
  assert.ok(!body.includes('How I Build'), 'the old card is gone');
});

test('the toast host ships with the page, empty and hidden', () => {
  const tag = pages.home.match(/<div[^>]*class="toast"[^>]*>/i);
  assert.ok(tag, 'no toast element for copy email to write into');
  assert.match(tag[0], /role="status"/);
  assert.match(tag[0], /aria-live="polite"/);
  assert.match(tag[0], /hidden(=""|\s|>)/, 'the toast is hidden until something is copied');
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

test('"Ask my assistant" opens the assistant', () => {
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
  assert.ok(text.includes(GUIDE.pill), 'the assistant says it answers from site content');
  assert.ok(text.includes(GUIDE.send), 'the question form is there');
});

test('Hire Me points at the prefilled mailto from links.ts', () => {
  const tag = tagWithHref(pages.home, MAILTO);
  assert.ok(tag, 'no element with the MAILTO href');
  assert.match(tag, /^<a\b/);
  assert.ok(MAILTO.includes('subject='), 'mailto keeps its prefilled subject');
  assert.ok(textOf(pages.home).includes(EMAIL), 'footer shows the address');
});

test('the project cards link to /work/<id> and show what each project is', () => {
  const body = textOf(pages.home);
  assert.ok(body.includes(`${HOME.workTitle} ${HOME.workAccent}`), 'section title');
  assert.ok(body.includes(SITE.stripOpenAll), 'open all');
  assert.ok(tagWithHref(pages.home, '/work'), 'open all links to /work');
  for (const p of PROJECTS) {
    const tag = tagWithHref(pages.home, `/work/${p.id}`);
    assert.ok(tag, `no link to /work/${p.id}`);
    assert.match(tag, /^<a\b/);
    assert.match(pages.home, new RegExp(`id="card-${p.id}"`), `${p.id} has a card the assistant can point at`);
    assert.ok(body.includes(p.name) && body.includes(p.role) && body.includes(p.short), `card content for ${p.id}`);
    assert.match(pages.home, new RegExp(`data-scope="${p.id}"`), `${p.id} can be asked about`);
  }
  assert.ok(body.includes(HOME.readCase) && body.includes(HOME.askAbout));
});

test('the newest posts are listed under the work, each linking to its page', () => {
  const body = textOf(pages.home);
  assert.ok(body.includes(`${HOME.notesTitle} ${HOME.notesAccent}`), 'section title');
  assert.ok(tagWithHref(pages.home, '/blog'), 'all posts');
  const links = [...decode(pages.home).matchAll(/href="\/blog\/([a-z0-9-]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(links).size, 4, 'four posts');
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

test('/api/ask is the one dynamic route, and with no env it refuses without leaking', async () => {
  const { readFileSync, readdirSync, statSync } = await import('node:fs');
  const { join } = await import('node:path');
  const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));

  // Route table: every app route is prerendered (○ / ●) except /api/ask (ƒ).
  const appRoutes = Object.values(readJson('.next/app-path-routes-manifest.json'));
  const prerender = readJson('.next/prerender-manifest.json');
  const staticRoutes = Object.keys(prerender.routes);
  assert.ok(staticRoutes.includes('/') && staticRoutes.includes('/work'), '/ and /work are static');
  assert.ok(Object.keys(prerender.dynamicRoutes).includes('/work/[id]'), '/work/[id] is generated from params');
  for (const p of PROJECTS) assert.ok(staticRoutes.includes(`/work/${p.id}`), `/work/${p.id} is prerendered`);
  const dynamic = appRoutes.filter((r) => !staticRoutes.includes(r) && !(r in prerender.dynamicRoutes));
  assert.deepEqual(dynamic, ['/api/ask']);

  const res = await fetch(`${base}/api/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question: 'hi', scopeId: null }),
  });
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { ok: false, error: 'system' });

  // Nothing server-only reaches the browser bundle, and no public env prefix exists.
  const walk = (dir) =>
    readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
  for (const file of walk(join(ROOT, '.next/static'))) {
    const text = readFileSync(file, 'utf8');
    for (const name of ['ASK_MODEL_API_KEY', 'UPSTASH_REDIS_REST_TOKEN']) {
      assert.ok(!text.includes(name), `${file} mentions ${name}`);
    }
  }
  const publicPrefix = ['NEXT', 'PUBLIC', ''].join('_');
  const skip = new Set(['node_modules', '.next', '.git']);
  const repoFiles = (dir) =>
    readdirSync(dir).flatMap((f) => {
      if (skip.has(f)) return [];
      const path = join(dir, f);
      return statSync(path).isDirectory() ? repoFiles(path) : [path];
    });
  for (const file of repoFiles(ROOT)) {
    assert.ok(!readFileSync(file, 'utf8').includes(publicPrefix), `${file} uses a public env prefix`);
  }
});
