# public/projects — the image slot

One folder per project, named after its `id` in `src/content/projects.ts`:

```
public/projects/<id>/cover.webp     ← preferred
public/projects/<id>/cover.png      ← fallback
public/projects/<id>/cover.jpg      ← fallback
```

`src/lib/projectMedia.ts` looks for those three names in that order at build time.
The first file that exists becomes the cover on `/work` and `/work/<id>`; with no
file, the ported mock diagram renders instead, captioned `SITE.imageSlot`.

- **Aspect ratio 4:3** — the frame crops with `object-fit: cover`. 1600×1200 webp is a good default.
- **Changing an image is overwriting a file.** Adding one is dropping a file. No code changes.
- File name and folder are the whole contract: no import, no registry entry, no `status` change.

Everything else about a project — its copy, its links, its `status`, and every
figure with its `statsNote` provenance — lives in `src/content/projects.ts`.
See `CONTENT.md` at the repository root.
