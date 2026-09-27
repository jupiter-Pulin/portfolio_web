import Link from "next/link";
import { BLOG, SITE } from "@/content/copy";
import { SOCIALS } from "@/content/links";
import { AskButton } from "./AskButton";
import { Icon, type IconName } from "./Icon";
import { NavLink } from "./NavLink";
import { Rule } from "./sketch/Rule";
import { Sketch } from "./sketch/Sketch";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.top}>
      <div className={styles.in}>
        <Link className={styles.brand} href="/">
          {SITE.wordmark}
          <b>.</b>
        </Link>
        <nav className={styles.nav} aria-label="Links">
          <NavLink className={`${styles.navLink} ${styles.hideS}`} href="/work">
            {SITE.workNav}
          </NavLink>
          <NavLink className={styles.navLink} href="/blog">
            {BLOG.navLabel}
          </NavLink>
          {SOCIALS.map((s) => (
            <a
              key={s.key}
              className={`icon-btn sk ${styles.social}`}
              href={s.href}
              target="_blank"
              rel="noopener"
              aria-label={s.label}
              title={s.title}
            >
              <Sketch shape="circle" w={2} />
              <Icon name={s.key as IconName} />
            </a>
          ))}
          <ThemeToggle />
          <AskButton
            className={`btn sk hover-hatch ${styles.ask}`}
            label={SITE.askLabel}
            labelClassName={styles.askLabel}
            sketch={{ r: 18, hatch: "var(--mint)", gap: 8, w: 2.2 }}
          />
        </nav>
      </div>
      <Rule className={styles.rule} />
    </header>
  );
}
