import styles from "./Badge.module.css";

interface BadgeProps {
  color?: "success" | "warning" | "error" | "accent";
  text: string;
}

/**
 * Lightweight semantic status badge.
 */
export default function Badge({ color = "accent", text }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[color]}`} data-testid="badge">
      {text}
    </span>
  );
}
