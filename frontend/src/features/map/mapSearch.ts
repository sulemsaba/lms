import {
  CAMPUS_CATEGORY_CONFIG,
  type AccessibleRoute,
  type BuildingOutline,
  type CampusCategory,
  type CampusLocation
} from "@/features/map/campusMapData";

export type MapEntityType = "location" | "outline" | "route";

export interface MapEntityRef {
  type: MapEntityType;
  id: string;
}

export interface MapSearchEntity {
  ref: MapEntityRef;
  title: string;
  subtitle: string;
  anchor: [number, number];
  category?: CampusCategory;
  tokens: string[];
  aliases: string[];
}

interface SearchOptions {
  category?: CampusCategory | "all";
  limit?: number;
}

const TOKEN_SPLIT = /[^a-z0-9]+/g;

const normalizeToken = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, " ");

const tokenize = (value: string): string[] =>
  normalizeToken(value)
    .split(TOKEN_SPLIT)
    .map((token) => token.trim())
    .filter(Boolean);

const unique = (items: string[]): string[] => {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      values.push(item);
    }
  }
  return values;
};

const averagePoint = (points: [number, number][]): [number, number] => {
  if (points.length === 0) {
    return [0, 0];
  }
  const sum = points.reduce(
    (acc, point) => {
      acc[0] += point[0];
      acc[1] += point[1];
      return acc;
    },
    [0, 0] as [number, number]
  );
  return [sum[0] / points.length, sum[1] / points.length];
};

const buildAliases = (value: string): string[] => {
  const normalized = normalizeToken(value);
  const compact = normalized.replace(/\s+/g, "");
  const withAmpersand = normalized.replace(/\band\b/g, "&");
  const noPunctuation = normalized.replace(/[^\w\s]/g, " ");
  return unique([normalized, compact, withAmpersand, noPunctuation].map(normalizeToken).filter(Boolean));
};

export const encodeMapEntityRef = (ref: MapEntityRef): string => `${ref.type}:${ref.id}`;

export const decodeMapEntityRef = (value: string | null | undefined): MapEntityRef | null => {
  if (!value) {
    return null;
  }
  const parts = value.split(":");
  if (parts.length !== 2) {
    return null;
  }
  const [type, id] = parts;
  if ((type !== "location" && type !== "outline" && type !== "route") || !id) {
    return null;
  }
  return { type, id };
};

export const mapEntityKey = (ref: MapEntityRef): string => `${ref.type}:${ref.id}`;

const getLocationTokens = (location: CampusLocation): string[] => {
  const categoryLabel = CAMPUS_CATEGORY_CONFIG[location.category].label;
  const floorLabels = (location.floorPlans ?? []).flatMap((floor) => floor.spaces.map((space) => space.label));
  return unique(
    [
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
    ]
      .map(normalizeToken)
      .filter(Boolean)
  );
};

export const buildMapEntityIndex = (
  locations: CampusLocation[],
  buildingOutlines: BuildingOutline[],
  accessibleRoutes: AccessibleRoute[]
): MapSearchEntity[] => {
  const locationEntities: MapSearchEntity[] = locations.map((location) => {
    const tokens = getLocationTokens(location);
    const aliases = unique([location.name, location.building ?? "", ...(location.roomNumbers ?? [])].flatMap(buildAliases));
    return {
      ref: { type: "location", id: location.id },
      title: location.name,
      subtitle: location.building ?? CAMPUS_CATEGORY_CONFIG[location.category].label,
      anchor: location.position,
      category: location.category,
      tokens,
      aliases
    };
  });

  const outlineEntities: MapSearchEntity[] = buildingOutlines.map((outline) => {
    const tokens = unique([outline.label, "building outline", "outline", "building"].map(normalizeToken));
    return {
      ref: { type: "outline", id: outline.id },
      title: outline.label,
      subtitle: "Building Outline",
      anchor: averagePoint(outline.path),
      tokens,
      aliases: unique([outline.label].flatMap(buildAliases))
    };
  });

  const routeEntities: MapSearchEntity[] = accessibleRoutes.map((route) => {
    const routePoints = route.path;
    const midpoint = routePoints[Math.floor(routePoints.length / 2)] ?? averagePoint(routePoints);
    const tokens = unique([route.label, "accessible route", "step free route", "route"].map(normalizeToken));
    return {
      ref: { type: "route", id: route.id },
      title: route.label,
      subtitle: "Accessible Route",
      anchor: midpoint,
      tokens,
      aliases: unique([route.label].flatMap(buildAliases))
    };
  });

  return [...locationEntities, ...outlineEntities, ...routeEntities];
};

const scoreEntity = (entity: MapSearchEntity, query: string, queryTokens: string[]): number => {
  if (!query) {
    return 0;
  }
  const title = normalizeToken(entity.title);
  const subtitle = normalizeToken(entity.subtitle);
  const allSearchable = unique([...entity.tokens, ...entity.aliases]).join(" ");
  let score = 0;

  if (title === query) {
    score += 200;
  } else if (title.startsWith(query)) {
    score += 120;
  } else if (title.includes(query)) {
    score += 80;
  }

  if (subtitle.includes(query)) {
    score += 35;
  }

  for (const token of queryTokens) {
    if (!token) {
      continue;
    }
    if (entity.aliases.some((alias) => alias.includes(token))) {
      score += 25;
    }
    if (entity.tokens.some((candidate) => candidate.includes(token))) {
      score += 18;
    }
  }

  if (allSearchable.includes(query)) {
    score += 20;
  }

  if (entity.ref.type === "location") {
    score += 5;
  }

  return score;
};

export const searchMapEntities = (
  query: string,
  entities: MapSearchEntity[],
  options?: SearchOptions
): MapSearchEntity[] => {
  const normalizedQuery = normalizeToken(query);
  const queryTokens = tokenize(normalizedQuery);
  const category = options?.category ?? "all";
  const limit = options?.limit ?? 30;

  const filteredByCategory =
    category === "all"
      ? entities
      : entities.filter((entity) => entity.ref.type === "location" && entity.category === category);

  if (!normalizedQuery) {
    return filteredByCategory.slice(0, limit);
  }

  return filteredByCategory
    .map((entity) => ({ entity, score: scoreEntity(entity, normalizedQuery, queryTokens) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }
      if (left.entity.ref.type !== right.entity.ref.type) {
        const priority: Record<MapEntityType, number> = { location: 0, outline: 1, route: 2 };
        return priority[left.entity.ref.type] - priority[right.entity.ref.type];
      }
      return left.entity.title.localeCompare(right.entity.title);
    })
    .slice(0, limit)
    .map((item) => item.entity);
};
