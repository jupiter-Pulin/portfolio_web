import Link from "next/link";
import { SITE } from "@/content/copy";
import { SOCIALS } from "@/content/links";
import { Icon, type IconName } from "./Icon";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.top}>
      <div className="wrap">
        <Link className={styles.brand} href="/">
          {SITE.wordmark}
          <b>.</b>
        </Link>
        <nav className={styles.topRight} aria-label="Links">
          {SOCIALS.map((s) => (
            <a
              key={s.key}
              className="icon-btn"
              href={s.href}
              target="_blank"
              rel="noopener"
              aria-label={s.label}
              title={s.title}
            >
              <Icon name={s.key as IconName} />
            </a>
          ))}
          {/* Renders only — the ask drawer is a later task. */}
          <button
            className="btn btn-ask"
            type="button"
            aria-disabled="true"
            title="Coming in a later task"
          >
            <Icon name="spark" className="ic" />
            <span className="label">{SITE.askLabel}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
