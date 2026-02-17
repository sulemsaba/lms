import type { RouteSource } from "@/features/map/navigation";
import styles from "./RouteDisplay.module.css";

type RouteStatus = "idle" | "loading" | "ready" | "error";

export interface RouteDisplayModel {
  status: RouteStatus;
  source?: RouteSource;
  distanceMeters?: number;
  etaMinutes?: number;
  steps: string[];
  warning?: string;
  error?: string;
}

interface RouteDisplayProps {
  route: RouteDisplayModel;
}

const SOURCE_LABEL: Record<RouteSource, string> = {
  google: "Google",
  "local-graph": "Local Fallback",
  "direct-line": "Directional Fallback"
};

/**
 * Displays route status and guidance text.
 */
export default function RouteDisplay({ route }: RouteDisplayProps) {
  const metrics =
    route.distanceMeters !== undefined && route.etaMinutes !== undefined
      ? `${Math.round(route.distanceMeters)}m - ${route.etaMinutes} min`
      : null;

  return (
    <section className={styles.route} data-testid="route-display">
      <h3>Route Guidance</h3>
      {route.source ? (
        <p className={styles.meta}>
          <span className={styles.sourceBadge}>{SOURCE_LABEL[route.source]}</span>
          {metrics ? <span>{metrics}</span> : null}
        </p>
      ) : null}
      {route.status === "loading" ? <p className={styles.step}>Calculating route...</p> : null}
      {route.status === "error" && route.error ? <p className={styles.error}>{route.error}</p> : null}
      {route.warning ? <p className={styles.warning}>{route.warning}</p> : null}
      {route.steps.map((step) => (
        <p key={step} className={styles.step}>
          {step}
        </p>
      ))}
    </section>
  );
}
