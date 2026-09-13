// Content red lines: links, copy and project data must stay exactly as approved.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EMAIL, MAILTO, GITHUB, LINKEDIN, X, SOCIALS } from '../src/content/links.ts';
import { HERO, HOW_I_BUILD, SITE } from '../src/content/copy.ts';
import { PROJECTS, LOOKING, projectById } from '../src/content/projects.ts';

test('links are the ones Pulin provided', () => {
  assert.equal(LINKEDIN, 'https://www.linkedin.com/in/pulin-tang-52b559367/');
  assert.equal(X, 'https://x.com/home');
  assert.equal(GITHUB, 'https://github.com/jupiter-Pulin');
  assert.ok(MAILTO.startsWith(`mailto:${EMAIL}?subject=`));
  assert.equal(SOCIALS.length, 3);
});

test('hero and window copy are verbatim from the approved mock', () => {
  assert.equal(HERO.badge, 'Building at the intersection of fintech × AI');
  assert.equal(HERO.headline, 'I build products that turn complex systems into simple experiences.');
  assert.ok(HERO.headline.endsWith(HERO.headlineAccent));
  assert.equal(HOW_I_BUILD.title, 'How I Build');
  assert.equal(HOW_I_BUILD.steps.length, 5);
  assert.equal(HOW_I_BUILD.steps[HOW_I_BUILD.activeStep - 1].name, 'Build');
  assert.equal(HOW_I_BUILD.terminal.lines.length, 5);
  assert.equal(HOW_I_BUILD.ship.stats.length, 3);
  assert.equal(SITE.title, 'Pulin Tang');
});

test('four projects with unique ids, required fields and honest source links', () => {
  assert.equal(PROJECTS.length, 4);
  assert.equal(new Set(PROJECTS.map((p) => p.id)).size, 4);
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
  assert.deepEqual(PROJECTS.map((p) => p.id), ['loop', 'live', 'chain', 'amm'], 'registry order; the first is featured');
  assert.equal(projectById('nope'), undefined);
  assert.ok(LOOKING.startsWith('Backend or full-stack work'));
});
