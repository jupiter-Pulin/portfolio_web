# Updating the site content

This site is meant to keep absorbing new work without anyone editing a component.
Everything below is a data edit or a file drop; the table says which file to touch.

| I want to… | Edit this |
| --- | --- |
| Add a project | `src/content/projects.ts` — append to `PROJECTS` |
| Reorder the work, change what is featured | `src/content/projects.ts` — array order |
| Replace or add a cover image | `public/projects/<id>/cover.webp` (see below) |
| Change a README preview or its caveat | `src/content/projects.ts` — `readme` / `readmeNote` |
| Change a figure or where it came from | `src/content/projects.ts` — `stats` / `statsNote`, `points` / `pointsNote` |
| Add drawings, "Under the hood" cards or a live / fork line to a case page | `src/content/projects.ts` — `figures` / `points` / `rollout`, drawings in `CASE_ART` in `src/lib/sketchArt.ts` (see below) |
| Change a repository or README link | `src/content/projects.ts` — `readmeUrl` / `repos` |
| Link a live product, add a demo video, an explainer video or a diagram | `src/content/projects.ts` — `site` / `demo` / `explainer` / `architecture` + files in `public/projects/<id>/` (see below) |
| Publish a blog post | `src/content/blog/YYYY-MM-DD-<slug>.md` + photos in `public/blog/<slug>/` (see below) |
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
  No repository link is rendered anywhere, and the page carries no README panel: the scope
  note is given to the assistant, not shown.

Nothing else is needed. `/work`, `/work/<id>`, `generateStaticParams`, the home page
cards and the previous/next loop all read the same array. A new project also wants a small
diagram for its card: add an entry to `PROJECT_ART` in `src/lib/sketchArt.ts` (the words in
it go in `ART` in `src/content/copy.ts`); until then its card shows no drawing.

## Covers: the image slot

Drop a file at `public/projects/<id>/cover.webp`; `.png` and `.jpg` also work and are
tried in that order. The build detects it (`src/lib/projectMedia.ts`) and renders it
with `next/image`, `alt` = the project name.

- 4:3, suggested 1600×1200 webp. The frame crops with `object-fit: cover`.
- No file yet → the placeholder diagram renders, captioned "image slot · replace with
  a product screenshot" (`SITE.imageSlot` in `src/content/copy.ts`).
- Replacing an image is overwriting the file. There is no code change and no import.

A project with no diagram of its own (`src/components/ProjectArt.tsx` keys them by
`id`) falls back to a neutral frame until a cover file exists.

## Live site, demo video, explainer and architecture

Four optional fields, for any project — the private ones are what they are for, since
a private record links no repository:

- `site: { label, url }` — the running product. `url` must be `https://` and must not
  be a repository. The case page shows a "Visit <label> ↗" button in the README panel,
  and the guide may give the address. The overview card still links nothing out.
- `demo: { src, poster, caption }` — an `.mp4` and its poster frame, both in
  `public/projects/<id>/`. The video takes the cover's place on the case page, with
  `preload="none"`: nothing downloads until the visitor presses play. The overview
  card keeps using `cover.*`.
- `explainer: { src, poster, caption }` — a hand-drawn explainer `.mp4` and its poster
  frame, both in `public/projects/<id>/`. It takes the README preview's place in the
  README panel (the "Open README on GitHub" link, the `readmeNote` caveat and the
  repository buttons stay), also with `preload="none"`. The record keeps its `readme`
  text: the guide still indexes it.
- `architecture: { src, alt, caption, width, height }` — a diagram in
  `public/projects/<id>/`, shown full width under the case with a link to open it at
  full size. `width` / `height` are the file's pixel size. Or `{ art, alt, caption }`:
  a drawing made in code (below) in the same place, with no full-size link.

`npm test` checks the shapes and that every file a record names exists.

A **private** record may also carry `readme`: notes written for the assistant, since the
real README is not published. The page does not show them; the guide indexes them like
any README (addresses stripped).

## Drawings, "Under the hood" and the live / fork line

Three more optional fields, rendered in this order under the case:

