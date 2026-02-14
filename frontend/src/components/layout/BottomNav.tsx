import { useMemo } from "react";
import { buildNavItems } from "@/features/auth/roleAccess";
import TabBar from "@/components/ui/TabBar";
import {
  selectEffectivePermissions,
  selectEffectiveRoleCodes,
  useAuthStore
} from "@/stores/authStore";
import styles from "./BottomNav.module.css";

/**
 * Fixed mobile-first bottom navigation.
 */
export default function BottomNav() {
  const roleCodes = useAuthStore(selectEffectiveRoleCodes);
  const permissions = useAuthStore(selectEffectivePermissions);
  const items = useMemo(() => buildNavItems(roleCodes, permissions), [roleCodes, permissions]);

  return (
    <div className={styles.container} data-testid="bottom-nav">
      <TabBar items={items} />
    </div>
  );
}
