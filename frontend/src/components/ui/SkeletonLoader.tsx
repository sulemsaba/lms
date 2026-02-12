import styles from "./SkeletonLoader.module.css";

interface SkeletonLoaderProps {
  type: "card" | "line" | "avatar";
}

/**
 * Placeholder loader for low-bandwidth loading states.
 */
export default function SkeletonLoader({ type }: SkeletonLoaderProps) {
  return <div className={`${styles.skeleton} ${styles[type]}`} data-testid="skeleton-loader" />;
}
