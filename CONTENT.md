# Updating the site content

This site is meant to keep absorbing new work without anyone editing a component.
Everything below is a data edit or a file drop; the table says which file to touch.

| I want to… | Edit this |
| --- | --- |
| Add a project | `src/content/projects.ts` — append to `PROJECTS` |
| Reorder the work, change what is featured | `src/content/projects.ts` — array order |
| Replace or add a cover image | `public/projects/<id>/cover.webp` (see below) |
| Change a README preview or its caveat | `src/content/projects.ts` — `readme` / `readmeNote` |
| Change a figure or where it came from | `src/content/projects.ts` — `stats` / `statsNote` |
| Change a repository or README link | `src/content/projects.ts` — `readmeUrl` / `repos` |
| Change contact or social links | `src/content/links.ts` |
| Change page copy (headings, chrome, labels) | `src/content/copy.ts` |

`npm test` runs `tests/schema.test.mjs` over the registry, so a record that breaks
the rules below fails the suite rather than shipping.

## Adding a project

Append one object to `PROJECTS` in `src/content/projects.ts`. Array order is
display order, and the **first entry is the featured card** on `/work`.

Required: `id` (lowercase, digits and dashes only — it is the URL), `name`,
`hue` (`cyan` · `amber` · `blue` · `green` · `violet`), `short`, `role`, `stack`,
`tagline`, `thesis`, `wrong`, `mechanism`, `stats`, `repos`, `readme`, `qa`.

Then:

- **Public project** → `readmeUrl` and every `repos[].url` must be `https://github.com/…`.
- **Private project** → set `private: true`, write a `scope` note, and leave `repos` empty.
  The case page shows a lock and the scope note; no repository link is rendered anywhere.

Nothing else is needed. `/work`, `/work/<id>`, `generateStaticParams`, the landing
strip and the previous/next loop all read the same array.

## Covers: the image slot

Drop a file at `public/projects/<id>/cover.webp`; `.png` and `.jpg` also work and are
tried in that order. The build detects it (`src/lib/projectMedia.ts`) and renders it
with `next/image`, `alt` = the project name.

- 4:3, suggested 1600×1200 webp. The frame crops with `object-fit: cover`.
- No file yet → the ported mock diagram renders, captioned "image slot · replace with
  a product screenshot" (`SITE.imageSlot` in `src/content/copy.ts`).
- Replacing an image is overwriting the file. There is no code change and no import.

A project with no diagram of its own (`src/components/ProjectArt.tsx` keys them by
`id`) falls back to a neutral frame until a cover file exists.

## `status` and `updated`

Both optional, both on the project record:

- `status: 'shipped' | 'building' | 'archived'`. **Absent means shipped** — the existing
  records carry no `status` and must not be rewritten to add one. Only `'building'`
  changes the UI: the overview card gets a small `building` badge.
- `updated: 'YYYY-MM-DD'`. When present it is appended to the case-page eyebrow verbatim,
  as `<role> · updated <date>` — an ISO string, not localised.

## Numbers and their provenance

Every figure shown on the site comes from `stats` on the record, and every `stats`
block that is self-reported carries a `statsNote` saying so. Do not add a number
without one, and do not drop a `statsNote` from a record that has figures — the case
page renders the note directly under the four stat tiles, and it is the only thing
telling a reader where the number came from. With `stats: []` the whole block, note
included, is not rendered.

## Copy

Page chrome lives in `src/content/copy.ts` (`SITE`, `HERO`, `HOW_I_BUILD`, `WORK`),
contact details in `src/content/links.ts`. Components import from there; never
hardcode a second copy of a string in a component.
