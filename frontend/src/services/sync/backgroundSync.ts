import { apiClient } from "@/services/api/client";
import { db } from "@/services/db";
import type { SyncBatchResponse } from "@/types";
import { useSyncStore } from "@/stores/syncStore";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function postBatch(): Promise<SyncBatchResponse> {
  const pending = await db.offlineActions.where("syncStatus").equals("pending").toArray();
  const actionIds = pending
    .map((action) => action.id)
    .filter((id): id is string => typeof id === "string");

  if (actionIds.length === 0) {
    return { syncedIds: [], failedIds: [] };
  }

  const response = await apiClient.post<SyncBatchResponse>("/sync/batch", {
    actions: pending
  });

  return response.data;
}

/**
 * Attempts one sync cycle for queued actions.
 */
export async function syncPendingActions(): Promise<number> {
  const syncStore = useSyncStore.getState();
  syncStore.setSyncStatus("syncing");

  const pending = await db.offlineActions.where("syncStatus").equals("pending").toArray();
  syncStore.setPendingCount(pending.length);
  syncStore.setPendingSize(pending.length * 0.1);

  if (pending.length === 0) {
    syncStore.setSyncStatus("online");
    syncStore.setLastSync(new Date());
    return 0;
  }

  try {
    const result = await postBatch();

    for (const id of result.syncedIds) {
      await db.offlineActions.delete(id);
    }

    for (const id of result.failedIds) {
      const target = await db.offlineActions.get(id);
      if (!target) {
        continue;
      }
      await db.offlineActions.put({
        ...target,
        retryCount: target.retryCount + 1,
        syncStatus: "failed"
      });
    }

    const remaining = await db.offlineActions.where("syncStatus").equals("pending").count();
    syncStore.setPendingCount(remaining);
    syncStore.setPendingSize(remaining * 0.1);
    syncStore.setSyncStatus(remaining === 0 ? "online" : "error");
    syncStore.setLastSync(new Date());
    return result.syncedIds.length;
  } catch {
    syncStore.setSyncStatus("error");
    throw new Error("Failed to sync offline queue");
  }
}

/**
 * Sync runner with exponential backoff for unstable networks.
 */
export async function syncWithExponentialBackoff(): Promise<void> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      await syncPendingActions();
      return;
    } catch {
      const delay = BASE_DELAY_MS * 2 ** attempt;
      await sleep(delay);
    }
  }
}

/**
 * Registers browser online events to trigger queue flush.
 */
export function registerOnlineSyncTrigger(): void {
  window.addEventListener("online", () => {
    void syncWithExponentialBackoff();
  });
}
