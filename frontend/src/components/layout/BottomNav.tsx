import { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { buildStudentFeaturePaths } from "@/features/auth/roleAccess";
import {
  selectEffectivePermissions,
  selectEffectiveRoleCodes,
  useAuthStore
} from "@/stores/authStore";
import styles from "./BottomNav.module.css";

interface SidebarItem {
  label: string;
  icon: string;
  path: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: "Dashboard",
    items: [
      { label: "Dashboard", icon: "dashboard", path: "/" },
      { label: "Campus Map", icon: "map", path: "/map" },
      { label: "Search", icon: "search", path: "/search" },
      { label: "Profile", icon: "person", path: "/profile" }
    ]
  },
  {
    title: "Academics",
    items: [
      { label: "My Courses", icon: "menu_book", path: "/courses" },
      { label: "Assessments", icon: "assignment", path: "/assessments" },
      { label: "Assignments", icon: "assignment", path: "/assignments" },
      { label: "QR Scanner", icon: "qr_code_scanner", path: "/qr-scanner" },
      { label: "Timetable", icon: "calendar_month", path: "/timetable" },
      { label: "Results", icon: "account_balance", path: "/results" }
    ]
  },
  {
    title: "University",
    items: [
      { label: "Payments", icon: "receipt_long", path: "/payments" },
      { label: "Community", icon: "forum", path: "/community" },
      { label: "Helpdesk", icon: "support_agent", path: "/helpdesk" }
    ]
  },
  {
    title: "Productivity",
    items: [
      { label: "Tasks", icon: "checklist", path: "/tasks" },
      { label: "Notes", icon: "edit_note", path: "/notes" },
      { label: "Alerts", icon: "notifications", path: "/notifications" },
      { label: "Queue Manager", icon: "sync", path: "/queue-manager" },
      { label: "Focus Mode", icon: "timer", path: "/focus-mode" },
      { label: "Resources", icon: "folder_open", path: "/resources" },
      { label: "Study Groups", icon: "group", path: "/study-groups" }
    ]
  }
];

/**
 * Unified sidebar used across dashboard and internal pages.
 */
export default function BottomNav() {
  const navigate = useNavigate();
  const roleCodes = useAuthStore(selectEffectiveRoleCodes);
  const permissions = useAuthStore(selectEffectivePermissions);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const allowedPaths = useMemo(() => new Set(buildStudentFeaturePaths(roleCodes, permissions)), [permissions, roleCodes]);

  const visibleSections = useMemo(
    () =>
      SIDEBAR_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => allowedPaths.has(item.path))
      })).filter((section) => section.items.length > 0),
    [allowedPaths]
  );

  const onLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <aside className={styles.container} data-testid="side-nav">
      <div className={styles.brand}>
        <p className={styles.brandTitle}>UDSM Hub</p>
        <p className={styles.brandSubtitle}>Student navigation</p>
      </div>

      <nav className={styles.nav} aria-label="Side navigation">
        {visibleSections.map((section) => (
          <div key={section.title} className={styles.section}>
            <p className={styles.category}>{section.title}</p>
            {section.items.map((item) => (
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
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <NavLink to="/profile" className={styles.footerLink}>
            <Icon name="settings" size={18} />
            <span>Settings</span>
          </NavLink>
          <NavLink to="/helpdesk" className={styles.footerLink}>
            <Icon name="help" size={18} />
            <span>Help</span>
          </NavLink>
          <button type="button" className={styles.footerButton} onClick={onLogout}>
            <Icon name="logout" size={18} />
            <span>Log out</span>
          </button>
        </div>
        <div className={styles.themeRow}>
          <p className={styles.footerLabel}>Theme</p>
          <ThemeToggle compact />
        </div>
      </div>
    </aside>
  );
}
