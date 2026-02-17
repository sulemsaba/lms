import { describe, expect, it } from "vitest";
import type { AccessibleRoute } from "@/features/map/campusMapData";
import { computeLocalRoute } from "@/features/map/navigation";

const CONNECTED_ROUTES: AccessibleRoute[] = [
  {
    id: "r1",
    label: "A to B",
    path: [
      [-6.7825, 39.2025],
      [-6.7818, 39.2032]
    ],
    accessible: true
  },
  {
    id: "r2",
    label: "B to C",
    path: [
      [-6.7818, 39.2032],
      [-6.7805, 39.2046]
    ],
    accessible: true
  }
];

describe("computeLocalRoute", () => {
  it("returns local-graph route when graph is connected", () => {
    const result = computeLocalRoute([-6.7825, 39.2025], [-6.7805, 39.2046], {
      routes: CONNECTED_ROUTES
    });

    expect(result.source).toBe("local-graph");
    expect(result.polyline.length).toBeGreaterThan(2);
    expect(result.distanceMeters).toBeGreaterThan(0);
    expect(result.warning).toBeUndefined();
  });

  it("returns same-node guidance when origin and destination snap to the same node", () => {
    const result = computeLocalRoute([-6.7825, 39.2025], [-6.7825, 39.2025], {
      routes: CONNECTED_ROUTES
    });

    expect(result.source).toBe("local-graph");
    expect(result.steps[0]).toContain("already at the destination");
  });

  it("falls back to directional route when graph is disconnected", () => {
    const disconnectedRoutes: AccessibleRoute[] = [
      {
        id: "d1",
        label: "left cluster",
        path: [
          [-6.7825, 39.2025],
          [-6.7818, 39.2032]
        ],
        accessible: true
      },
      {
        id: "d2",
        label: "right cluster",
        path: [
          [-6.7701, 39.2401],
          [-6.7699, 39.2403]
        ],
        accessible: true
      }
    ];

    const result = computeLocalRoute([-6.7825, 39.2025], [-6.7699, 39.2403], {
      routes: disconnectedRoutes
    });

    expect(result.source).toBe("direct-line");
    expect(result.warning).toContain("not be walkable");
    expect(result.polyline).toHaveLength(2);
  });

  it("respects route weights when choosing path", () => {
    const weightedRoutes: AccessibleRoute[] = [
      {
        id: "direct-heavy",
        label: "A to C heavy",
        path: [
          [0, 0],
          [0, 0.002]
        ],
        accessible: true,
        weightMultiplier: 3
      },
      {
        id: "via-b-light-1",
        label: "A to B light",
        path: [
          [0, 0],
          [0, 0.001]
        ],
        accessible: true,
        weightMultiplier: 1
      },
      {
        id: "via-b-light-2",
        label: "B to C light",
        path: [
          [0, 0.001],
          [0, 0.002]
        ],
        accessible: true,
        weightMultiplier: 1
      }
    ];

    const result = computeLocalRoute([0, 0], [0, 0.002], { routes: weightedRoutes });
    const hasIntermediateB = result.polyline.some((point) => point[0] === 0 && point[1] === 0.001);
    expect(result.source).toBe("local-graph");
    expect(hasIntermediateB).toBe(true);
  });
});
