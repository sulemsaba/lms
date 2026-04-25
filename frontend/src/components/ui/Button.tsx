import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "text";

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
    fullWidth ? styles.button : ""
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
      style={fullWidth ? { width: "100%" } : undefined}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
