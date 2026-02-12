import { apiClient } from "@/services/api/client";
import type { CachedVenue } from "@/services/db";

interface VenueApiResponse {
  venues: CachedVenue[];
}

const fallbackVenues: CachedVenue[] = [
  { id: "v1", name: "Lecture Hall 1", campus: "Mlimani", gps: [-6.7712, 39.2395] },
  { id: "v2", name: "COICT Block B", campus: "Mlimani", gps: [-6.7694, 39.2411] },
  { id: "v3", name: "UDBS Auditorium", campus: "Mlimani", gps: [-6.7722, 39.2388] }
];

export async function fetchVenues(): Promise<CachedVenue[]> {
  try {
    const response = await apiClient.get<VenueApiResponse>("/venues");
    return response.data.venues;
  } catch {
    return fallbackVenues;
  }
}
