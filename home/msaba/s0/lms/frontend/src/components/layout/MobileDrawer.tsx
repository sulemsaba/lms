import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useSidebarItems } from "@/hooks/useSidebarItems";
import { useAuthStore } from "@/stores/authStore";
import styles from "./MobileDrawer.module.css";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const location = useLocation();
  const { sections } = useSidebarItems();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const drawerRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={drawerRef}
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              <Icon name="person" size={24} />
            </div>
            <div className={styles.userText}>
              <p className={styles.userName}>{user?.name || "Student"}</p>
              <p className={styles.userEmail}>{user?.email || "student@udsm.ac.tz"}</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close menu">
            <Icon name="close" size={24} />
          </button>
        </div>

        {/* Navigation sections */}
        <nav className={styles.nav}>
          {sections.map((section) => (
            <div key={section.title} className={styles.section}>
              <p className={styles.sectionTitle}>{section.title}</p>
              <div className={styles.sectionItems}>
                {section.items.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/" && location.pathname.startsWith(item.path));

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      className={`${styles.link} ${isActive ? styles.active : ""}`}
                      onClick={onClose}
                    >
                      <Icon name={item.icon} size={20} />
                      <span>{item.label}</span>
                      {isActive && <div className={styles.activeDot} />}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <div className={styles.footerRow}>
            <ThemeToggle compact />
            <span className={styles.footerLabel}>Theme</span>
          </div>
          <button className={styles.logoutButton} onClick={() => { clearAuth(); onClose(); }}>
            <Icon name="logout" size={18} />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
