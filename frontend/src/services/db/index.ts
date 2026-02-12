import Dexie, { type Table } from "dexie";
import type { Receipt } from "@/types";

export interface OfflineAction {
  id?: string;
  entity: string;
  action: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  createdAt: Date;
  retryCount: number;
  syncStatus: "pending" | "syncing" | "failed";
}

export interface CachedVenue {
  id: string;
  name: string;
  campus: string;
  gps: [number, number];
}

export interface CachedResource {
  id: string;
  versionId: string;
  title: string;
  blob?: Blob;
}

export interface CachedReceipt extends Receipt {}

export class AppDatabase extends Dexie {
  offlineActions!: Table<OfflineAction, string>;
  venues!: Table<CachedVenue, string>;
  resources!: Table<CachedResource, string>;
  receipts!: Table<CachedReceipt, string>;

  constructor() {
    super("UDSMStudentHub");
    this.version(1).stores({
      offlineActions: "id, syncStatus, createdAt",
      venues: "id, campus",
      resources: "id, versionId",
      receipts: "id, timestamp"
    });
  }
}

export const db = new AppDatabase();
