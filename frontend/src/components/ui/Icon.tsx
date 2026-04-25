import styles from "./Icon.module.css";

interface IconProps {
  name: string;
  size?: number;
  label?: string;
  className?: string;
}

/**
 * Material Symbols icon wrapper with consistent sizing.
 */
export default function Icon({ name, size = 24, label, className }: IconProps) {
  return (
    <span
      className={`${styles.icon}${className ? ` ${className}` : ''}`}
      style={{ fontSize: size }}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-testid="icon"
    >
      {name}
    </span>
  );
}
