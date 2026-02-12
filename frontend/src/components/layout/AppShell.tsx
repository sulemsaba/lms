import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import OfflineBanner from "@/components/offline/OfflineBanner";
import SyncHealthCard from "@/components/offline/SyncHealthCard";
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

  const showOfflineBanner = syncStatus === "offline" || syncStatus === "error";

  return (
    <div className={styles.shell}>
      <Header title="UDSM Student Hub" subtitle="Offline-first learning and campus life" />
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
