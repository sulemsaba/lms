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

interface ApiVenue {
  id?: string;
  name?: string;
  campus?: string;
  gps?: [number, number] | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
}

const toCachedVenue = (raw: ApiVenue): CachedVenue | null => {
  if (!raw.id || !raw.name || !raw.campus) {
    return null;
  }

  const gpsFromTuple = Array.isArray(raw.gps) && raw.gps.length === 2 ? raw.gps : null;
  const lat = gpsFromTuple?.[0] ?? raw.gps_lat;
  const lng = gpsFromTuple?.[1] ?? raw.gps_lng;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  return {
    id: raw.id,
    name: raw.name,
    campus: raw.campus,
    gps: [lat, lng]
  };
};

const normalizeVenuePayload = (payload: unknown): CachedVenue[] => {
  const candidateRows = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { venues?: unknown[] }).venues)
      ? (payload as { venues: unknown[] }).venues
      : [];

  const normalized = candidateRows
    .map((row) => toCachedVenue((row as ApiVenue) ?? {}))
    .filter((row): row is CachedVenue => row !== null);

  const dedupedById = new Map<string, CachedVenue>();
  for (const venue of normalized) {
    dedupedById.set(venue.id, venue);
  }
  return Array.from(dedupedById.values());
};

/**
 * Loads venues with network-first strategy and IndexedDB cache fallback.
 */
export async function fetchVenues(): Promise<VenueFetchResult> {
  try {
    const response = await apiClient.get<unknown>("/venues");
    const venues = normalizeVenuePayload(response.data);
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
