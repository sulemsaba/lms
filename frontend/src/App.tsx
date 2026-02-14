import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { registerServiceWorker } from "@/services/sync/registerSW";
import {
  registerOnlineSyncTrigger,
  registerServiceWorkerSyncListener,
  refreshSyncQueueMetrics,
  syncWithExponentialBackoff
} from "@/services/sync/backgroundSync";
import { useSyncStore } from "@/stores/syncStore";

/**
 * Root app component binding routing and offline sync wiring.
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

  return <RouterProvider router={router} />;
}
