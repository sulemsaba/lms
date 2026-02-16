import { NavLink } from "react-router-dom";
import { useMemo } from "react";
import { buildNavItems } from "@/features/auth/roleAccess";
import Icon from "@/components/ui/Icon";
import {
  selectEffectivePermissions,
  selectEffectiveRoleCodes,
  useAuthStore
} from "@/stores/authStore";
import styles from "./BottomNav.module.css";

/**
 * Primary shell navigation rendered as a side rail.
 */
export default function BottomNav() {
  const roleCodes = useAuthStore(selectEffectiveRoleCodes);
  const permissions = useAuthStore(selectEffectivePermissions);
  const items = useMemo(() => buildNavItems(roleCodes, permissions), [roleCodes, permissions]);

  return (
    <aside className={styles.container} data-testid="side-nav">
      <div className={styles.brand}>
        <p className={styles.brandTitle}>UDSM LMS</p>
        <p className={styles.brandSubtitle}>Navigation</p>
      </div>
      <nav className={styles.nav} aria-label="Side navigation">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`.trim()}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
