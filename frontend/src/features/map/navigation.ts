import type { AccessibleRoute } from "@/features/map/campusMapData";

export type RouteSource = "google" | "local-graph" | "direct-line";

export interface NavigationResult {
  source: RouteSource;
  polyline: [number, number][];
  steps: string[];
  distanceMeters: number;
  etaMinutes: number;
  warning?: string;
}

export interface LocalGraphConfig {
  routes: AccessibleRoute[];
  walkingSpeedMps?: number;
}

interface GraphEdge {
  to: string;
  weight: number;
  segmentDistance: number;
}

interface GraphNode {
  id: string;
  point: [number, number];
}

interface GraphData {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, GraphEdge[]>;
}

const DEFAULT_WALKING_SPEED_MPS = 1.25;

const coordinateKey = (point: [number, number]): string => `${point[0].toFixed(6)},${point[1].toFixed(6)}`;

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

const buildGraph = (routes: AccessibleRoute[]): GraphData => {
  const nodes = new Map<string, GraphNode>();
  const adjacency = new Map<string, GraphEdge[]>();

  const addNode = (point: [number, number]): string => {
    const id = coordinateKey(point);
    if (!nodes.has(id)) {
      nodes.set(id, { id, point });
      adjacency.set(id, []);
    }
    return id;
  };

  const addEdge = (fromId: string, toId: string, distance: number, route: AccessibleRoute): void => {
    const multiplier = route.weightMultiplier ?? 1;
    const effectiveWeight = distance * multiplier;
    const edges = adjacency.get(fromId);
    if (!edges) {
      return;
    }
    edges.push({ to: toId, weight: effectiveWeight, segmentDistance: distance });
  };

  for (const route of routes) {
    if (route.path.length < 2) {
      continue;
    }
    for (let index = 0; index < route.path.length - 1; index += 1) {
      const fromPoint = route.path[index];
      const toPoint = route.path[index + 1];
      const fromId = addNode(fromPoint);
      const toId = addNode(toPoint);
      const segmentDistance = calculateDistanceMeters(fromPoint, toPoint);
      addEdge(fromId, toId, segmentDistance, route);
      addEdge(toId, fromId, segmentDistance, route);
    }
  }

  return { nodes, adjacency };
};

const findNearestNode = (graph: GraphData, point: [number, number]): GraphNode | null => {
  let best: { node: GraphNode; distance: number } | null = null;
  for (const node of graph.nodes.values()) {
    const distance = calculateDistanceMeters(point, node.point);
    if (!best || distance < best.distance) {
      best = { node, distance };
    }
  }
  return best?.node ?? null;
};

const runDijkstra = (
  graph: GraphData,
  startNodeId: string,
  destinationNodeId: string
): { pathNodeIds: string[]; weightedCost: number; pathDistance: number } | null => {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const rawDistance = new Map<string, number>();
  const unvisited = new Set<string>(graph.nodes.keys());

  for (const nodeId of graph.nodes.keys()) {
    distances.set(nodeId, Number.POSITIVE_INFINITY);
    rawDistance.set(nodeId, Number.POSITIVE_INFINITY);
    previous.set(nodeId, null);
  }
  distances.set(startNodeId, 0);
  rawDistance.set(startNodeId, 0);

  while (unvisited.size > 0) {
    let currentNodeId: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const nodeId of unvisited) {
      const candidateDistance = distances.get(nodeId) ?? Number.POSITIVE_INFINITY;
      if (candidateDistance < bestDistance) {
        bestDistance = candidateDistance;
        currentNodeId = nodeId;
      }
    }

    if (!currentNodeId || bestDistance === Number.POSITIVE_INFINITY) {
      break;
    }

    if (currentNodeId === destinationNodeId) {
      break;
    }

    unvisited.delete(currentNodeId);
    const edges = graph.adjacency.get(currentNodeId) ?? [];
    for (const edge of edges) {
      if (!unvisited.has(edge.to)) {
        continue;
      }
      const nextDistance = bestDistance + edge.weight;
      if (nextDistance < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, nextDistance);
        previous.set(edge.to, currentNodeId);
        rawDistance.set(edge.to, (rawDistance.get(currentNodeId) ?? 0) + edge.segmentDistance);
      }
    }
  }

  const finalDistance = distances.get(destinationNodeId);
  if (!finalDistance || finalDistance === Number.POSITIVE_INFINITY) {
    return null;
  }

  const pathNodeIds: string[] = [];
  let current: string | null = destinationNodeId;
  while (current) {
    pathNodeIds.unshift(current);
    current = previous.get(current) ?? null;
  }
  if (pathNodeIds[0] !== startNodeId) {
    return null;
  }
  return {
    pathNodeIds,
    weightedCost: finalDistance,
    pathDistance: rawDistance.get(destinationNodeId) ?? finalDistance
  };
};

