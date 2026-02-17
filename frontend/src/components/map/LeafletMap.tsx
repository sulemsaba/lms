import { useEffect, useMemo, useRef, useState } from "react";
import {
  CAMPUS_CATEGORY_CONFIG,
  type AccessibleRoute,
  type BuildingOutline,
  type CampusLocation
} from "@/features/map/campusMapData";
import { computeLocalRoute, parseGoogleStepInstructions, type NavigationResult } from "@/features/map/navigation";
import type { MapEntityRef } from "@/features/map/mapSearch";
import styles from "./LeafletMap.module.css";

export interface MapRouteRequest {
  origin: [number, number];
  destination: [number, number];
  originLabel: string;
  destinationLabel: string;
}

export type RouteUpdate =
  | { status: "ready"; route: NavigationResult }
  | { status: "error"; error: string };

interface LeafletMapProps {
  center: [number, number];
  locations: CampusLocation[];
  selectedEntity: MapEntityRef | null;
  buildingOutlines: BuildingOutline[];
  accessibleRoutes: AccessibleRoute[];
  routeRequest: MapRouteRequest | null;
  onSelectEntity: (entity: MapEntityRef) => void;
  onRouteResult: (update: RouteUpdate) => void;
}

type MapStatus = "idle" | "loading" | "ready" | "error" | "missing-key";

interface GoogleWindow extends Window {
  google?: any;
  __googleMapsPromise?: Promise<any>;
}

const GOOGLE_MAPS_KEY = ((import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "").trim();

function loadGoogleMapsApi(apiKey: string): Promise<any> {
  const googleWindow = window as GoogleWindow;
  if (googleWindow.google?.maps) {
    return Promise.resolve(googleWindow.google);
  }
  if (googleWindow.__googleMapsPromise) {
    return googleWindow.__googleMapsPromise;
  }

  googleWindow.__googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (googleWindow.google?.maps) {
        resolve(googleWindow.google);
      } else {
        reject(new Error("Google Maps loaded but maps namespace is unavailable."));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Google Maps API script."));
    document.head.appendChild(script);
  });

  return googleWindow.__googleMapsPromise;
}

/**
 * Interactive Google Map wrapper with category markers and route overlays.
 */
