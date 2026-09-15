import Image from "next/image";
import { IDENTITY, SITE } from "@/content/copy";
import { MAILTO, SOCIALS } from "@/content/links";
import { CopyEmailButton } from "./CopyEmailButton";
import { Icon, type IconName } from "./Icon";
import styles from "./IdentityCard.module.css";

/** Who Pulin is, at a glance. Every line comes from src/content. */
export function IdentityCard() {
  return (
    <aside className={styles.card} aria-label={SITE.name}>
      <div className={styles.top}>
        <span className={styles.mono}>{IDENTITY.eyebrow}</span>
        <span className={`${styles.mono} ${styles.status}`}>
          <i />
          {IDENTITY.status}
        </span>
      </div>
      <div className={styles.head}>
        <Image
          className={styles.avatar}
          src="/avatar.jpg"
          alt={IDENTITY.avatarAlt}
          width={124}
          height={124}
          unoptimized
          priority
        />
        <div>
          <h1 className={styles.name}>{SITE.name}</h1>
          <p className={styles.role}>{IDENTITY.role}</p>
        </div>
      </div>
      <dl className={styles.facts}>
        {IDENTITY.facts.map((f) => (
          <div className={styles.fact} key={f.label}>
            <dt>{f.label}</dt>
            <dd>{f.text}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.foot}>
        <div className={styles.socials}>
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
        </div>
        <div className={styles.ctas}>
          <CopyEmailButton label={IDENTITY.ctaCopy} />
          <a className="btn btn-ghost sm" href={MAILTO}>
            <Icon name="mail" className="ic" />
            {IDENTITY.ctaHire}
          </a>
        </div>
      </div>
    </aside>
  );
}
