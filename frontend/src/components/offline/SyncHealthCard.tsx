import { relativeFromNow } from "@/utils/date";
import { formatCount, formatMegabytes } from "@/utils/format";
import styles from "./SyncHealthCard.module.css";

interface SyncHealthCardProps {
  lastSync: Date | null;
  pendingCount: number;
  pendingSize: number;
}

/**
 * Sync state summary for queue health and freshness.
 */
export default function SyncHealthCard({
  lastSync,
  pendingCount,
  pendingSize
}: SyncHealthCardProps) {
  const state = pendingCount === 0 ? "healthy" : pendingCount < 5 ? "pending" : "stale";
  const dotClass = state === "healthy" ? styles.healthy : state === "pending" ? styles.pending : styles.stale;

  return (
    <section className={styles.card} data-testid="sync-health-card" aria-live="polite">
      <h3>Sync Health</h3>
      <div className={styles.row}>
        <span>Status</span>
        <span>
          <span className={`${styles.dot} ${dotClass}`} aria-hidden /> {state}
        </span>
      </div>
      <div className={styles.row}>
        <span>Pending items</span>
        <strong>{formatCount(pendingCount)}</strong>
      </div>
      <div className={styles.row}>
        <span>Pending size</span>
        <strong>{formatMegabytes(pendingSize)}</strong>
      </div>
      <div className={styles.row}>
        <span>Last sync</span>
        <strong>{lastSync ? relativeFromNow(lastSync) : "never"}</strong>
      </div>
    </section>
  );
}
