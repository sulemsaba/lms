import TabBar from "@/components/ui/TabBar";
import type { TabItem } from "@/types";
import styles from "./BottomNav.module.css";

const items: TabItem[] = [
  { label: "Home", icon: "home", path: "/" },
  { label: "Courses", icon: "menu_book", path: "/courses" },
  { label: "Assess", icon: "assignment", path: "/assessments" },
  { label: "Map", icon: "map", path: "/map" },
  { label: "Profile", icon: "person", path: "/profile" }
];

/**
 * Fixed mobile-first bottom navigation.
 */
export default function BottomNav() {
  return (
    <div className={styles.container} data-testid="bottom-nav">
      <TabBar items={items} />
    </div>
  );
}
