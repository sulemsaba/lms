import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { router } from "@/router";
import { registerServiceWorker } from "@/services/sync/registerSW";
import {
  registerOnlineSyncTrigger,
  registerServiceWorkerSyncListener,
  refreshSyncQueueMetrics,
  syncWithExponentialBackoff
} from "@/services/sync/backgroundSync";
import { warmupOfflineCoreData } from "@/services/offline/offlineWarmup";
import { useSyncStore } from "@/stores/syncStore";
import { useThemeStore } from "@/stores/themeStore";

/**
 * Root app component binding routing and offline sync wiring.
 */
export default function App() {
  const setSyncStatus = useSyncStore((state) => state.setSyncStatus);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    registerServiceWorker();
    registerOnlineSyncTrigger();
    registerServiceWorkerSyncListener();
    void refreshSyncQueueMetrics();
    if (navigator.onLine) {
      void syncWithExponentialBackoff();
      void warmupOfflineCoreData();
    }

    const updateStatus = () => {
      setSyncStatus(navigator.onLine ? "online" : "offline");
      void refreshSyncQueueMetrics();
      if (navigator.onLine) {
        void warmupOfflineCoreData();
      }
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

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
