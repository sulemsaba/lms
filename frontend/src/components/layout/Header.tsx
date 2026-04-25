import { useRef, useEffect, useState } from "react";
import styles from "./Header.module.css";

interface HeaderProps {
  title: string;
  subtitle: string;
}

/**
 * Top header for route context and onboarding text.
 * Adapts to mobile with compact mode and sticky positioning.
 */
export default function Header({ title, subtitle }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  // Detect scroll to compact the header on mobile
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When header loses visibility (scrolled past), compact it
        setIsCompact(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" }
    );

    // Observe a sentinel element placed above the header
    const sentinel = document.createElement("div");
    sentinel.style.position = "absolute";
    sentinel.style.top = "0";
    sentinel.style.height = "1px";
    sentinel.style.width = "1px";
    sentinel.style.opacity = "0";
    el.parentElement?.insertBefore(sentinel, el);
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.parentElement?.removeChild(sentinel);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className={`${styles.header} ${isCompact ? styles.compact : ""}`}
      data-testid="header"
    >
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </header>
  );
}
