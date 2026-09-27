import Link from "next/link";
import { HOME } from "@/content/copy";
import { listPosts } from "@/lib/blog";
import { Sketch } from "./sketch/Sketch";
import { Wavy } from "./sketch/Wavy";
import styles from "./Sections.module.css";

/** The four newest posts, as lines in a notebook. Server component: posts are read at build time. */
export function LatestNotes() {
  const posts = listPosts().slice(0, 4);
  if (posts.length === 0) return null;
  return (
    <section className={styles.block} id="notes" aria-labelledby="notes-title">
      <div className={styles.head}>
        <h2 id="notes-title" className={styles.title}>
          {HOME.notesTitle} <Wavy>{HOME.notesAccent}</Wavy>
        </h2>
        <Link className={`link-btn ${styles.more}`} href="/blog">
          {HOME.allPosts}
        </Link>
      </div>
      <div className={styles.notes}>
        {posts.map((p) => (
          <Link className={styles.note} key={p.slug} href={`/blog/${p.slug}`}>
            <time className={styles.date} dateTime={p.date}>
              {p.dateShort}
            </time>
            <span>
              <span className={styles.noteTitle}>{p.title}</span>
              {p.summary ? <span className={styles.sum}>{p.summary}</span> : null}
            </span>
            <span className={styles.noteTags}>
              {p.tags.slice(0, 2).map((t) => (
                <span key={t} className={`sk ${styles.noteTag}`}>
                  <Sketch shape="circle" w={1.5} c="var(--lgrey)" draw={false} />
                  {t}
                </span>
              ))}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
