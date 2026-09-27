import { HOME, SITE } from "@/content/copy";
import { EMAIL, GITHUB, LINKEDIN, MAILTO, X } from "@/content/links";
import { CopyEmailButton } from "./CopyEmailButton";
import { Rule } from "./sketch/Rule";
import styles from "./Footer.module.css";

const LINKS = [
  { label: "GitHub", href: GITHUB },
  { label: "LinkedIn", href: LINKEDIN },
  { label: "X", href: X },
];

export function Footer() {
  return (
    <footer className={styles.foot}>
      <Rule className={styles.rule} seed={34} />
      <div className={styles.in}>
        <p className={styles.bye}>{HOME.bye}</p>
        <p className={styles.line}>
          {HOME.byeLead}{" "}
          <a className="link-btn" href={MAILTO}>
            {EMAIL}
          </a>{" "}
          <CopyEmailButton label="copy" />
          {LINKS.map((l) => (
            <span key={l.label}>
              <span className={styles.sep}>·</span>
              <a className="link-btn" href={l.href} target="_blank" rel="noopener">
                {l.label}
              </a>
            </span>
          ))}
        </p>
        <p className={`fine ${styles.where}`}>
          <b>{SITE.name}</b> · {SITE.location}
        </p>
        <p className={`fine ${styles.note}`}>{SITE.footNote}</p>
      </div>
    </footer>
  );
}
