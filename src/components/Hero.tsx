import Link from "next/link";
import { HERO } from "@/content/copy";
import { MAILTO } from "@/content/links";
import { CopyEmailButton } from "./CopyEmailButton";
import { HowIBuildCard } from "./HowIBuildCard";
import { Icon } from "./Icon";
import styles from "./Hero.module.css";

// The headline ends with the gradient-rendered accent; both halves come from HERO.
const headlineLead = HERO.headline.slice(0, HERO.headline.length - HERO.headlineAccent.length);

export function Hero() {
  return (
    <section className={styles.hero}>
      <div>
        <p className={styles.badge}>
          <span className={styles.dot} />
          {HERO.badge}
        </p>
        <h1 className={styles.headline}>
          {headlineLead}
          <span className={styles.grad}>{HERO.headlineAccent}</span>
        </h1>
        <p className={styles.lede}>{HERO.lede}</p>
        <div className={styles.cta}>
          <Link className="btn btn-primary" href="/work">
            <Icon name="spark" className="ic" />
            {HERO.ctaWork} <span className={styles.arrow}>→</span>
          </Link>
          <a className="btn btn-ghost" href={MAILTO}>
            <Icon name="mail" className="ic" />
            {HERO.ctaHire}
          </a>
          <CopyEmailButton label={HERO.ctaCopy} />
        </div>
      </div>

      <HowIBuildCard />
    </section>
  );
}
