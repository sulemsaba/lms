import { useCallback } from "react";
import { useOfflineQueueStore } from "@/stores/offlineQueueStore";
import type { OfflineAction } from "@/services/db";

/**
 * Hook wrapper around the offline queue store.
 */
export function useOfflineQueue() {
  const pendingActions = useOfflineQueueStore((state) => state.pendingActions);
  const isBusy = useOfflineQueueStore((state) => state.isBusy);
  const enqueue = useOfflineQueueStore((state) => state.enqueue);
  const loadPending = useOfflineQueueStore((state) => state.loadPending);
  const clearAll = useOfflineQueueStore((state) => state.clearAll);

  const addAction = useCallback(
    async (action: Omit<OfflineAction, "createdAt" | "retryCount" | "syncStatus">) => {
      return enqueue({
        entity: action.entity,
        action: action.action,
        payload: action.payload,
        idempotencyKey: action.idempotencyKey
      });
    },
    [enqueue]
  );

  return {
    pendingActions,
    isBusy,
    addAction,
    refreshPending: loadPending,
    clearQueue: clearAll
  };
}
