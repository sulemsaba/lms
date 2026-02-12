import { create } from "zustand";
import type { CachedVenue } from "@/services/db";

interface VenueState {
  venues: CachedVenue[];
  filteredVenues: CachedVenue[];
  setVenues: (venues: CachedVenue[]) => void;
  searchVenues: (term: string) => void;
}

export const useVenueStore = create<VenueState>((set, get) => ({
  venues: [],
  filteredVenues: [],
  setVenues: (venues) => set({ venues, filteredVenues: venues }),
  searchVenues: (term) => {
    const normalized = term.trim().toLowerCase();
    const filtered = get().venues.filter((venue) =>
      venue.name.toLowerCase().includes(normalized)
    );
    set({ filteredVenues: filtered });
  }
}));
