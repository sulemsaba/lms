import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { registerServiceWorker } from "@/services/sync/registerSW";
import {
  registerOnlineSyncTrigger,
  registerServiceWorkerSyncListener
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

    const updateStatus = () => {
      setSyncStatus(navigator.onLine ? "online" : "offline");
    };

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, [setSyncStatus]);

  return <RouterProvider router={router} />;
}
