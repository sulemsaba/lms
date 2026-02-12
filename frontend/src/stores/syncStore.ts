import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SyncStatus } from "@/types";

interface SyncState {
  lastSync: Date | null;
  pendingCount: number;
  pendingSize: number;
  syncStatus: SyncStatus;
  setLastSync: (date: Date) => void;
  setPendingCount: (count: number) => void;
  setPendingSize: (size: number) => void;
  setSyncStatus: (status: SyncStatus) => void;
}

interface PersistedSyncState {
  lastSync: string | null;
  pendingCount: number;
  pendingSize: number;
  syncStatus: SyncStatus;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      lastSync: null,
      pendingCount: 0,
      pendingSize: 0,
      syncStatus: "unknown",
      setLastSync: (date) => set({ lastSync: date }),
      setPendingCount: (count) => set({ pendingCount: count }),
      setPendingSize: (size) => set({ pendingSize: size }),
      setSyncStatus: (status) => set({ syncStatus: status })
    }),
    {
      name: "sync-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedSyncState => ({
        lastSync: state.lastSync ? state.lastSync.toISOString() : null,
        pendingCount: state.pendingCount,
        pendingSize: state.pendingSize,
        syncStatus: state.syncStatus
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedSyncState | undefined;
        return {
          ...currentState,
          ...persisted,
          lastSync: persisted?.lastSync ? new Date(persisted.lastSync) : null
        };
      }
    }
  )
);
