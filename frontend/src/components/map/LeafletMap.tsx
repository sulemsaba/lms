import { useEffect, useMemo, useRef, useState } from "react";
import {
  CAMPUS_CATEGORY_CONFIG,
  type AccessibleRoute,
  type BuildingOutline,
  type CampusLocation
} from "@/features/map/campusMapData";
import styles from "./LeafletMap.module.css";

interface LeafletMapProps {
  center: [number, number];
  locations: CampusLocation[];
  selectedLocationId: string | null;
  buildingOutlines: BuildingOutline[];
  accessibleRoutes: AccessibleRoute[];
  onSelectLocation: (locationId: string) => void;
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
  selectedLocationId,
  buildingOutlines,
  accessibleRoutes,
  onSelectLocation
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
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
      mapRef.current = null;
      infoWindowRef.current = null;
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
      const polygon = new googleApi.maps.Polygon({
        paths: outline.path.map(([lat, lng]: [number, number]) => ({ lat, lng })),
        strokeColor: "#334155",
        strokeWeight: 1.4,
        fillColor: "#cbd5e1",
        fillOpacity: 0.1,
        map
      });
      polygon.addListener("click", (event: any) => {
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
      const polyline = new googleApi.maps.Polyline({
        path: route.path.map(([lat, lng]: [number, number]) => ({ lat, lng })),
        strokeColor: "#15803d",
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map
      });
      polyline.addListener("click", (event: any) => {
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
      const isSelected = selectedLocationId === location.id;
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
        onSelectLocation(location.id);
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
  }, [locations, selectedLocationId, buildingOutlines, accessibleRoutes, onSelectLocation, status]);

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className={styles.mapFallback} data-testid="leaflet-map">
        <p className={styles.mapNotice}>
          Google Maps API key missing. Showing embedded Google Map fallback. Set <code>VITE_GOOGLE_MAPS_API_KEY</code>{" "}
          to enable interactive overlays.
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
