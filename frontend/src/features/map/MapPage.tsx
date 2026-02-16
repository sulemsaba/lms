import { useCallback, useEffect, useMemo, useState } from "react";
import LeafletMap from "@/components/map/LeafletMap";
import RouteDisplay from "@/components/map/RouteDisplay";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { fetchVenues } from "@/services/api/venuesApi";
import {
  CAMPUS_ACCESSIBLE_ROUTES,
  CAMPUS_BUILDING_OUTLINES,
  CAMPUS_CATEGORY_CONFIG,
  CAMPUS_CATEGORY_ORDER,
  CAMPUS_CENTER,
  enrichWithNetworkVenues,
  type CampusCategory,
  type CampusLocation,
  type FloorSpaceKind
} from "@/features/map/campusMapData";
import styles from "./MapPage.module.css";

type CategoryFilter = "all" | CampusCategory;

const CATEGORY_FILTERS: CategoryFilter[] = ["all", ...CAMPUS_CATEGORY_ORDER];

const FLOOR_SPACE_KIND_LABEL: Record<FloorSpaceKind, string> = {
  classroom: "Classroom",
  lab: "Lab",
  restroom: "Restroom",
  elevator: "Elevator",
  quiet_zone: "Quiet Zone",
  study_room: "Study Room",
  office: "Office",
  entrance: "Entrance"
};

const locationMatchesQuery = (location: CampusLocation, normalizedQuery: string): boolean => {
  if (!normalizedQuery) {
    return true;
  }

  const categoryLabel = CAMPUS_CATEGORY_CONFIG[location.category].label;
  const floorLabels = (location.floorPlans ?? []).flatMap((floor) => floor.spaces.map((space) => space.label));

  const searchableTokens = [
    location.name,
    location.building ?? "",
    location.description ?? "",
    location.openingHours ?? "",
    categoryLabel,
    ...(location.roomNumbers ?? []),
    ...(location.facilities ?? []),
    ...(location.menuPreview ?? []),
    ...(location.accessibilityNotes ?? []),
    ...floorLabels
  ];

  return searchableTokens.some((token) => token.toLowerCase().includes(normalizedQuery));
};

const buildRouteSteps = (location: CampusLocation | null): string[] => {
  if (!location) {
    return [
      "Select a campus location from the list or map.",
      "Use category filters to focus on the facilities you need.",
      "Accessible routes are highlighted in green on the map."
    ];
  }

  const destinationLabel = location.building ? `${location.name} (${location.building})` : location.name;
  const roomHint = location.roomNumbers?.[0] ? `Proceed to ${location.roomNumbers[0]}.` : "Proceed to the main reception point.";

  return [
    `Start at Mlimani Gate and head toward ${destinationLabel}.`,
    "Follow walkways shown on the map and remain on marked pedestrian lanes.",
    roomHint
  ];
};

/**
 * Campus map and route experience.
 */
