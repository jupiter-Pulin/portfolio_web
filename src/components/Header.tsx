import Link from "next/link";
import { BLOG, SITE } from "@/content/copy";
import { SOCIALS } from "@/content/links";
import { AskButton } from "./AskButton";
import { Icon, type IconName } from "./Icon";
import { NavLink } from "./NavLink";
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
          <NavLink className={styles.navLink} href="/blog">
            {BLOG.navLabel}
          </NavLink>
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
          <AskButton className="btn btn-ask" label={SITE.askLabel} labelClassName="label" />
        </nav>
      </div>
    </header>
  );
}
