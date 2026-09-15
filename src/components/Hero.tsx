import { GuideConsole } from "./GuideConsole";
import { IdentityCard } from "./IdentityCard";
import styles from "./Hero.module.css";

/** Who Pulin is, in one card, and the guide that answers for him, in place. */
export function Hero() {
  return (
    <section className={styles.hero}>
      <IdentityCard />
      <GuideConsole />
    </section>
  );
}
