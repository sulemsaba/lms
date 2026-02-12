import { NavLink } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import type { TabItem } from "@/types";
import styles from "./TabBar.module.css";

interface TabBarProps {
  items: TabItem[];
}

/**
 * Bottom tab bar navigation with icon + label.
 */
export default function TabBar({ items }: TabBarProps) {
  return (
    <nav className={styles.tabBar} aria-label="Bottom navigation" data-testid="tab-bar">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`.trim()}
          aria-label={item.label}
        >
          <Icon name={item.icon} size={22} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
