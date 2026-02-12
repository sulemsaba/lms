import styles from "./RouteDisplay.module.css";

interface RouteDisplayProps {
  steps: string[];
}

/**
 * Step-by-step offline route instructions.
 */
export default function RouteDisplay({ steps }: RouteDisplayProps) {
  return (
    <section className={styles.route} data-testid="route-display">
      <h3>Route Guidance</h3>
      {steps.map((step) => (
        <p key={step} className={styles.step}>
          {step}
        </p>
      ))}
    </section>
  );
}