const estimateEtaMinutes = (distanceMeters: number, walkingSpeedMps: number): number =>
  Math.max(1, Math.round(distanceMeters / walkingSpeedMps / 60));

const createDirectionalFallback = (
  origin: [number, number],
  destination: [number, number],
  walkingSpeedMps: number
): NavigationResult => {
  const distanceMeters = calculateDistanceMeters(origin, destination);
  return {
    source: "direct-line",
    polyline: [origin, destination],
    steps: [
      "No connected accessible path was found between the selected points.",
      "Use the directional line for orientation and follow marked pedestrian walkways where available."
    ],
    distanceMeters,
    etaMinutes: estimateEtaMinutes(distanceMeters, walkingSpeedMps),
    warning: "Direction only; path may not be walkable."
  };
};

const toLocalGraphSteps = (
  origin: [number, number],
  destination: [number, number],
  snappedStart: [number, number],
  snappedEnd: [number, number]
): string[] => [
  "Route computed from local accessible paths.",
  `Move from your start point (${origin[0].toFixed(5)}, ${origin[1].toFixed(5)}) to the nearest mapped path node.`,
  `Follow the highlighted path to (${snappedEnd[0].toFixed(5)}, ${snappedEnd[1].toFixed(5)}).`,
  `Proceed to destination (${destination[0].toFixed(5)}, ${destination[1].toFixed(5)}).`
];

export const computeLocalRoute = (
  origin: [number, number],
  destination: [number, number],
  graphConfig: LocalGraphConfig
): NavigationResult => {
  const walkingSpeedMps = graphConfig.walkingSpeedMps ?? DEFAULT_WALKING_SPEED_MPS;
  const accessibleRoutes = graphConfig.routes.filter((route) => route.accessible !== false);
  const graph = buildGraph(accessibleRoutes);

  if (graph.nodes.size === 0) {
    return createDirectionalFallback(origin, destination, walkingSpeedMps);
  }

  const startNode = findNearestNode(graph, origin);
  const destinationNode = findNearestNode(graph, destination);
  if (!startNode || !destinationNode) {
    return createDirectionalFallback(origin, destination, walkingSpeedMps);
  }

  if (startNode.id === destinationNode.id) {
    const distanceMeters = calculateDistanceMeters(origin, destination);
    return {
      source: "local-graph",
      polyline: [origin, destination],
      steps: ["You are already at the destination node.", "Proceed to the exact destination point."],
      distanceMeters,
      etaMinutes: estimateEtaMinutes(distanceMeters, walkingSpeedMps)
    };
  }

  const shortestPath = runDijkstra(graph, startNode.id, destinationNode.id);
  if (!shortestPath) {
    return createDirectionalFallback(origin, destination, walkingSpeedMps);
  }

  const graphPoints = shortestPath.pathNodeIds
    .map((nodeId) => graph.nodes.get(nodeId)?.point ?? null)
    .filter((point): point is [number, number] => point !== null);
  const polyline = [origin, ...graphPoints, destination];
  const connectorDistance =
    calculateDistanceMeters(origin, startNode.point) + calculateDistanceMeters(destination, destinationNode.point);
  const distanceMeters = shortestPath.pathDistance + connectorDistance;

  return {
    source: "local-graph",
    polyline,
    steps: toLocalGraphSteps(origin, destination, startNode.point, destinationNode.point),
    distanceMeters,
    etaMinutes: estimateEtaMinutes(distanceMeters, walkingSpeedMps)
  };
};

export const parseGoogleStepInstructions = (htmlInstruction: string): string =>
  htmlInstruction
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
