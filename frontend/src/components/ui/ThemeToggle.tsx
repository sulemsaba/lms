import { useThemeStore } from "@/stores/themeStore";
import "./ThemeToggle.css";

interface ThemeToggleProps {
  compact?: boolean;
}

/**
 * Reusable day/night theme switch.
 */
export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === "dark";
  const toggleId = compact ? "sidebar-theme-toggle" : "global-theme-toggle";

  return (
    <div className={`theme-toggle-root${compact ? " compact" : ""}`}>
      <input
        id={toggleId}
        className="theme-toggle-input"
        type="checkbox"
        checked={isDark}
        onChange={toggleTheme}
        aria-label="Toggle theme"
      />
      <label
        htmlFor={toggleId}
        className="theme-toggle-switch"
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        <span className="theme-toggle-slider" />
        <span className="theme-toggle-decorations">
          <span className="theme-toggle-cloud theme-toggle-cloud-1" />
          <span className="theme-toggle-cloud theme-toggle-cloud-2" />
          <span className="theme-toggle-cloud theme-toggle-cloud-3" />
          <span className="theme-toggle-star theme-toggle-star-1" />
          <span className="theme-toggle-star theme-toggle-star-2" />
          <span className="theme-toggle-star theme-toggle-star-3" />
          <span className="theme-toggle-star theme-toggle-star-4" />
        </span>
      </label>
    </div>
  );
}