export default function MapPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [sourceLabel, setSourceLabel] = useState("");
  const [networkVenues, setNetworkVenues] = useState<ReturnType<typeof enrichWithNetworkVenues>>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const result = await fetchVenues();
      if (!mounted) {
        return;
      }
      setNetworkVenues(enrichWithNetworkVenues(result.venues));
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
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredLocations = useMemo(
    () =>
      networkVenues.filter((location) => {
        if (activeCategory !== "all" && location.category !== activeCategory) {
          return false;
        }
        return locationMatchesQuery(location, normalizedQuery);
      }),
    [activeCategory, networkVenues, normalizedQuery]
  );

  useEffect(() => {
    if (!selectedLocationId && filteredLocations.length > 0) {
      setSelectedLocationId(filteredLocations[0].id);
      return;
    }
    if (selectedLocationId && !filteredLocations.some((location) => location.id === selectedLocationId)) {
      setSelectedLocationId(filteredLocations[0]?.id ?? null);
    }
  }, [filteredLocations, selectedLocationId]);

  const selectedLocation = useMemo(
    () => filteredLocations.find((location) => location.id === selectedLocationId) ?? null,
    [filteredLocations, selectedLocationId]
  );

  useEffect(() => {
    const floors = selectedLocation?.floorPlans ?? [];
    if (floors.length === 0) {
      setSelectedFloorId(null);
      return;
    }
    if (!selectedFloorId || !floors.some((floor) => floor.id === selectedFloorId)) {
      setSelectedFloorId(floors[0].id);
    }
  }, [selectedLocation, selectedFloorId]);

  const selectedFloor = useMemo(() => {
    if (!selectedLocation?.floorPlans || selectedLocation.floorPlans.length === 0) {
      return null;
    }
    return selectedLocation.floorPlans.find((floor) => floor.id === selectedFloorId) ?? selectedLocation.floorPlans[0];
  }, [selectedFloorId, selectedLocation]);

  const mapCenter = selectedLocation?.position ?? CAMPUS_CENTER;

  const routeSteps = useMemo(() => buildRouteSteps(selectedLocation), [selectedLocation]);

  const onSelectLocation = useCallback((locationId: string) => {
    setSelectedLocationId(locationId);
  }, []);

  if (loading) {
    return <SkeletonLoader type="card" />;
  }

  return (
    <section className={styles.stack}>
      <div className={styles.toolbar}>
        <label className={styles.searchField}>
          <span className={`material-symbols-rounded ${styles.searchIcon}`}>search</span>
          <input
            className={styles.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search building, room, or facility"
            aria-label="Search campus locations"
          />
        </label>
        {query ? (
          <button type="button" className={styles.clearButton} onClick={() => setQuery("")}>
            Clear
          </button>
        ) : null}
      </div>

      <div className={styles.filterBar} role="group" aria-label="Location category filters">
        {CATEGORY_FILTERS.map((category) => {
          const active = category === activeCategory;
          const label = category === "all" ? "All" : CAMPUS_CATEGORY_CONFIG[category].label;
          const icon = category === "all" ? "filter_alt" : CAMPUS_CATEGORY_CONFIG[category].icon;
          return (
            <button
              key={category}
              type="button"
              className={`${styles.filterButton} ${active ? styles.filterButtonActive : ""}`.trim()}
              onClick={() => setActiveCategory(category)}
            >
              <span className="material-symbols-rounded">{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {sourceLabel ? <p className={styles.hint}>{sourceLabel}</p> : null}

      <div className={styles.mapLayout}>
        <div className={styles.mapCard}>
          <LeafletMap
            center={mapCenter}
            locations={filteredLocations}
            selectedLocationId={selectedLocationId}
            buildingOutlines={CAMPUS_BUILDING_OUTLINES}
            accessibleRoutes={CAMPUS_ACCESSIBLE_ROUTES}
            onSelectLocation={onSelectLocation}
          />
          <div className={styles.legend}>
            {CAMPUS_CATEGORY_ORDER.map((category) => {
              const config = CAMPUS_CATEGORY_CONFIG[category];
              return (
                <span key={category} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ backgroundColor: config.markerColor }} />
                  <span className="material-symbols-rounded">{config.icon}</span>
                  <span>{config.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        <aside className={styles.sidePanel}>
          <div className={styles.panelHeader}>
            <h3>{selectedLocation?.name ?? "No location selected"}</h3>
            {selectedLocation ? (
              <span className={styles.categoryTag}>{CAMPUS_CATEGORY_CONFIG[selectedLocation.category].label}</span>
            ) : null}
          </div>

          {selectedLocation ? (
            <>
              {selectedLocation.description ? <p className={styles.description}>{selectedLocation.description}</p> : null}
              {selectedLocation.openingHours ? (
                <p className={styles.metaLine}>
                  <span className="material-symbols-rounded">schedule</span>
                  {selectedLocation.openingHours}
                </p>
              ) : null}

              {selectedLocation.roomNumbers?.length ? (
                <div className={styles.infoBlock}>
                  <h4>Room Numbers</h4>
                  <div className={styles.pillRow}>
                    {selectedLocation.roomNumbers.map((room) => (
                      <span key={room} className={styles.infoPill}>
                        {room}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedLocation.facilities?.length ? (
                <div className={styles.infoBlock}>
                  <h4>Facilities</h4>
                  <div className={styles.pillRow}>
                    {selectedLocation.facilities.map((item) => (
                      <span key={item} className={styles.infoPillMuted}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedLocation.menuPreview?.length ? (
                <div className={styles.infoBlock}>
                  <h4>Menu Preview</h4>
                  <ul className={styles.list}>
                    {selectedLocation.menuPreview.map((menuItem) => (
                      <li key={menuItem}>{menuItem}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedLocation.accessibilityNotes?.length ? (
                <div className={styles.infoBlock}>
                  <h4>Accessibility Notes</h4>
                  <ul className={styles.list}>
                    {selectedLocation.accessibilityNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedLocation.floorPlans?.length ? (
                <div className={styles.floorPlanSection}>
                  <h4>Indoor Floor Plans</h4>
                  <div className={styles.floorTabs}>
                    {selectedLocation.floorPlans.map((floor) => (
                      <button
                        key={floor.id}
                        type="button"
                        className={`${styles.floorTab} ${selectedFloorId === floor.id ? styles.floorTabActive : ""}`.trim()}
                        onClick={() => setSelectedFloorId(floor.id)}
                      >
                        {floor.label}
                      </button>
                    ))}
                  </div>
                  {selectedFloor ? (
                    <div className={styles.floorSpaces}>
                      {selectedFloor.spaces.map((space) => (
                        <div key={space.id} className={styles.spaceRow}>
                          <span>{space.label}</span>
                          <span
                            className={`${styles.spaceBadge} ${styles[`space_${space.kind}` as keyof typeof styles] ?? ""}`}
                          >
                            {FLOOR_SPACE_KIND_LABEL[space.kind]}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <p className={styles.emptyState}>Use search and filters to find a location.</p>
          )}
        </aside>
      </div>

      <div className={styles.locationListCard}>
        <div className={styles.locationListHeader}>
          <h3>Campus Locations</h3>
          <p>{filteredLocations.length} results</p>
        </div>
        {filteredLocations.length > 0 ? (
          <div className={styles.locationList}>
            {filteredLocations.map((location) => {
              const config = CAMPUS_CATEGORY_CONFIG[location.category];
              const active = selectedLocationId === location.id;
              return (
                <button
                  key={location.id}
                  type="button"
                  className={`${styles.locationRow} ${active ? styles.locationRowActive : ""}`.trim()}
                  onClick={() => setSelectedLocationId(location.id)}
                >
                  <span className="material-symbols-rounded">{config.icon}</span>
                  <span className={styles.locationText}>
                    <strong>{location.name}</strong>
                    <small>{location.building ?? config.label}</small>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className={styles.emptyState}>No locations match your current search and filter.</p>
        )}
      </div>

      <RouteDisplay steps={routeSteps} />
    </section>
  );
}
