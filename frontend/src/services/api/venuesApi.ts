import { apiClient } from "@/services/api/client";
import { db, type CachedVenue } from "@/services/db";

export interface VenueFetchResult {
  venues: CachedVenue[];
  source: "network" | "cache" | "fallback";
}

const fallbackVenues: CachedVenue[] = [
  { id: "v1", name: "Lecture Hall 1", campus: "Mlimani", gps: [-6.7712, 39.2395] },
  { id: "v2", name: "COICT Block B", campus: "Mlimani", gps: [-6.7694, 39.2411] },
  { id: "v3", name: "UDBS Auditorium", campus: "Mlimani", gps: [-6.7722, 39.2388] }
];

/**
 * Loads venues with network-first strategy and IndexedDB cache fallback.
 */
export async function fetchVenues(): Promise<VenueFetchResult> {
  try {
    const response = await apiClient.get<CachedVenue[] | { venues?: CachedVenue[] }>("/venues");
    const venues = Array.isArray(response.data) ? response.data : response.data.venues ?? [];
    if (venues.length > 0) {
      await db.venues.bulkPut(venues);
    }
    return { venues, source: "network" };
  } catch {
    const cachedVenues = await db.venues.toArray();
    if (cachedVenues.length > 0) {
      return { venues: cachedVenues, source: "cache" };
    }
    return { venues: fallbackVenues, source: "fallback" };
  }
}
