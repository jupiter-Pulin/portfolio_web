"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BLOG } from "@/content/copy";
import type { PostMeta } from "@/lib/blog";
import { allTags, filterPosts, groupByYear } from "@/lib/blogText";
import { Icon } from "./Icon";
import styles from "./BlogIndex.module.css";

// The title ends with the gradient-rendered accent; both halves come from BLOG.
const titleLead = BLOG.title.slice(0, BLOG.title.length - BLOG.titleAccent.length);

/**
 * The /blog list: search box + tag chips filter the posts the server loaded,
 * grouped by year. Client component only for the two bits of filter state; the
 * posts arrive as plain data, already sorted newest first.
 */
export function BlogIndex({ posts }: { posts: PostMeta[] }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const tags = useMemo(() => allTags(posts), [posts]);
  const rows = filterPosts(posts, { q, tag });
  const years = groupByYear(rows);
  const count =
    rows.length === posts.length
      ? `${posts.length} ${posts.length === 1 ? BLOG.postOne : BLOG.postMany}`
      : `${rows.length} ${BLOG.of} ${posts.length} ${BLOG.postMany}`;

  return (
    <>
      <section className={styles.pageHead}>
        <div>
          <p className="eyebrow">{BLOG.eyebrow}</p>
          <h1 className={styles.title}>
            {titleLead}
            <span className={styles.grad}>{BLOG.titleAccent}</span>
          </h1>
          <p className={styles.lede}>{BLOG.lede}</p>
        </div>
        <span className={styles.count}>{count}</span>
      </section>

      {posts.length > 0 ? (
        <div className={styles.toolbar}>
          <label className={styles.search}>
            <Icon name="search" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={BLOG.searchLabel}
              aria-label={BLOG.searchLabel}
            />
          </label>
          <div className={styles.tags}>
            <button
              type="button"
              className={`chip ${styles.filterChip}`}
              aria-pressed={tag === null}
              onClick={() => setTag(null)}
            >
              {BLOG.allTag}
            </button>
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                className={`chip ${styles.filterChip}`}
                aria-pressed={tag === t}
                onClick={() => setTag(tag === t ? null : t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.years}>
        {posts.length === 0 ? (
          <Empty title={BLOG.noPostsTitle} hint={BLOG.noPostsHint} />
        ) : rows.length === 0 ? (
          <Empty title={BLOG.emptyTitle} hint={BLOG.emptyHint} />
        ) : (
          years.map(([year, list]) => (
            <section key={year} className={styles.year}>
              <div className={styles.yearLabel}>
                {year}
                <small>
                  {list.length} {list.length === 1 ? BLOG.postOne : BLOG.postMany}
                </small>
              </div>
              <div className={styles.posts}>
                {list.map((p) => (
                  <Card key={p.slug} post={p} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}

function Card({ post: p }: { post: PostMeta }) {
  return (
    <Link className={styles.post} href={`/blog/${p.slug}`}>
      {p.cover ? (
        <span className={styles.thumb}>
          <Image
            className={styles.thumbImg}
            src={p.cover}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 200px"
          />
        </span>
      ) : null}
      <span className={styles.txt}>
        <span className={styles.when}>{p.dateShort}</span>
        <b className={styles.postTitle}>{p.title}</b>
        {p.summary ? <span className={styles.summary}>{p.summary}</span> : null}
        <span className={styles.meta}>
          {p.tags.map((t) => (
            <span key={t} className={styles.tag}>
              {t}
            </span>
          ))}
          <span className={styles.mins}>
            {p.minutes} {BLOG.minShort}
          </span>
        </span>
      </span>
    </Link>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className={styles.empty}>
      <b>{title}</b>
      {hint}
    </div>
  );
}
