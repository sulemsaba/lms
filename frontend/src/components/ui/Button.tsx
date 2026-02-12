import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "destructive" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * Base action button with design-token variants.
 */
export default function Button({
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled = false,
  children,
  ...rest
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : "",
    disabled || loading ? styles.disabled : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...rest}
      className={classNames}
      disabled={disabled || loading}
      data-testid="button"
      aria-busy={loading}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
