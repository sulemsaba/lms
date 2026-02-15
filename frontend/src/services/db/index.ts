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

export interface CachedCourse {
  id: string;
  code: string;
  title: string;
  lecturer: string;
  status: string;
  updatedAt: string;
}

export interface CachedTimetableEvent {
  id: string;
  title: string;
  eventType: string;
  startsAt: string;
  endsAt: string;
  courseLabel: string;
  venueLabel: string;
  updatedAt: string;
}

export interface LocalTask {
  id: string;
  title: string;
  notes: string;
  dueDate: string | null;
  priority: "low" | "medium" | "high";
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CachedNotification {
  id: string;
  title: string;
  message: string;
  level: "accent" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

export interface LocalNote {
  id: string;
  title: string;
  content: string;
  courseLabel: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
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
  courses!: Table<CachedCourse, string>;
  timetableEvents!: Table<CachedTimetableEvent, string>;
  tasks!: Table<LocalTask, string>;
  notifications!: Table<CachedNotification, string>;
  notes!: Table<LocalNote, string>;
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
    this.version(2).stores({
      offlineActions: "id, syncStatus, createdAt",
      venues: "id, campus",
      courses: "id, code, status, updatedAt",
      timetableEvents: "id, startsAt, eventType, updatedAt",
      resources: "id, versionId",
      receipts: "id, timestamp"
    });
    this.version(3).stores({
      offlineActions: "id, syncStatus, createdAt",
      venues: "id, campus",
      courses: "id, code, status, updatedAt",
      timetableEvents: "id, startsAt, eventType, updatedAt",
      tasks: "id, completed, priority, dueDate, updatedAt",
      notifications: "id, read, level, createdAt",
      resources: "id, versionId",
      receipts: "id, timestamp"
    });
    this.version(4).stores({
      offlineActions: "id, syncStatus, createdAt",
      venues: "id, campus",
      courses: "id, code, status, updatedAt",
      timetableEvents: "id, startsAt, eventType, updatedAt",
      tasks: "id, completed, priority, dueDate, updatedAt",
      notifications: "id, read, level, createdAt",
      notes: "id, pinned, courseLabel, updatedAt",
      resources: "id, versionId",
      receipts: "id, timestamp"
    });
  }
}

export const db = new AppDatabase();
