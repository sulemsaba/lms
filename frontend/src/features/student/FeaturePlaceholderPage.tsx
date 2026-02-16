import Card from "@/components/ui/Card";
import styles from "./FeaturePlaceholderPage.module.css";

interface FeaturePlaceholderPageProps {
  title: string;
  description: string;
}

/**
 * Lightweight placeholder for student modules that are routed but not yet fully implemented.
 */
export default function FeaturePlaceholderPage({ title, description }: FeaturePlaceholderPageProps) {
  return (
    <section className={styles.stack}>
      <Card>
        <h2>{title}</h2>
        <p>{description}</p>
      </Card>
    </section>
  );
}
