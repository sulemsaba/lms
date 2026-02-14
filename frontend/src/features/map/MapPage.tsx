import { useEffect, useState } from "react";
import LeafletMap from "@/components/map/LeafletMap";
import RouteDisplay from "@/components/map/RouteDisplay";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { fetchVenues } from "@/services/api/venuesApi";
import { useVenueStore } from "@/stores/venueStore";
import styles from "./MapPage.module.css";

/**
 * Campus map and route experience.
 */
export default function MapPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sourceLabel, setSourceLabel] = useState("");
  const filteredVenues = useVenueStore((state) => state.filteredVenues);
  const setVenues = useVenueStore((state) => state.setVenues);
  const searchVenues = useVenueStore((state) => state.searchVenues);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const result = await fetchVenues();
      if (!mounted) {
        return;
      }
      setVenues(result.venues);
      if (result.source === "cache") {
        setSourceLabel("Showing cached venues (offline mode).");
      } else if (result.source === "fallback") {
        setSourceLabel("Showing built-in map data. Connect once to cache real venues.");
      } else {
        setSourceLabel("");
      }
      setLoading(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [setVenues]);

  useEffect(() => {
    searchVenues(query);
  }, [query, searchVenues]);

  if (loading) {
    return <SkeletonLoader type="card" />;
  }

  const primaryVenue = filteredVenues[0] ?? { gps: [-6.7712, 39.2395], name: "Mlimani Gate" };

  return (
    <section className={styles.stack}>
      <div className={styles.toolbar}>
        <input
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search venue"
          aria-label="Search venue"
        />
      </div>
      {sourceLabel ? <p className={styles.hint}>{sourceLabel}</p> : null}
      <LeafletMap center={primaryVenue.gps} />
      <RouteDisplay
        steps={[
          `Start at ${primaryVenue.name}`,
          "Walk 120m toward main courtyard",
          "Turn left and continue for 2 minutes"
        ]}
      />
    </section>
  );
}
