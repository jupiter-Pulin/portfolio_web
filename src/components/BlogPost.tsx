import Image from "next/image";
import Link from "next/link";
import { BLOG } from "@/content/copy";
import type { Post, PostMeta } from "@/lib/blog";
import styles from "./BlogPost.module.css";

/**
 * One post. The body is the HTML that blog.ts rendered from the Markdown file
 * (house rules: figures, galleries, photo paths); the frame around it is here.
 */
export function BlogPost({
  post,
  newer,
  older,
}: {
  post: Post;
  newer: PostMeta | null;
  older: PostMeta | null;
}) {
  return (
    <article className={styles.article}>
      <div className={styles.crumbs}>
        <Link className="link-btn" href="/blog">
          {BLOG.backToAll}
        </Link>
      </div>

      <header>
        <h1 className={styles.h1}>{post.title}</h1>
        <div className={styles.meta}>
          <time dateTime={post.date}>{post.dateLong}</time>
          <span className={styles.sep}>·</span>
          <span>
            {post.minutes} {BLOG.minRead}
          </span>
          {post.tags.length > 0 ? <span className={styles.sep}>·</span> : null}
          {post.tags.map((t) => (
            <span key={t} className={styles.tag}>
              {t}
            </span>
          ))}
        </div>
        {post.summary ? <p className={styles.lede}>{post.summary}</p> : null}
        {post.cover ? (
          <figure className={styles.cover}>
            <span className={styles.coverFrame}>
              <Image
                className={styles.coverImg}
                src={post.cover}
                alt={post.coverCaption ?? ""}
                fill
                unoptimized
                priority
                sizes="(max-width: 820px) 100vw, 760px"
              />
            </span>
            {post.coverCaption ? <figcaption className={styles.caption}>{post.coverCaption}</figcaption> : null}
          </figure>
        ) : null}
      </header>

      <div className={styles.rule} />
      <div className={styles.body} dangerouslySetInnerHTML={{ __html: post.html }} />

      <div className={styles.foot}>
        <Link className="link-btn" href="/blog">
          {BLOG.backToAll}
        </Link>
      </div>

      {older || newer ? (
        <nav className={styles.pager} aria-label={BLOG.adjacent}>
          {older ? <PagerLink post={older} dir={BLOG.older} className={styles.prev} /> : <span />}
          {newer ? <PagerLink post={newer} dir={BLOG.newer} className={styles.next} /> : <span />}
        </nav>
      ) : null}
    </article>
  );
}

function PagerLink({ post, dir, className }: { post: PostMeta; dir: string; className: string }) {
  return (
    <Link className={`${styles.pagerLink} ${className}`} href={`/blog/${post.slug}`}>
      <span className={styles.dir}>{dir}</span>
      <b>{post.title}</b>
    </Link>
  );
}