export default function LeafletMap({
  center,
  locations,
  selectedEntity,
  buildingOutlines,
  accessibleRoutes,
  routeRequest,
  onSelectEntity,
  onRouteResult
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const routeOverlayRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const routeRequestIdRef = useRef(0);
  const routeCacheRef = useRef<Map<string, NavigationResult>>(new Map());
  const infoWindowRef = useRef<any>(null);
  const [status, setStatus] = useState<MapStatus>("idle");
  const fallbackEmbedUrl = useMemo(
    () => `https://maps.google.com/maps?q=${encodeURIComponent(`${center[0]},${center[1]}`)}&z=16&output=embed`,
    [center]
  );

  const clearOverlays = () => {
    for (const overlay of overlaysRef.current) {
      if (overlay && typeof overlay.setMap === "function") {
        overlay.setMap(null);
      }
    }
    overlaysRef.current = [];
  };

  const clearRouteOverlay = () => {
    if (routeOverlayRef.current && typeof routeOverlayRef.current.setMap === "function") {
      routeOverlayRef.current.setMap(null);
    }
    routeOverlayRef.current = null;
  };

  const drawRouteOverlay = (route: NavigationResult) => {
    const googleApi = (window as GoogleWindow).google;
    if (!googleApi?.maps || !mapRef.current || route.polyline.length < 2) {
      return;
    }

    clearRouteOverlay();

    const routeColor =
      route.source === "google" ? "#0284c7" : route.source === "local-graph" ? "#166534" : "#c2410c";
    const routeWeight = route.source === "google" ? 5 : route.source === "local-graph" ? 5 : 4;

    routeOverlayRef.current = new googleApi.maps.Polyline({
      path: route.polyline.map(([lat, lng]) => ({ lat, lng })),
      strokeColor: routeColor,
      strokeOpacity: 0.92,
      strokeWeight: routeWeight,
      map: mapRef.current
    });
  };

  useEffect(() => {
    let mounted = true;

    if (!GOOGLE_MAPS_KEY) {
      setStatus("missing-key");
      return;
    }

    if (!containerRef.current || mapRef.current) {
      return;
    }

    setStatus("loading");

    void loadGoogleMapsApi(GOOGLE_MAPS_KEY)
      .then((googleApi) => {
        if (!mounted || !containerRef.current || mapRef.current) {
          return;
        }
        const map = new googleApi.maps.Map(containerRef.current, {
          center: { lat: center[0], lng: center[1] },
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        mapRef.current = map;
        infoWindowRef.current = new googleApi.maps.InfoWindow();
        setStatus("ready");
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setStatus("error");
      });

    return () => {
      mounted = false;
      clearOverlays();
      clearRouteOverlay();
      mapRef.current = null;
      infoWindowRef.current = null;
      directionsServiceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) {
      return;
    }
    mapRef.current.setCenter({ lat: center[0], lng: center[1] });
  }, [center, status]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) {
      return;
    }

    const googleApi = (window as GoogleWindow).google;
    if (!googleApi?.maps) {
      return;
    }

    clearOverlays();
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;

    for (const outline of buildingOutlines) {
      const isSelected = selectedEntity?.type === "outline" && selectedEntity.id === outline.id;
      const polygon = new googleApi.maps.Polygon({
        paths: outline.path.map(([lat, lng]: [number, number]) => ({ lat, lng })),
        strokeColor: isSelected ? "#0f172a" : "#334155",
        strokeWeight: isSelected ? 3.1 : 1.4,
        fillColor: "#cbd5e1",
        fillOpacity: isSelected ? 0.25 : 0.1,
        map
      });
      polygon.addListener("click", (event: any) => {
        onSelectEntity({ type: "outline", id: outline.id });
        if (!infoWindow) {
          return;
        }
        infoWindow.setContent(`<strong>${escapeHtml(outline.label)}</strong>`);
        infoWindow.setPosition(event.latLng);
        infoWindow.open({ map });
      });
      overlaysRef.current.push(polygon);
    }

    for (const route of accessibleRoutes) {
      const isSelected = selectedEntity?.type === "route" && selectedEntity.id === route.id;
      const polyline = new googleApi.maps.Polyline({
        path: route.path.map(([lat, lng]: [number, number]) => ({ lat, lng })),
        strokeColor: isSelected ? "#14532d" : "#15803d",
        strokeOpacity: isSelected ? 0.95 : 0.85,
        strokeWeight: isSelected ? 6 : 4,
        map
      });
      polyline.addListener("click", (event: any) => {
        onSelectEntity({ type: "route", id: route.id });
        if (!infoWindow) {
          return;
        }
        infoWindow.setContent(`<strong>${escapeHtml(route.label)}</strong>`);
        infoWindow.setPosition(event.latLng);
        infoWindow.open({ map });
      });
      overlaysRef.current.push(polyline);
    }

    for (const location of locations) {
      const config = CAMPUS_CATEGORY_CONFIG[location.category];
      const isSelected = selectedEntity?.type === "location" && selectedEntity.id === location.id;
      const marker = new googleApi.maps.Marker({
        position: { lat: location.position[0], lng: location.position[1] },
        map,
        title: location.name,
        icon: {
          path: googleApi.maps.SymbolPath.CIRCLE,
          fillColor: config.markerColor,
          fillOpacity: isSelected ? 0.95 : 0.78,
          strokeColor: "#ffffff",
          strokeWeight: isSelected ? 2.8 : 1.5,
          scale: isSelected ? 9 : 7
        }
      });

      const roomPreview =
        location.roomNumbers && location.roomNumbers.length > 0
          ? `<br/>Rooms: ${location.roomNumbers.slice(0, 2).map(escapeHtml).join(", ")}`
          : "";

      marker.addListener("click", () => {
        onSelectEntity({ type: "location", id: location.id });
        if (infoWindow) {
          infoWindow.setContent(`<strong>${escapeHtml(location.name)}</strong><br/>${escapeHtml(config.label)}${roomPreview}`);
          infoWindow.open({ anchor: marker, map });
        }
      });

      overlaysRef.current.push(marker);
    }

    return () => {
      clearOverlays();
    };
  }, [locations, selectedEntity, buildingOutlines, accessibleRoutes, onSelectEntity, status]);

  useEffect(() => {
    if (!routeRequest) {
      clearRouteOverlay();
      return;
    }

    const fallbackRoute = computeLocalRoute(routeRequest.origin, routeRequest.destination, {
      routes: accessibleRoutes
    });
    const requestId = routeRequestIdRef.current + 1;
    routeRequestIdRef.current = requestId;

    if (status === "missing-key") {
      onRouteResult({
        status: "ready",
        route: {
          ...fallbackRoute,
          warning:
            fallbackRoute.warning ??
            "Google Maps key missing. Showing local in-app route guidance."
        }
      });
      return;
    }

    if (status === "error") {
      onRouteResult({
        status: "ready",
        route: {
          ...fallbackRoute,
          warning:
            fallbackRoute.warning ??
            "Google Maps unavailable. Showing local in-app route guidance."
        }
      });
      return;
    }

    if (status !== "ready") {
      return;
    }

    const cacheKey = buildRouteCacheKey(routeRequest);
    const cachedRoute = routeCacheRef.current.get(cacheKey);
    if (cachedRoute) {
      drawRouteOverlay(cachedRoute);
      onRouteResult({ status: "ready", route: cachedRoute });
      return;
    }

    const timer = window.setTimeout(() => {
      const googleApi = (window as GoogleWindow).google;
      if (!googleApi?.maps) {
        const route = {
          ...fallbackRoute,
          warning:
            fallbackRoute.warning ??
            "Google Maps unavailable. Showing local in-app route guidance."
        };
        drawRouteOverlay(route);
        onRouteResult({ status: "ready", route });
        return;
      }

      directionsServiceRef.current ??= new googleApi.maps.DirectionsService();
      const service = directionsServiceRef.current;
      service.route(
        {
          origin: { lat: routeRequest.origin[0], lng: routeRequest.origin[1] },
          destination: { lat: routeRequest.destination[0], lng: routeRequest.destination[1] },
          travelMode: googleApi.maps.TravelMode.WALKING
        },
        (response: any, directionsStatus: string) => {
          if (routeRequestIdRef.current !== requestId) {
            return;
          }

          if (directionsStatus === "OK") {
            const route = toGoogleNavigationResult(response);
            if (route) {
              routeCacheRef.current.set(cacheKey, route);
              drawRouteOverlay(route);
              onRouteResult({ status: "ready", route });
              return;
            }
          }

          const fallbackWarning = describeDirectionsFailure(directionsStatus);
          const route = {
            ...fallbackRoute,
            warning: fallbackRoute.warning
              ? `${fallbackRoute.warning} ${fallbackWarning}`
              : `${fallbackWarning} Using local in-app guidance.`
          };
          drawRouteOverlay(route);
          onRouteResult({ status: "ready", route });
        }
      );
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [accessibleRoutes, onRouteResult, routeRequest, status]);

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className={styles.mapFallback} data-testid="leaflet-map">
        <p className={styles.mapNotice}>
          Google Maps API key missing. Showing embedded Google Map fallback. In-app route guidance still runs with local
          fallback logic.
        </p>
        <iframe title="Campus map fallback" src={fallbackEmbedUrl} className={styles.mapFrame} loading="lazy" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.mapFallback} data-testid="leaflet-map">
        <p className={styles.mapNotice}>
          Google Maps API failed to load. Showing embedded fallback. Check API key restrictions, billing, and network.
        </p>
        <iframe title="Campus map fallback" src={fallbackEmbedUrl} className={styles.mapFrame} loading="lazy" />
      </div>
    );
  }

  return <div className={styles.map} ref={containerRef} data-testid="leaflet-map" />;
}

const escapeHtml = (input: string): string =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildRouteCacheKey = (request: MapRouteRequest): string =>
  [
    request.origin[0].toFixed(6),
    request.origin[1].toFixed(6),
    request.destination[0].toFixed(6),
    request.destination[1].toFixed(6)
  ].join(":");

const toGoogleNavigationResult = (response: any): NavigationResult | null => {
  const selectedRoute = response?.routes?.[0];
  const legs: any[] = selectedRoute?.legs ?? [];
  const path: [number, number][] =
    selectedRoute?.overview_path?.map((point: { lat: () => number; lng: () => number }) => [point.lat(), point.lng()]) ??
    [];

  if (!selectedRoute || path.length < 2) {
    return null;
  }

  const steps = legs
    .flatMap((leg) =>
      (leg.steps ?? [])
        .map((step: any) => parseGoogleStepInstructions((step.instructions as string | undefined) ?? ""))
        .filter(Boolean)
    )
    .slice(0, 8);

  const distanceMeters = legs.reduce((sum, leg) => sum + Number((leg.distance?.value as number | undefined) ?? 0), 0);
  const durationSeconds = legs.reduce((sum, leg) => sum + Number((leg.duration?.value as number | undefined) ?? 0), 0);
  const etaMinutes = Math.max(1, Math.round((durationSeconds > 0 ? durationSeconds : distanceMeters / 1.25) / 60));

  return {
    source: "google",
    polyline: path,
    steps: steps.length > 0 ? steps : ["Follow the highlighted walking route to your destination."],
    distanceMeters,
    etaMinutes
  };
};

const describeDirectionsFailure = (status: string): string => {
  if (status === "OVER_QUERY_LIMIT") {
    return "Google route quota exceeded.";
  }
  if (status === "REQUEST_DENIED") {
    return "Google route request denied.";
  }
  if (status === "ZERO_RESULTS") {
    return "No Google walking route available.";
  }
  if (status === "INVALID_REQUEST") {
    return "Google route request was invalid.";
  }
  return "Google route unavailable.";
};
