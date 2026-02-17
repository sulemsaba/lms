import { fetchTimetableEvents } from "@/services/api/timetableApi";
import { fetchVenues } from "@/services/api/venuesApi";

/**
 * Prefetches core data required by schedule and map so they remain available offline.
 */
export async function warmupOfflineCoreData(): Promise<void> {
  await Promise.allSettled([fetchTimetableEvents(), fetchVenues()]);
}