- `figures: [{ art, title, alt, caption }]` — drawings made in code, each under its own
  heading. `art` is a key in `CASE_ART` in `src/lib/sketchArt.ts` (a card drawing from
  `PROJECT_ART` can be reused there, larger); the words inside go in `ART` in
  `src/content/copy.ts`, and `alt` says in a sentence what the drawing shows. A drawing
  keeps a readable width and scrolls sideways inside its frame on a phone.
- `points: [{ t, d, v?, l? }]` + `pointsNote` — the "Under the hood" cards: a title, a
  sentence or two, and optionally a figure `v` with its label `l`. A record whose points
  carry figures needs a `pointsNote` saying where they come from. A record with points
  shows them instead of the thesis callout and the wrong / mechanism pair; those fields
  stay on the record for the assistant.
- `rollout: { live, fork }` — what a visitor can use today and what is built but only
  verified on a mainnet fork, as two tag rows under the tagline.

The card drawing itself is `PROJECT_ART[<id>]`: 320 × 156 by default, or its own `w` / `h`
(the featured card keeps the drawing's proportions).

The guide's LP / DeFi summary lines are `GUIDE.lp` in `src/content/guide.ts`: sent with
every question and indexed, with no answer card of their own. Run
`node scripts/build-ask-index.mjs` after editing any of this.

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
included, is not rendered. The same holds for figures on `points`: they need a
`pointsNote`, rendered under the cards.

## Blog posts

One Markdown file per post in `src/content/blog/`, named `YYYY-MM-DD-<slug>.md`.
The date orders the list (newest first), the slug is the URL (`/blog/<slug>`), and
files that do not match the name (`README.md`, `notes-*.md`) are ignored. The header
between the two `---` lines is a small YAML subset:

```markdown
---
title: What the post is called
summary: One or two sentences shown in the list and under the title.
tags: [fintech, agents]          # or a block list of `- item` lines
cover: cover.jpg                 # optional — photographs only; see below
coverCaption: Where it was taken # optional
draft: true                      # optional — keeps the post out of the list and the build
---

Ordinary Markdown (GitHub flavour: tables, fenced code, task lists).

![Alt text](photo-1.jpg "This quoted title becomes the caption.")
```

- **Photos** live in `public/blog/<slug>/` and are referenced by file name only
  (`photo-1.jpg` → `/blog/<slug>/photo-1.jpg`). URLs and root paths (`/…`) are left as
  written.
- **The cover** (`cover:` in the header, or a `cover.webp|png|jpg|jpeg|svg` file in the
  post's folder) is the article hero (16:9) and the list thumbnail (3:2), both cropped with
  `object-fit: cover`; 1600×1000 is a good source size. Use it for photographs.
- **No cover** is the right choice for charts, diagrams and screenshots, which must not be
  cropped: put the image in the body, where it keeps its own aspect ratio. The article then
  opens without a hero, and the list borrows the first image in the post as its thumbnail,
  anchored to the top edge. A post with no image at all gets a text-only card.
- **One photo alone in a paragraph** renders as a `<figure>` with the quoted title as
  its caption. **Two or more photos in the same paragraph** (one per line, no blank line
  between them) render as a grid — three of them as three columns.
- **Reading time** is derived from the text: English words at 220 per minute plus CJK
  characters at 400 per minute.
- **Drafts** never reach the build; a **duplicate slug fails the build** rather than
  shipping two posts on one URL. A missing header field falls back: `title` to the slug,
  `summary` to nothing, `tags` to none, `date` to the file name.
- The list page chrome (title, search label, chips, empty states) is `BLOG` in
  `src/content/copy.ts`. The Markdown is rendered by `marked` at build time
  (`src/lib/blog.ts`); the file-name and figure rules are tested in `tests/blog.test.mjs`.

## Copy

Page chrome lives in `src/content/copy.ts` (`SITE`, `IDENTITY`, `WORK`, `BLOG`),
contact details in `src/content/links.ts`. Components import from there; never
hardcode a second copy of a string in a component.
