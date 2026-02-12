import { relativeFromNow } from "@/utils/date";
import styles from "./OfflineBanner.module.css";

interface OfflineBannerProps {
  lastSync?: Date;
}

/**
 * Persistent offline notice with last sync hint.
 */
export default function OfflineBanner({ lastSync }: OfflineBannerProps) {
  return (
    <aside className={styles.banner} data-testid="offline-banner" aria-live="polite">
      <strong>Offline mode:</strong> Changes are saved locally and will sync automatically.
      {lastSync ? ` Last successful sync ${relativeFromNow(lastSync)}.` : " Sync has not run yet."}
    </aside>
  );
}
