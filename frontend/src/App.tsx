import { useEffect } from "react";
import DashboardApp from "@/features/dashboard/DashboardApp";
import { registerServiceWorker } from "@/services/sync/registerSW";
import {
  registerOnlineSyncTrigger,
  registerServiceWorkerSyncListener,
  refreshSyncQueueMetrics,
  syncWithExponentialBackoff
} from "@/services/sync/backgroundSync";
import { useSyncStore } from "@/stores/syncStore";

/**
 * Root app component binding dashboard UI and offline sync wiring.
 */
export default function App() {
  const setSyncStatus = useSyncStore((state) => state.setSyncStatus);

  useEffect(() => {
    registerServiceWorker();
    registerOnlineSyncTrigger();
    registerServiceWorkerSyncListener();
    void refreshSyncQueueMetrics();
    if (navigator.onLine) {
      void syncWithExponentialBackoff();
    }

    const updateStatus = () => {
      setSyncStatus(navigator.onLine ? "online" : "offline");
      void refreshSyncQueueMetrics();
    };

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    const interval = window.setInterval(() => {
      void refreshSyncQueueMetrics();
      if (navigator.onLine) {
        void syncWithExponentialBackoff();
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      window.clearInterval(interval);
    };
  }, [setSyncStatus]);

  return <DashboardApp />;
}
