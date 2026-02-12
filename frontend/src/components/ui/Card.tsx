import type { ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps {
  children: ReactNode;
  padding?: "sm" | "md" | "lg";
  shadow?: boolean;
}

/**
 * Surface container for grouped content blocks.
 */
export default function Card({ children, padding = "md", shadow = true }: CardProps) {
  const classNames = [styles.card, styles[padding], shadow ? styles.shadow : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classNames} data-testid="card">
      {children}
    </section>
  );
}
