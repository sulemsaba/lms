import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Header from "@/components/layout/Header";
import SidebarNav from "@/components/layout/SidebarNav";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileDrawer from "@/components/layout/MobileDrawer";
import OfflineBanner from "@/components/offline/OfflineBanner";
import { formatRoleLabel, getLandingPath, getPortalSubtitle, getPortalTitle } from "@/features/auth/roleAccess";
import {
  selectEffectivePermissions,
  selectEffectiveRoleCodes,
  useAuthStore
} from "@/stores/authStore";
import { useSyncStore } from "@/stores/syncStore";
import styles from "./AppShell.module.css";

/**
 * Global page frame containing header, offline state, and side navigation.
 */
export default function AppShell() {
  const navigate = useNavigate();
  const lastSync = useSyncStore((state) => state.lastSync);
  const syncStatus = useSyncStore((state) => state.syncStatus);
  const roleCodes = useAuthStore(selectEffectiveRoleCodes);
  const permissions = useAuthStore(selectEffectivePermissions);
  const actualRoleCodes = useAuthStore((state) => state.roleCodes);
  const actualPermissions = useAuthStore((state) => state.permissions);
  const impersonatedRoleCode = useAuthStore((state) => state.impersonatedRoleCode);
  const stopImpersonation = useAuthStore((state) => state.stopImpersonation);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const resizeTimer = useRef<ReturnType<typeof setTimeout>>();

  const showOfflineBanner = syncStatus === "offline" || syncStatus === "error";
  const portalTitle = getPortalTitle(roleCodes, permissions);
  const portalSubtitle = getPortalSubtitle(roleCodes, permissions);

  // Detect mobile viewport (debounced)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();

    const handleResize = () => {
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(checkMobile, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
    };
  }, []);

  const onStopImpersonation = () => {
    stopImpersonation();
    navigate(getLandingPath(actualRoleCodes, actualPermissions), { replace: true });
  };

  return (
    <div className={styles.shell}>
      {/* Desktop Sidebar (hidden on mobile) */}
      {!isMobile && <SidebarNav />}
      
      <div className={styles.mainPanel}>
        {/* Sticky header row with hamburger on mobile */}
        {isMobile ? (
          <div className={styles.mobileHeaderWrapper}>
            <button
              className={styles.hamburgerButton}
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
            >
              <Icon name="menu" size={22} />
            </button>
            <Header title={portalTitle} subtitle={portalSubtitle} />
          </div>
        ) : null}
        <main className={styles.content}>
          {impersonatedRoleCode ? (
            <div className={styles.impersonationBanner}>
              <p>
                Impersonating <strong>{formatRoleLabel(impersonatedRoleCode)}</strong>. API session remains your original
                super-admin account.
              </p>
              <Button variant="text" onClick={onStopImpersonation}>
                End Impersonation
              </Button>
            </div>
          ) : null}
          {showOfflineBanner ? <OfflineBanner lastSync={lastSync ?? undefined} /> : null}
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (only on mobile) */}
      {isMobile && <MobileBottomNav onMenuClick={() => setMobileDrawerOpen(true)} />}

      {/* Mobile Drawer */}
      {isMobile && (
        <MobileDrawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        />
      )}
    </div>
  );
}
