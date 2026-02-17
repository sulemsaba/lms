import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LeafletMap, { type MapRouteRequest, type RouteUpdate } from "@/components/map/LeafletMap";
import RouteDisplay, { type RouteDisplayModel } from "@/components/map/RouteDisplay";
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
import {
  buildMapEntityIndex,
  decodeMapEntityRef,
  encodeMapEntityRef,
  mapEntityKey,
  searchMapEntities,
  type MapEntityRef,
  type MapSearchEntity
} from "@/features/map/mapSearch";
import styles from "./MapPage.module.css";

type CategoryFilter = "all" | CampusCategory;

const CATEGORY_FILTERS: CategoryFilter[] = ["all", ...CAMPUS_CATEGORY_ORDER];
const SEARCH_DEBOUNCE_MS = 200;
const SEARCH_RESULT_LIMIT = 140;

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

const DEFAULT_ROUTE_STEPS = [
  "Search and select a destination from the map entities list.",
  "Set route origin from GPS or choose a known campus location.",
  "Route guidance will stay inside this map and fallback locally if Google routing fails."
];

const normalizeText = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, " ");

const toRadians = (value: number): number => (value * Math.PI) / 180;

const calculateDistanceMeters = (left: [number, number], right: [number, number]): number => {
  const earthRadiusMeters = 6_371_000;
  const deltaLat = toRadians(right[0] - left[0]);
  const deltaLng = toRadians(right[1] - left[1]);
  const lat1 = toRadians(left[0]);
  const lat2 = toRadians(right[0]);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusMeters * angularDistance;
};

const getEntityIcon = (entity: MapSearchEntity, locationsById: Map<string, CampusLocation>): string => {
  if (entity.ref.type === "location") {
    const location = locationsById.get(entity.ref.id);
    if (location) {
      return CAMPUS_CATEGORY_CONFIG[location.category].icon;
    }
    return "place";
  }
  return entity.ref.type === "outline" ? "domain" : "route";
};

const findMainGateLocation = (locations: CampusLocation[]): CampusLocation | null => {
  const mainGate =
    locations.find((location) => normalizeText(location.name).includes("main gate")) ??
    locations.find((location) => normalizeText(location.name).includes("gate"));
  return mainGate ?? locations[0] ?? null;
};

/**
 * Campus map and route experience with unified in-map search and navigation.
 */
