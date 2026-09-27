import { Assistant } from "./Assistant";
import { IdentityCard } from "./IdentityCard";
import styles from "./Hero.module.css";

/** Who Nolan is, and the assistant that answers for him. */
export function Hero() {
  return (
    <section className={styles.hero}>
      <IdentityCard />
      <Assistant />
    </section>
  );
}
