import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import OfflineBanner from "@/components/offline/OfflineBanner";
import SyncHealthCard from "@/components/offline/SyncHealthCard";
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
  const { pathname } = useLocation();
  const lastSync = useSyncStore((state) => state.lastSync);
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const pendingSize = useSyncStore((state) => state.pendingSize);
  const syncStatus = useSyncStore((state) => state.syncStatus);
  const roleCodes = useAuthStore(selectEffectiveRoleCodes);
  const permissions = useAuthStore(selectEffectivePermissions);
  const actualRoleCodes = useAuthStore((state) => state.roleCodes);
  const actualPermissions = useAuthStore((state) => state.permissions);
  const impersonatedRoleCode = useAuthStore((state) => state.impersonatedRoleCode);
  const stopImpersonation = useAuthStore((state) => state.stopImpersonation);

  const showOfflineBanner = syncStatus === "offline" || syncStatus === "error";
  const portalTitle = getPortalTitle(roleCodes, permissions);
  const portalSubtitle = getPortalSubtitle(roleCodes, permissions);

  const onStopImpersonation = () => {
    stopImpersonation();
    navigate(getLandingPath(actualRoleCodes, actualPermissions), { replace: true });
  };

  return (
    <div className={styles.shell}>
      <BottomNav />
      <div className={styles.mainPanel}>
        <Header title={portalTitle} subtitle={portalSubtitle} />
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
          {pathname === "/" ? (
            <SyncHealthCard lastSync={lastSync} pendingCount={pendingCount} pendingSize={pendingSize} />
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
