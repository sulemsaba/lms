import { format } from "date-fns";
import { apiClient } from "@/services/api/client";
import { db, type CachedTimetableEvent } from "@/services/db";

export interface TimetableListItem {
  id: string;
  label: string;
  detail: string;
  cached: boolean;
  title?: string;
  startsAt?: string;
  endsAt?: string;
  venueLabel?: string;
}

export interface TimetableFetchResult {
  events: TimetableListItem[];
  source: "network" | "cache" | "fallback";
}

interface ApiTimetableEvent {
  id: string;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string;
  course_id?: string | null;
  venue_id?: string | null;
}

const fallbackEvents: TimetableListItem[] = [
  {
    id: "fallback-t1",
    label: "Monday 10:00",
    detail: "CS101 - Lecture Hall 1",
    cached: true,
    title: "CS101",
    venueLabel: "Lecture Hall 1"
  },
  {
    id: "fallback-t2",
    label: "Tuesday 14:00",
    detail: "DB202 - COICT Lab 3",
    cached: true,
    title: "DB202",
    venueLabel: "COICT Lab 3"
  }
];

function formatEventWindow(startsAt: string): string {
  return format(new Date(startsAt), "EEEE HH:mm");
}

function toCachedEvent(event: ApiTimetableEvent): CachedTimetableEvent {
  return {
    id: event.id,
    title: event.title,
    eventType: event.event_type,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    courseLabel: event.course_id ? `Course ${event.course_id.slice(0, 8)}` : "General",
    venueLabel: event.venue_id ? `Venue ${event.venue_id.slice(0, 8)}` : "TBA",
    updatedAt: new Date().toISOString()
  };
}

function toListItem(event: CachedTimetableEvent, cached: boolean): TimetableListItem {
  return {
    id: event.id,
    label: formatEventWindow(event.startsAt),
    detail: `${event.title} - ${event.venueLabel}`,
    cached,
    title: event.title,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    venueLabel: event.venueLabel
  };
}

/**
 * Loads timetable events with local cache fallback for offline continuity.
 */
export async function fetchTimetableEvents(): Promise<TimetableFetchResult> {
  try {
    const response = await apiClient.get<ApiTimetableEvent[]>("/timetable");
    const rows = Array.isArray(response.data) ? response.data : [];
    const cachedRows = rows.map(toCachedEvent);
    if (cachedRows.length > 0) {
      await db.timetableEvents.bulkPut(cachedRows);
    }
    return {
      events: cachedRows.map((item) => toListItem(item, false)),
      source: "network"
    };
  } catch {
    const cachedRows = await db.timetableEvents.toArray();
    if (cachedRows.length > 0) {
      return {
        events: cachedRows.map((item) => toListItem(item, true)),
        source: "cache"
      };
    }
    return {
      events: fallbackEvents,
      source: "fallback"
    };
  }
}
