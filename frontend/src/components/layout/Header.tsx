import styles from "./Header.module.css";

interface HeaderProps {
  title: string;
  subtitle: string;
}

/**
 * Top header for route context and onboarding text.
 */
export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className={styles.header} data-testid="header">
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </header>
  );
}
