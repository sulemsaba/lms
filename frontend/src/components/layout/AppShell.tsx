import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import OfflineBanner from "@/components/offline/OfflineBanner";
import SyncHealthCard from "@/components/offline/SyncHealthCard";
import { getPortalSubtitle, getPortalTitle } from "@/features/auth/roleAccess";
import { useAuthStore } from "@/stores/authStore";
import { useSyncStore } from "@/stores/syncStore";
import styles from "./AppShell.module.css";

/**
 * Global page frame containing header, offline state, and bottom navigation.
 */
export default function AppShell() {
  const { pathname } = useLocation();
  const lastSync = useSyncStore((state) => state.lastSync);
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const pendingSize = useSyncStore((state) => state.pendingSize);
  const syncStatus = useSyncStore((state) => state.syncStatus);
  const roleCodes = useAuthStore((state) => state.roleCodes);
  const permissions = useAuthStore((state) => state.permissions);

  const showOfflineBanner = syncStatus === "offline" || syncStatus === "error";
  const portalTitle = getPortalTitle(roleCodes, permissions);
  const portalSubtitle = getPortalSubtitle(roleCodes, permissions);

  return (
    <div className={styles.shell}>
      <Header title={portalTitle} subtitle={portalSubtitle} />
      <main className={styles.content}>
        {showOfflineBanner ? <OfflineBanner lastSync={lastSync ?? undefined} /> : null}
        {pathname === "/" ? (
          <SyncHealthCard lastSync={lastSync} pendingCount={pendingCount} pendingSize={pendingSize} />
        ) : null}
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
