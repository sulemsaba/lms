import { create } from "zustand";
import { db, type OfflineAction } from "@/services/db";
import { useSyncStore } from "@/stores/syncStore";
import { createIdempotencyKey, generateUuid } from "@/utils/id";

interface NewOfflineAction {
  entity: string;
  action: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
}

interface OfflineQueueState {
  pendingActions: OfflineAction[];
  isBusy: boolean;
  loadPending: () => Promise<void>;
  enqueue: (action: NewOfflineAction) => Promise<string>;
  markFailed: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useOfflineQueueStore = create<OfflineQueueState>((set, get) => ({
  pendingActions: [],
  isBusy: false,
  loadPending: async () => {
    set({ isBusy: true });
    const pending = await db.offlineActions.where("syncStatus").equals("pending").toArray();
    useSyncStore.getState().setPendingCount(pending.length);
    useSyncStore.getState().setPendingSize(pending.length * 0.1);
    set({ pendingActions: pending, isBusy: false });
  },
  enqueue: async ({ entity, action, payload, idempotencyKey }) => {
    const id = generateUuid();
    const record: OfflineAction = {
      id,
      entity,
      action,
      payload,
      idempotencyKey: idempotencyKey ?? createIdempotencyKey(entity),
      createdAt: new Date(),
      retryCount: 0,
      syncStatus: "pending"
    };

    await db.offlineActions.put(record);
    const pendingCount = await db.offlineActions.where("syncStatus").equals("pending").count();
    useSyncStore.getState().setPendingCount(pendingCount);
    useSyncStore.getState().setPendingSize(pendingCount * 0.1);
    set({ pendingActions: [record, ...get().pendingActions] });
    return id;
  },
  markFailed: async (id) => {
    const target = await db.offlineActions.get(id);
    if (!target) {
      return;
    }

    const updated: OfflineAction = {
      ...target,
      retryCount: target.retryCount + 1,
      syncStatus: "failed"
    };
    await db.offlineActions.put(updated);
    await get().loadPending();
  },
  clearAll: async () => {
    await db.offlineActions.clear();
    useSyncStore.getState().setPendingCount(0);
    useSyncStore.getState().setPendingSize(0);
    set({ pendingActions: [] });
  }
}));
