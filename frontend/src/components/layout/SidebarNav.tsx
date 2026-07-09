import { useState, useCallback, useEffect, type KeyboardEvent } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import ThemeToggle from "@/components/ui/ThemeToggle";
import CommandPalette from "@/components/layout/CommandPalette";
import { useSidebarItems } from "@/hooks/useSidebarItems";
import { useAuthStore } from "@/stores/authStore";
import styles from "./SidebarNav.module.css";

export default function SidebarNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sections } = useSidebarItems();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const unreadNotifications = useAuthStore((state) => state.unreadNotifications || 0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const onLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const handleLogoutKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onLogout();
    }
  };

  const handleNavKeyDown = (e: KeyboardEvent<HTMLAnchorElement>, path: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(path);
    }
  };

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      
      // Cmd/Ctrl + B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
      
      // Escape to close command palette
      if (e.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, toggleCollapse]);

  if (sections.length === 0) {
    return (
      <aside className={`${styles.container} ${isCollapsed ? styles.collapsed : ''}`} 
             data-testid="side-nav" 
             role="navigation" 
             aria-label="Main navigation">
        <div className={styles.brand}>
          <button 
            className={styles.collapseButton}
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name={isCollapsed ? "chevron_right" : "chevron_left"} size={20} />
          </button>
          {!isCollapsed && (
            <>
              <p className={styles.brandTitle}>UDSM Hub</p>
              <p className={styles.brandSubtitle}>No navigation available</p>
            </>
          )}
        </div>
      </aside>
    );
  }

  return (
    <>
      <CommandPalette 
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
      
      <aside 
        className={`${styles.container} ${isCollapsed ? styles.collapsed : ''}`} 
        data-testid="side-nav" 
        role="navigation" 
        aria-label="Main navigation"
      >
        {/* Brand & Collapse Control */}
        <div className={styles.brand}>
          <button 
            className={styles.collapseButton}
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name={isCollapsed ? "chevron_right" : "chevron_left"} size={20} />
          </button>
          
          {!isCollapsed && (
            <>
              <div className={styles.brandContent}>
                <p className={styles.brandTitle}>Student Hub</p>
              </div>
              
              {/* Quick Search */}
              <div className={styles.quickSearch}>
                <button 
                  className={styles.searchButton}
                  onClick={() => setShowCommandPalette(true)}
                  aria-label="Open command palette"
                >
                  <Icon name="search" size={16} />
                  <span>Search or jump to...</span>
                  <kbd className={styles.shortcutKey}>⌘K</kbd>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Main Navigation - Clean & Focused */}
        <nav className={styles.nav} aria-label="Side navigation">
          {sections.map((section) => (
            <div key={section.title} className={styles.section}>
              {!isCollapsed && section.title ? (
                <p className={styles.category}>
                  {section.title}
                </p>
              ) : null}
              <div className={styles.sectionItems}>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path || 
                    (item.path !== "/" && location.pathname.startsWith(item.path));
                  
                  // Show badge for notifications on Alerts item
                  const showBadge = item.label === "Alerts" && unreadNotifications > 0;
                  
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      className={({ isActive: navIsActive }) => 
                        `${styles.link} ${navIsActive ? styles.active : ''}`.trim()
                      }
                      onKeyDown={(e) => handleNavKeyDown(e, item.path)}
                      aria-current={isActive ? "page" : undefined}
                      role="menuitem"
                    >
                      <div className={styles.linkIcon}>
                        <Icon name={item.icon} size={20} label={item.label} />
                        {showBadge && (
                          <span className={styles.badge} aria-label={`${unreadNotifications} notifications`}>
                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className={styles.linkLabel}>{item.label}</span>
                          {isActive && <div className={styles.activeIndicator} />}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Actions - Minimal */}
        <div className={styles.footer}>
          <div className={styles.footerActions} role="menu" aria-label="User actions">
            <button 
              type="button" 
              className={styles.footerButton} 
              onClick={onLogout}
              onKeyDown={handleLogoutKeyDown}
              role="menuitem"
              aria-label="Log out"
            >
              <Icon name="logout" size={18} label="Log out" />
              {!isCollapsed && <span>Log out</span>}
            </button>
          </div>
          
          {!isCollapsed && (
            <div className={styles.themeRow}>
              <ThemeToggle compact aria-label="Toggle theme" />
            </div>
          )}
        </div>

        {/* Collapse Hint */}
        {!isCollapsed && (
          <div className={styles.collapseHint}>
            <Icon name="keyboard" size={14} />
            <span>Press <kbd>⌘B</kbd> to collapse</span>
          </div>
        )}
      </aside>
    </>
  );
}
