# src/content/blog — the posts

One Markdown file per post, named `YYYY-MM-DD-<slug>.md`. The date orders the
list, the slug is the URL (`/blog/<slug>`), and any file that does not match
that name (this README, drafts you keep as `notes-*.md`, …) is ignored.

```markdown
---
title: What the post is called
summary: One or two sentences shown in the list.
tags: [fintech, agents]
cover: cover.jpg                  # optional — a photo in public/blog/<slug>/; cover.* is auto-detected
coverCaption: Where the photo was taken   # optional
draft: true                       # optional — keeps the post out of the build
---

Ordinary Markdown from here on.

![Alt text](photo-1.jpg "This quoted title becomes the caption.")
```

- **Photos** go in `public/blog/<slug>/` and are referenced by file name only
  (`photo-1.jpg`). Absolute URLs (`/…`, `https://…`) are left untouched.
- **Charts and screenshots** should not be the cover (the cover is cropped). Leave
  `cover` out and put them in the body: they keep their shape there, and the list uses
  the first image in the post as the thumbnail.
- **One photo alone in a paragraph** renders as a figure with its caption;
  **two or more in the same paragraph** (one per line, no blank line between) render
  as a grid.
- **Reading time** is computed from the text (English words and CJK characters).
- **A duplicate slug fails the build** rather than shipping two posts on one URL.

See `CONTENT.md` at the repository root for the full contract.
