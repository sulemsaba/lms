import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

/**
 * Interactive Leaflet wrapper with category markers and route overlays.
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
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      zoomControl: true
    }).setView(center, 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    mapRef.current.setView(center, mapRef.current.getZoom(), { animate: true });
  }, [center]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const layerGroup = L.layerGroup().addTo(mapRef.current);

    for (const outline of buildingOutlines) {
      L.polygon(outline.path, {
        color: "#334155",
        weight: 1.4,
        fillColor: "#cbd5e1",
        fillOpacity: 0.1
      })
        .bindTooltip(outline.label, { direction: "top", opacity: 0.85 })
        .addTo(layerGroup);
    }

    for (const route of accessibleRoutes) {
      L.polyline(route.path, {
        color: "#15803d",
        weight: 4,
        opacity: 0.85,
        dashArray: "8 8"
      })
        .bindTooltip(route.label, { sticky: true })
        .addTo(layerGroup);
    }

    for (const location of locations) {
      const config = CAMPUS_CATEGORY_CONFIG[location.category];
      const isSelected = selectedLocationId === location.id;
      const circleMarker = L.circleMarker(location.position, {
        radius: isSelected ? 10 : 7,
        color: config.markerColor,
        fillColor: config.markerColor,
        fillOpacity: isSelected ? 0.95 : 0.78,
        weight: isSelected ? 3 : 1.5
      });

      const roomPreview =
        location.roomNumbers && location.roomNumbers.length > 0
          ? `<br/>Rooms: ${location.roomNumbers.slice(0, 2).map(escapeHtml).join(", ")}`
          : "";

      circleMarker
        .bindPopup(`<strong>${escapeHtml(location.name)}</strong><br/>${escapeHtml(config.label)}${roomPreview}`)
        .on("click", () => {
          onSelectLocation(location.id);
        })
        .addTo(layerGroup);
    }

    return () => {
      layerGroup.remove();
    };
  }, [locations, selectedLocationId, buildingOutlines, accessibleRoutes, onSelectLocation]);

  return <div className={styles.map} ref={containerRef} data-testid="leaflet-map" />;
}

const escapeHtml = (input: string): string =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
