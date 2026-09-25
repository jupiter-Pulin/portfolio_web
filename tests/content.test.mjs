// Content red lines: links, copy and project data must stay exactly as approved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { EMAIL, MAILTO, GITHUB, LINKEDIN, X, SOCIALS } from '../src/content/links.ts';
import { IDENTITY, SITE } from '../src/content/copy.ts';
import { GUIDE } from '../src/content/guide.ts';
import { PROJECTS, LOOKING, projectById } from '../src/content/projects.ts';

test('links are the ones Pulin provided', () => {
  assert.equal(LINKEDIN, 'https://www.linkedin.com/in/nolan-tang-52b559367/');
  assert.equal(X, 'https://x.com/home');
  assert.equal(GITHUB, 'https://github.com/jupiter-Pulin');
  assert.ok(MAILTO.startsWith(`mailto:${EMAIL}?subject=`));
  assert.equal(SOCIALS.length, 3);
});

test('identity card and guide hero copy are verbatim from the approved mock', () => {
  assert.equal(IDENTITY.status, 'Open to work');
  assert.equal(IDENTITY.role, 'Product-minded software engineer · fintech × AI');
  assert.deepEqual(
    IDENTITY.facts.map((f) => f.label),
    ['Based', 'Looking for', 'Experience', 'Open to'],
  );
  assert.ok(IDENTITY.facts.every((f) => f.text.length > 0));
  assert.equal(GUIDE.hero.headline, "Tell me what you're hiring for, or what you want to see.");
  assert.equal(GUIDE.hero.headlineAccent, "I'll take you there.");
  assert.equal(SITE.title, 'Nolan Tang');
  assert.ok(SITE.description.startsWith('Nolan Tang'), 'the page description names him');
});

test('five projects with unique ids, required fields and honest source links', () => {
  assert.equal(PROJECTS.length, 5);
  assert.equal(new Set(PROJECTS.map((p) => p.id)).size, 5);
  for (const p of PROJECTS) {
    for (const k of ['name', 'short', 'role', 'stack', 'tagline', 'thesis', 'wrong', 'mechanism']) {
      assert.ok(typeof p[k] === 'string' && p[k].length > 0, `${p.id}.${k} missing`);
    }
    for (const k of ['decision', 'stack', 'status']) assert.ok(p.qa[k].length > 0, `${p.id}.qa.${k}`);
    if (p.private) {
      assert.equal(p.repos.length, 0, `${p.id}: private project must not link a repo`);
      assert.ok(p.scope && p.scope.length > 0);
    } else {
      assert.ok(p.readmeUrl.startsWith('https://github.com/'), `${p.id}.readmeUrl`);
      assert.ok(p.repos.length >= 1);
      for (const r of p.repos) assert.ok(r.url.startsWith('https://github.com/'));
    }
    for (const s of p.stats) assert.ok(s.v && s.l, `${p.id} stat`);
  }
  assert.ok(projectById('loop').statsNote.includes('Self-reported'));
  assert.deepEqual(PROJECTS.map((p) => p.id), ['loop', 'guide', 'live', 'amm', 'platter'], 'registry order; the first is featured');
  // Every demo, poster and diagram a record names is a file the build will serve.
  for (const p of PROJECTS) {
    for (const src of [p.demo?.src, p.demo?.poster, p.architecture?.src].filter(Boolean)) {
      assert.ok(existsSync(fileURLToPath(new URL(`../public${src}`, import.meta.url))), `${p.id}: ${src} exists`);
    }
  }
  assert.equal(projectById('nope'), undefined);
  assert.ok(LOOKING.startsWith('Backend or full-stack work'));
});
