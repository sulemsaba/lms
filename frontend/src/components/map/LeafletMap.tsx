import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./LeafletMap.module.css";

interface LeafletMapProps {
  center: [number, number];
}

/**
 * Minimal Leaflet map wrapper ready for PMTiles integration.
 */
export default function LeafletMap({ center }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = L.map(mapRef.current, {
      zoomControl: true
    }).setView(center, 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    L.marker(center).addTo(map);

    return () => {
      map.remove();
    };
  }, [center]);

  return <div className={styles.map} ref={mapRef} data-testid="leaflet-map" />;
}
