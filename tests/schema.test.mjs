// Registry shape. Adding a project is a data edit (see CONTENT.md), so the rules
// that make a record renderable have to be checkable without reading a component.
import test from 'node:test';
import assert from 'node:assert/strict';
import { PROJECTS } from '../src/content/projects.ts';
import { HUES, STATUSES, validateProject } from '../src/lib/projectSchema.ts';

const byId = (id) => PROJECTS.find((p) => p.id === id);

test('every shipped record satisfies the schema', () => {
  for (const p of PROJECTS) {
    assert.deepEqual(validateProject(p), [], `${p.id} must be legal`);
  }
});

test('ids are url-safe, hues and statuses come from the enum', () => {
  for (const p of PROJECTS) {
    assert.match(p.id, /^[a-z0-9-]+$/, `${p.id} is the /work/<id> segment`);
    assert.ok(HUES.includes(p.hue), `${p.id}.hue`);
    if (p.status !== undefined) assert.ok(STATUSES.includes(p.status), `${p.id}.status`);
  }
  assert.deepEqual(HUES, ['cyan', 'amber', 'blue', 'green', 'violet']);
  assert.deepEqual(STATUSES, ['shipped', 'building', 'archived']);
  // The four approved records predate the field: absent means shipped.
  assert.deepEqual(PROJECTS.map((p) => p.status), Array(PROJECTS.length).fill(undefined));
});

// No shipped record is private, so the private rules run on a public record made private.
const asPrivate = (p) => ({ ...p, private: true, scope: 'Scope note.', repos: [] });

test('a private record that links a repository is rejected', () => {
  assert.deepEqual(validateProject(asPrivate(byId('loop'))), [], 'a well-formed private record is legal');
  const leaky = { ...asPrivate(byId('loop')), repos: [{ label: 'x', url: 'https://github.com/x/y' }] };
  const errors = validateProject(leaky);
  assert.ok(errors.length > 0, 'private + repos must not validate');
  assert.match(errors.join('\n'), /must not link a repository/);
});

test('a private record without a scope note is rejected', () => {
  const errors = validateProject({ ...asPrivate(byId('loop')), scope: '' });
  assert.match(errors.join('\n'), /needs a scope note/);
});

test('public records must point at github.com, in readmeUrl and in every repo', () => {
  const loop = byId('loop');
  assert.match(validateProject({ ...loop, readmeUrl: 'https://example.com/r' }).join('\n'), /readmeUrl/);
  assert.match(
    validateProject({ ...loop, repos: [{ label: 'mirror', url: 'https://gitlab.com/a/b' }] }).join('\n'),
    /must be a github.com link/,
  );
  assert.match(validateProject({ ...loop, repos: [] }).join('\n'), /at least one repo/);
});

test('an unknown hue, status or id shape is rejected', () => {
  const loop = byId('loop');
  assert.match(validateProject({ ...loop, hue: 'pink' }).join('\n'), /hue must be one of/);
  assert.match(validateProject({ ...loop, status: 'draft' }).join('\n'), /status must be one of/);
  assert.match(validateProject({ ...loop, id: 'Loop Conductor' }).join('\n'), /id must match/);
  assert.deepEqual(validateProject({ ...loop, status: 'building' }), []);
});
