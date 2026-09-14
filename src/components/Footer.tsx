import { SITE } from "@/content/copy";
import { EMAIL, GITHUB, LINKEDIN, MAILTO, X } from "@/content/links";
import { CopyEmailButton } from "./CopyEmailButton";
import styles from "./Footer.module.css";

const LINKS = [
  { label: "GitHub", href: GITHUB },
  { label: "LinkedIn", href: LINKEDIN },
  { label: "X", href: X },
];

export function Footer() {
  return (
    <footer className={styles.foot}>
      <div className="wrap">
        <div className={styles.footGrid}>
          <div>
            <b className={styles.brandSm}>{SITE.name}</b>
            <p>{SITE.location}</p>
          </div>
          <div className={styles.footLinks}>
            <a href={MAILTO}>{EMAIL}</a>
            <CopyEmailButton label="copy" />
            {LINKS.map((l) => (
              <span key={l.label} className={styles.footLink}>
                <span className={styles.sep}>·</span>
                <a href={l.href} target="_blank" rel="noopener">
                  {l.label}
                </a>
              </span>
            ))}
          </div>
        </div>
        <p className={styles.footNote}>{SITE.footNote}</p>
      </div>
    </footer>
  );
}
