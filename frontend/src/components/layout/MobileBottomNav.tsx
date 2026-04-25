import { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { useAuthStore } from "@/stores/authStore";
import styles from "./MobileBottomNav.module.css";

interface MobileNavItem {
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

interface MobileBottomNavProps {
  onMenuClick?: () => void;
}

export default function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const unreadNotifications = useAuthStore((state) => state.unreadNotifications || 0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const swipeStartY = useRef(0);
  const swipeStartX = useRef(0);

  // Primary navigation items (max 5)
  const primaryNavItems: MobileNavItem[] = [
    { label: "Home", icon: "home", path: "/" },
    { label: "Learn", icon: "menu_book", path: "/courses" },
    { label: "Tasks", icon: "checklist", path: "/tasks" },
    { label: "Focus", icon: "timer", path: "/focus-mode" },
    { label: "Me", icon: "person", path: "/profile" },
  ];

  // Quick action items
  const quickActionItems = [
    { label: "Scan QR", icon: "qr_code_scanner", path: "/qr-scanner" },
    { label: "New Note", icon: "edit_note", path: "/notes?new=true" },
    { label: "AI Tutor", icon: "smart_toy", path: "/ai-tutor" },
    { label: "Search", icon: "search", path: "/search" },
    { label: "Map", icon: "map", path: "/map" },
    { label: "Timetable", icon: "calendar_month", path: "/timetable" },
    { label: "Assessments", icon: "assignment", path: "/assessments" },
    { label: "All Menu", icon: "menu", path: "", isMenu: true },
  ] as const;

  // Swipe up from bottom to open quick actions
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      swipeStartY.current = e.changedTouches[0].screenY;
      swipeStartX.current = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const dy = swipeStartY.current - e.changedTouches[0].screenY;
      const dx = Math.abs(swipeStartX.current - e.changedTouches[0].screenX);
      // Only vertical swipes, starting near bottom
      if (dy > 50 && dx < 30 && swipeStartY.current > window.innerHeight - 120) {
        setShowQuickActions(true);
      }
      if (dy < -50 && showQuickActions) {
        setShowQuickActions(false);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [showQuickActions]);

  const handleQuickAction = useCallback((item: typeof quickActionItems[number]) => {
    setShowQuickActions(false);
    if ("isMenu" in item && item.isMenu) {
      onMenuClick?.();
    } else {
      navigate(item.path);
    }
  }, [navigate, onMenuClick]);

  // Close quick actions on route change
  useEffect(() => {
    setShowQuickActions(false);
  }, [location.pathname]);

  return (
    <>
      {/* Quick Actions Overlay */}
      {showQuickActions && (
        <div className={styles.overlay} onClick={() => setShowQuickActions(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <h3>Quick Actions</h3>
              <button
                className={styles.sheetClose}
                onClick={() => setShowQuickActions(false)}
                aria-label="Close"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className={styles.sheetGrid}>
              {quickActionItems.map((item) => (
                <button
                  key={item.label}
                  className={styles.sheetItem}
                  onClick={() => handleQuickAction(item)}
                  aria-label={item.label}
                >
                  <div className={styles.sheetItemIcon}>
                    <Icon name={item.icon} size={22} />
                  </div>
                  <span className={styles.sheetItemLabel}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className={styles.nav} aria-label="Primary navigation">
        {primaryNavItems.map((item) => {
          const isActive =
            (item.path === "/" && location.pathname === "/") ||
            (item.path !== "/" && location.pathname.startsWith(item.path));

          const showBadge = item.label === "Tasks" && unreadNotifications > 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={styles.navIconBox}>
                <Icon
                  name={item.icon}
                  size={24}
                  className={isActive ? styles.navIconActive : styles.navIcon}
                />
                {showBadge && (
                  <span className={styles.badge} aria-label={`${unreadNotifications} notifications`}>
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </div>
              <span className={`${styles.navLabel} ${isActive ? styles.navLabelActive : ""}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Floating quick action button */}
      <button
        className={`${styles.fab} ${showQuickActions ? styles.fabOpen : ""}`}
        onClick={() => setShowQuickActions((v) => !v)}
        aria-label="Quick actions"
        aria-expanded={showQuickActions}
      >
        <Icon name={showQuickActions ? "close" : "add"} size={28} />
      </button>
    </>
  );
}
