import { describe, expect, it } from "vitest";
import type { AccessibleRoute, BuildingOutline, CampusLocation } from "@/features/map/campusMapData";
import {
  buildMapEntityIndex,
  decodeMapEntityRef,
  encodeMapEntityRef,
  searchMapEntities
} from "@/features/map/mapSearch";

const locations: CampusLocation[] = [
  {
    id: "main-gate",
    name: "Main Gate (Sam Nujoma)",
    category: "transport",
    position: [-6.7825, 39.2025],
    description: "Primary entry gate"
  },
  {
    id: "old-library",
    name: "Old Library",
    category: "library",
    position: [-6.7798, 39.2055],
    roomNumbers: ["L-101", "L-102"]
  }
];

const outlines: BuildingOutline[] = [
  {
    id: "outline-old-library",
    label: "Old Library",
    path: [
      [-6.77992, 39.20535],
      [-6.77968, 39.20535],
      [-6.77968, 39.20567],
      [-6.77992, 39.20567]
    ]
  }
];

const routes: AccessibleRoute[] = [
  {
    id: "route-main-gate-library",
    label: "Step-free route: Main Gate to Old Library",
    path: [
      [-6.7825, 39.2025],
      [-6.7818, 39.2032],
      [-6.7798, 39.2055]
    ],
    accessible: true
  }
];

describe("mapSearch", () => {
  it("builds unified entities and finds all entity types", () => {
    const entities = buildMapEntityIndex(locations, outlines, routes);

    const locationHits = searchMapEntities("main gate", entities);
    expect(locationHits.some((entity) => entity.ref.type === "location" && entity.ref.id === "main-gate")).toBe(true);

    const outlineHits = searchMapEntities("old library outline", entities);
    expect(outlineHits.some((entity) => entity.ref.type === "outline")).toBe(true);

    const routeHits = searchMapEntities("step free route", entities);
    expect(routeHits.some((entity) => entity.ref.type === "route")).toBe(true);
  });

  it("supports alias and compact-token matching", () => {
    const entities = buildMapEntityIndex(locations, outlines, routes);
    const hits = searchMapEntities("maingate", entities);
    expect(hits[0]?.ref).toEqual({ type: "location", id: "main-gate" });
  });

  it("applies category filtering to locations while excluding non-location entities", () => {
    const entities = buildMapEntityIndex(locations, outlines, routes);
    const filtered = searchMapEntities("old", entities, { category: "library" });
    expect(filtered.every((entity) => entity.ref.type === "location")).toBe(true);
    expect(filtered.some((entity) => entity.ref.id === "old-library")).toBe(true);
  });

  it("round-trips focus encoding and decoding", () => {
    const encoded = encodeMapEntityRef({ type: "route", id: "route-main-gate-library" });
    expect(encoded).toBe("route:route-main-gate-library");
    expect(decodeMapEntityRef(encoded)).toEqual({ type: "route", id: "route-main-gate-library" });
    expect(decodeMapEntityRef("invalid-format")).toBeNull();
  });
});
