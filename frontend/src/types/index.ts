import type { Receipt } from "./receipt";

export type SyncStatus = "online" | "offline" | "syncing" | "error" | "unknown";

export interface TabItem {
  label: string;
  icon: string;
  path: string;
}

export interface SyncBatchResponse {
  syncedIds: string[];
  failedIds: string[];
}

export type { Receipt };