export default function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [queryInput, setQueryInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [sourceLabel, setSourceLabel] = useState("");
  const [networkVenues, setNetworkVenues] = useState<ReturnType<typeof enrichWithNetworkVenues>>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [originLocationId, setOriginLocationId] = useState<string | null>(null);
  const [originQuery, setOriginQuery] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationFeedback, setLocationFeedback] = useState("");
  const [externalFeedback, setExternalFeedback] = useState("");
  const [routeDisplay, setRouteDisplay] = useState<RouteDisplayModel>({
    status: "idle",
    steps: DEFAULT_ROUTE_STEPS
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const result = await fetchVenues();
      if (!mounted) {
        return;
      }
      const locations = enrichWithNetworkVenues(result.venues);
      setNetworkVenues(locations);
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

  useEffect(() => {
    const queryFromUrl = searchParams.get("q") ?? "";
    if (queryFromUrl !== queryInput) {
      setQueryInput(queryFromUrl);
    }
  }, [queryInput, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(queryInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [queryInput]);

  const locationsById = useMemo(() => new Map(networkVenues.map((location) => [location.id, location])), [networkVenues]);
  const mainGateLocation = useMemo(() => findMainGateLocation(networkVenues), [networkVenues]);

  useEffect(() => {
    if (!originLocationId && mainGateLocation) {
      setOriginLocationId(mainGateLocation.id);
      setOriginQuery(mainGateLocation.name);
    }
  }, [mainGateLocation, originLocationId]);

  const entityIndex = useMemo(
    () => buildMapEntityIndex(networkVenues, CAMPUS_BUILDING_OUTLINES, CAMPUS_ACCESSIBLE_ROUTES),
    [networkVenues]
  );

  const entitiesByKey = useMemo(
    () => new Map(entityIndex.map((entity) => [mapEntityKey(entity.ref), entity])),
    [entityIndex]
  );

  const filteredEntities = useMemo(
    () => searchMapEntities(debouncedQuery, entityIndex, { category: activeCategory, limit: SEARCH_RESULT_LIMIT }),
    [activeCategory, debouncedQuery, entityIndex]
  );

  const focusedEntityFromUrl = useMemo(
    () => decodeMapEntityRef(searchParams.get("focus")),
    [searchParams]
  );

  const focusedEntity = useMemo(() => {
    if (!focusedEntityFromUrl) {
      return null;
    }
    return entitiesByKey.get(mapEntityKey(focusedEntityFromUrl)) ?? null;
  }, [entitiesByKey, focusedEntityFromUrl]);

  const selectedEntity = useMemo(() => {
    if (!focusedEntity) {
      return filteredEntities[0] ?? null;
    }
    const existsInFiltered = filteredEntities.some(
      (entity) => mapEntityKey(entity.ref) === mapEntityKey(focusedEntity.ref)
    );
    if (existsInFiltered) {
      return focusedEntity;
    }
    return filteredEntities[0] ?? focusedEntity;
  }, [filteredEntities, focusedEntity]);

  const selectedLocation = useMemo(() => {
    if (!selectedEntity || selectedEntity.ref.type !== "location") {
      return null;
    }
    return locationsById.get(selectedEntity.ref.id) ?? null;
  }, [locationsById, selectedEntity]);

  const selectedOutline = useMemo(() => {
    if (!selectedEntity || selectedEntity.ref.type !== "outline") {
      return null;
    }
    return CAMPUS_BUILDING_OUTLINES.find((outline) => outline.id === selectedEntity.ref.id) ?? null;
  }, [selectedEntity]);

  const selectedRoute = useMemo(() => {
    if (!selectedEntity || selectedEntity.ref.type !== "route") {
      return null;
    }
    return CAMPUS_ACCESSIBLE_ROUTES.find((route) => route.id === selectedEntity.ref.id) ?? null;
  }, [selectedEntity]);

  useEffect(() => {
    const floors = selectedLocation?.floorPlans ?? [];
    if (floors.length === 0) {
      setSelectedFloorId(null);
      return;
    }
    if (!selectedFloorId || !floors.some((floor) => floor.id === selectedFloorId)) {
      setSelectedFloorId(floors[0].id);
    }
  }, [selectedFloorId, selectedLocation]);

  const selectedFloor = useMemo(() => {
    if (!selectedLocation?.floorPlans || selectedLocation.floorPlans.length === 0) {
      return null;
    }
    return selectedLocation.floorPlans.find((floor) => floor.id === selectedFloorId) ?? selectedLocation.floorPlans[0];
  }, [selectedFloorId, selectedLocation]);

  const visibleLocations = useMemo(() => {
    const allowedLocationIds = new Set(
      filteredEntities.filter((entity) => entity.ref.type === "location").map((entity) => entity.ref.id)
    );
    return networkVenues.filter((location) => allowedLocationIds.has(location.id));
  }, [filteredEntities, networkVenues]);

  const selectedOriginLocation = useMemo(() => {
    if (originLocationId) {
      return locationsById.get(originLocationId) ?? null;
    }
    return mainGateLocation;
  }, [locationsById, mainGateLocation, originLocationId]);

  const routeOrigin = userLocation ?? selectedOriginLocation?.position ?? CAMPUS_CENTER;
  const routeOriginLabel = userLocation ? "Current GPS location" : selectedOriginLocation?.name ?? "Main Gate";
  const routeDestination = selectedEntity?.anchor ?? null;

  const routeRequest = useMemo<MapRouteRequest | null>(() => {
    if (!routeDestination) {
      return null;
    }
    return {
      origin: routeOrigin,
      destination: routeDestination,
      originLabel: routeOriginLabel,
      destinationLabel: selectedEntity?.title ?? "Destination"
    };
  }, [routeDestination, routeOrigin, routeOriginLabel, selectedEntity?.title]);

  const routeRequestKey = useMemo(() => {
    if (!routeRequest) {
      return "";
    }
    return [
      routeRequest.origin[0].toFixed(6),
      routeRequest.origin[1].toFixed(6),
      routeRequest.destination[0].toFixed(6),
      routeRequest.destination[1].toFixed(6)
    ].join(":");
  }, [routeRequest]);

  useEffect(() => {
    if (!routeRequest) {
      setRouteDisplay({ status: "idle", steps: DEFAULT_ROUTE_STEPS });
      return;
    }
    setRouteDisplay((current) => ({
      status: "loading",
      steps: current.steps.length > 0 ? current.steps : ["Calculating route..."]
    }));
  }, [routeRequestKey]);

  const updateQueryParam = useCallback(
    (value: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value.trim()) {
            next.set("q", value);
          } else {
            next.delete("q");
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const onQueryChange = useCallback(
    (value: string) => {
      setQueryInput(value);
      updateQueryParam(value);
    },
    [updateQueryParam]
  );

  const onSelectEntity = useCallback(
    (ref: MapEntityRef) => {
      setExternalFeedback("");
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("focus", encodeMapEntityRef(ref));
          if (queryInput.trim()) {
            next.set("q", queryInput);
          } else {
            next.delete("q");
          }
          return next;
        },
        { replace: false }
      );
    },
    [queryInput, setSearchParams]
  );

  const findNearestLocation = useCallback(
    (position: [number, number]): CampusLocation | null =>
      networkVenues.reduce((closest, location) => {
        const distance = calculateDistanceMeters(position, location.position);
        if (!closest || distance < closest.distance) {
          return { location, distance };
        }
        return closest;
      }, null as { location: CampusLocation; distance: number } | null)?.location ?? null,
    [networkVenues]
  );

  const onLocateMe = useCallback(async () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationFeedback("Location services are unavailable in this browser. Using selected origin instead.");
      return;
    }

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          const nearest = findNearestLocation(coords);
          if (nearest) {
            setLocationFeedback(`Using GPS origin. Nearest known point: ${nearest.name}.`);
          } else {
            setLocationFeedback("Using GPS origin.");
          }
          resolve();
        },
        () => {
          setUserLocation(null);
          if (mainGateLocation) {
            setOriginLocationId(mainGateLocation.id);
            setOriginQuery(mainGateLocation.name);
          }
          setLocationFeedback("GPS unavailable or denied. Using Main Gate origin. You can pick another origin below.");
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 45_000 }
      );
    });
  }, [findNearestLocation, mainGateLocation]);

  const onUseMainGateOrigin = useCallback(() => {
    if (!mainGateLocation) {
      return;
    }
    setUserLocation(null);
    setOriginLocationId(mainGateLocation.id);
    setOriginQuery(mainGateLocation.name);
    setLocationFeedback(`Route origin set to ${mainGateLocation.name}.`);
  }, [mainGateLocation]);

  const onRouteResult = useCallback((update: RouteUpdate) => {
    if (update.status === "error") {
      setRouteDisplay({
        status: "error",
        steps: ["Unable to compute a route for the current selection."],
        error: update.error
      });
      return;
    }

    setRouteDisplay({
      status: "ready",
      source: update.route.source,
      distanceMeters: update.route.distanceMeters,
      etaMinutes: update.route.etaMinutes,
      steps: update.route.steps,
      warning: update.route.warning
    });
  }, []);

  const onOpenExternalRoute = useCallback(() => {
    if (!routeRequest) {
      setExternalFeedback("Select a destination to open external routing.");
      return;
    }
    const origin = `${routeRequest.origin[0]},${routeRequest.origin[1]}`;
    const destination = `${routeRequest.destination[0]},${routeRequest.destination[1]}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;

    if (typeof window === "undefined") {
      setExternalFeedback(url);
      return;
    }

    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (opened) {
      setExternalFeedback("Opened Google Maps route in a new tab.");
      return;
    }
    setExternalFeedback(`Popup blocked. Open manually: ${url}`);
  }, [routeRequest]);

  const normalizedOriginQuery = normalizeText(originQuery);
  const originCandidates = useMemo(() => {
    if (!normalizedOriginQuery) {
      return networkVenues.slice(0, 8);
    }
    return networkVenues
      .filter((location) => {
        const haystack = `${location.name} ${location.building ?? ""}`.toLowerCase();
        return haystack.includes(normalizedOriginQuery);
      })
      .slice(0, 8);
  }, [networkVenues, normalizedOriginQuery]);

  const onPickOrigin = useCallback(
    (location: CampusLocation) => {
      setOriginLocationId(location.id);
      setUserLocation(null);
      setOriginQuery(location.name);
      setLocationFeedback(`Route origin set to ${location.name}.`);
    },
    []
  );

  const mapCenter = selectedEntity?.anchor ?? routeOrigin ?? CAMPUS_CENTER;

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
            value={queryInput}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search location, route, outline, room, or facility"
            aria-label="Search campus map entities"
          />
        </label>
        {queryInput ? (
          <button type="button" className={styles.clearButton} onClick={() => onQueryChange("")}>
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
      <div className={styles.quickActions} role="group" aria-label="Map quick actions">
        <button type="button" className={styles.quickActionButton} onClick={() => void onLocateMe()}>
          <span className="material-symbols-rounded">my_location</span>
          <span>Use GPS Origin</span>
        </button>
        <button type="button" className={styles.quickActionButton} onClick={onUseMainGateOrigin}>
          <span className="material-symbols-rounded">gate</span>
          <span>Use Main Gate</span>
        </button>
        <button type="button" className={styles.quickActionButton} onClick={onOpenExternalRoute}>
          <span className="material-symbols-rounded">open_in_new</span>
          <span>Open Google Route</span>
        </button>
      </div>
      {locationFeedback ? <p className={styles.hint}>{locationFeedback}</p> : null}
      {externalFeedback ? <p className={styles.hint}>{externalFeedback}</p> : null}

      <div className={styles.originCard}>
        <h4>Route Origin</h4>
        <p className={styles.hint}>Current origin: {routeOriginLabel}</p>
        <label className={styles.originSearchField}>
          <span className="material-symbols-rounded">pin_drop</span>
          <input
            value={originQuery}
            onChange={(event) => setOriginQuery(event.target.value)}
            placeholder="Search origin location"
            aria-label="Search route origin"
          />
        </label>
        <div className={styles.originList}>
          {originCandidates.map((location) => (
            <button
              key={location.id}
              type="button"
              className={`${styles.originButton} ${originLocationId === location.id && !userLocation ? styles.originButtonActive : ""}`.trim()}
              onClick={() => onPickOrigin(location)}
            >
              {location.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.mapLayout}>
        <div className={styles.mapCard}>
          <LeafletMap
            center={mapCenter}
            locations={visibleLocations}
            selectedEntity={selectedEntity?.ref ?? null}
            buildingOutlines={CAMPUS_BUILDING_OUTLINES}
            accessibleRoutes={CAMPUS_ACCESSIBLE_ROUTES}
            routeRequest={routeRequest}
            onSelectEntity={onSelectEntity}
            onRouteResult={onRouteResult}
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
            <h3>{selectedEntity?.title ?? "No destination selected"}</h3>
            {selectedEntity ? (
              <span className={styles.categoryTag}>
                {selectedEntity.ref.type === "location"
                  ? CAMPUS_CATEGORY_CONFIG[selectedLocation?.category ?? "academic"].label
                  : selectedEntity.ref.type === "outline"
                    ? "Building Outline"
                    : "Accessible Route"}
              </span>
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
          ) : selectedOutline ? (
            <>
              <p className={styles.description}>Building footprint overlay for map orientation and quick area selection.</p>
              <p className={styles.metaLine}>
                <span className="material-symbols-rounded">square_foot</span>
                {selectedOutline.path.length} outline points
              </p>
            </>
          ) : selectedRoute ? (
            <>
              <p className={styles.description}>Accessible pathway segment highlighted on the map.</p>
              <p className={styles.metaLine}>
                <span className="material-symbols-rounded">footprint</span>
                {selectedRoute.path.length} path nodes
              </p>
              <p className={styles.metaLine}>
                <span className="material-symbols-rounded">accessible</span>
                {selectedRoute.accessible === false ? "Restricted" : "Accessible"}
              </p>
            </>
          ) : (
            <p className={styles.emptyState}>Use search and filters to find a destination.</p>
          )}
        </aside>
      </div>

      <div className={styles.locationListCard}>
        <div className={styles.locationListHeader}>
          <h3>Map Search Results</h3>
          <p>{filteredEntities.length} results</p>
        </div>
        {filteredEntities.length > 0 ? (
          <div className={styles.locationList}>
            {filteredEntities.map((entity) => {
              const active = selectedEntity ? mapEntityKey(selectedEntity.ref) === mapEntityKey(entity.ref) : false;
              return (
                <button
                  key={mapEntityKey(entity.ref)}
                  type="button"
                  className={`${styles.locationRow} ${active ? styles.locationRowActive : ""}`.trim()}
                  onClick={() => onSelectEntity(entity.ref)}
                >
                  <span className="material-symbols-rounded">{getEntityIcon(entity, locationsById)}</span>
                  <span className={styles.locationText}>
                    <strong>{entity.title}</strong>
                    <small>{entity.subtitle}</small>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className={styles.emptyState}>No map entities match your current search and filter.</p>
        )}
      </div>

      <RouteDisplay route={routeDisplay} />
    </section>
  );
}
