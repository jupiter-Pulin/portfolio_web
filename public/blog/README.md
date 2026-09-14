# public/blog — photos for the posts

One folder per post, named after the post's slug (the file name in
`src/content/blog/` without the date prefix and `.md`):

```
public/blog/<slug>/cover.webp     ← cover, auto-detected (also .png .jpg .jpeg .svg)
public/blog/<slug>/photo-1.jpg    ← anything the post references as ![…](photo-1.jpg)
```

The cover is used as the list thumbnail (3:2) and the article hero (16:9), both
cropped with `object-fit: cover`; 1600×1000 is a good source size. Adding a photo
is dropping a file; the Markdown references it by file name only.
