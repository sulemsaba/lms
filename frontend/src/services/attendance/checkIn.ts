import { CORE_CAMPUS_LOCATIONS } from "@/features/map/campusMapData";
import type { TimetableListItem } from "@/services/api/timetableApi";
import { db } from "@/services/db";
import { createIdempotencyKey, generateUuid } from "@/utils/id";

const BEACON_CHECK_IN_RADIUS_METERS = 85;
const BEACON_LOOKBACK_MS = 30 * 60 * 1000;
const BEACON_LOOKAHEAD_MS = 45 * 60 * 1000;
const CHECK_IN_DUPLICATE_WINDOW_MS = 6 * 60 * 60 * 1000;

type AttendanceMethod = "beacon" | "qr";
type CheckInSource = "auto" | "manual";

interface QueuedAttendancePayload {
  method: AttendanceMethod;
  source: CheckInSource;
  eventId?: string;
  title?: string;
  venueLabel?: string;
  distanceMeters?: number;
  latitude?: number;
  longitude?: number;
  qrValue?: string;
  checkInKey: string;
  timestamp: string;
}

interface VenueIndexEntry {
  token: string;
  position: [number, number];
}

interface BeaconTarget {
  event: TimetableListItem;
  venueLabel: string;
  position: [number, number];
}

export interface BeaconAttemptResult {
  status: "checked-in" | "already-checked-in" | "out-of-range" | "no-target";
  message: string;
  checkInId?: string;
}

export interface QrCheckInResult {
  checkInId: string;
  mode: "attendance" | "event" | "generic";
  eventId?: string;
}

const VENUE_ALIAS_COORDINATES: Record<string, [number, number]> = {
  "lecture hall 1": [-6.7712, 39.2395],
  "coict lab 3": [-6.7694, 39.2411],
  "hall 4": [-6.77098, 39.2399],
  "room 201": [-6.77098, 39.2399],
  "room 203": [-6.77098, 39.2399],
  "cs building": [-6.77098, 39.2399]
};

const normalizeToken = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, " ");

const extractVenueLabel = (event: TimetableListItem): string => {
  if (event.venueLabel && event.venueLabel.trim()) {
    return event.venueLabel.trim();
  }
  const parts = event.detail.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1].trim() : event.detail.trim();
};

const parseDateSafe = (value?: string): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isWithinActiveWindow = (event: TimetableListItem, now: Date): boolean => {
  const start = parseDateSafe(event.startsAt);
  const end = parseDateSafe(event.endsAt);
  if (!start) {
    return true;
  }

  const windowStart = new Date(start.getTime() - BEACON_LOOKBACK_MS);
  const fallbackEnd = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const windowEnd = new Date((end ?? fallbackEnd).getTime() + BEACON_LOOKAHEAD_MS);
  return now >= windowStart && now <= windowEnd;
};

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

const buildVenueIndex = async (): Promise<VenueIndexEntry[]> => {
  const entries: VenueIndexEntry[] = [];

  for (const location of CORE_CAMPUS_LOCATIONS) {
    entries.push({ token: normalizeToken(location.name), position: location.position });
    if (location.building) {
      entries.push({ token: normalizeToken(location.building), position: location.position });
    }
    if (location.roomNumbers) {
      for (const room of location.roomNumbers) {
        entries.push({ token: normalizeToken(room), position: location.position });
      }
    }
  }

  const cachedVenues = await db.venues.toArray();
  for (const venue of cachedVenues) {
    entries.push({ token: normalizeToken(venue.name), position: venue.gps });
    entries.push({ token: normalizeToken(venue.campus), position: venue.gps });
  }

  for (const [alias, position] of Object.entries(VENUE_ALIAS_COORDINATES)) {
    entries.push({ token: normalizeToken(alias), position });
  }

  return entries;
};

const resolveVenuePosition = (venueLabel: string, index: VenueIndexEntry[]): [number, number] | null => {
  const normalizedVenue = normalizeToken(venueLabel);
  const exactMatch = index.find((entry) => entry.token === normalizedVenue);
  if (exactMatch) {
    return exactMatch.position;
  }

  const fuzzyMatch = index.find(
    (entry) => normalizedVenue.includes(entry.token) || entry.token.includes(normalizedVenue)
  );
  return fuzzyMatch?.position ?? null;
};

const buildCheckInKey = (method: AttendanceMethod, eventId: string | undefined, marker: string): string =>
  `${method}:${eventId ?? "unknown"}:${marker}`;

const findExistingCheckIn = (
  checkInKey: string,
  actions: Awaited<ReturnType<typeof db.offlineActions.toArray>>,
  nowMs: number
): boolean =>
  actions.some((action) => {
    if (action.entity !== "attendance") {
      return false;
    }
    const payload = action.payload as Partial<QueuedAttendancePayload>;
    if (payload.checkInKey !== checkInKey) {
      return false;
    }
    return nowMs - action.createdAt.getTime() <= CHECK_IN_DUPLICATE_WINDOW_MS;
  });

const queueAttendanceCheckIn = async (payload: QueuedAttendancePayload): Promise<string> => {
  const id = generateUuid();
  await db.offlineActions.put({
    id,
    entity: "attendance",
    action: "check_in",
    payload,
    idempotencyKey: createIdempotencyKey("attendance-check-in"),
    createdAt: new Date(),
    retryCount: 0,
    syncStatus: "pending"
  });
  return id;
};

export async function attemptBeaconAutoCheckIn(
  events: TimetableListItem[],
  currentPosition: [number, number]
): Promise<BeaconAttemptResult> {
  if (events.length === 0) {
    return { status: "no-target", message: "No timetable events available for auto check-in." };
  }

  const now = new Date();
  const activeEvents = events.filter((event) => isWithinActiveWindow(event, now));
  const candidateEvents = activeEvents.length > 0 ? activeEvents : events;
  const venueIndex = await buildVenueIndex();

  const targets: BeaconTarget[] = candidateEvents
    .map((event) => {
      const venueLabel = extractVenueLabel(event);
      const position = resolveVenuePosition(venueLabel, venueIndex);
      if (!position) {
        return null;
      }
      return { event, venueLabel, position };
    })
    .filter((target): target is BeaconTarget => target !== null);

  if (targets.length === 0) {
    return {
      status: "no-target",
      message: "No venue coordinates available for timetable events. Open map online once to refresh venue cache."
    };
  }

  const nearest = targets.reduce(
    (closest, target) => {
      const distanceMeters = calculateDistanceMeters(currentPosition, target.position);
      if (!closest || distanceMeters < closest.distanceMeters) {
        return { target, distanceMeters };
      }
      return closest;
    },
    null as { target: BeaconTarget; distanceMeters: number } | null
  );

  if (!nearest) {
    return { status: "no-target", message: "Unable to resolve nearest class location." };
  }

  if (nearest.distanceMeters > BEACON_CHECK_IN_RADIUS_METERS) {
    return {
      status: "out-of-range",
      message: `Nearest class (${nearest.target.venueLabel}) is ${Math.round(nearest.distanceMeters)}m away. Move closer to auto check in.`
    };
  }

  const marker = nearest.target.event.startsAt
    ? nearest.target.event.startsAt
    : new Date().toISOString().slice(0, 10);
  const checkInKey = buildCheckInKey("beacon", nearest.target.event.id, marker);
  const existingActions = await db.offlineActions.toArray();
  const nowMs = now.getTime();
  if (findExistingCheckIn(checkInKey, existingActions, nowMs)) {
    return {
      status: "already-checked-in",
      message: `Already checked in for ${nearest.target.event.title ?? "this class"} recently.`
    };
  }

  const checkInId = await queueAttendanceCheckIn({
    method: "beacon",
    source: "auto",
    eventId: nearest.target.event.id,
    title: nearest.target.event.title,
    venueLabel: nearest.target.venueLabel,
    distanceMeters: Math.round(nearest.distanceMeters),
    latitude: currentPosition[0],
    longitude: currentPosition[1],
    checkInKey,
    timestamp: now.toISOString()
  });

  return {
    status: "checked-in",
    checkInId,
    message: `Checked in near ${nearest.target.venueLabel}. Attendance will sync automatically.`
  };
}

const parseQrPayload = (
  value: string
): { mode: "attendance" | "event" | "generic"; eventId?: string; normalized: string } => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { mode: "generic", normalized: "" };
  }

  const upper = trimmed.toUpperCase();
  if (upper.startsWith("ATTENDANCE:")) {
    return { mode: "attendance", eventId: trimmed.slice("ATTENDANCE:".length).trim(), normalized: trimmed };
  }
  if (upper.startsWith("EVENT:")) {
    return { mode: "event", eventId: trimmed.slice("EVENT:".length).trim(), normalized: trimmed };
  }

  try {
    const parsed = JSON.parse(trimmed) as { eventId?: string; type?: string };
    if (parsed.eventId && parsed.type === "attendance") {
      return { mode: "attendance", eventId: parsed.eventId, normalized: trimmed };
    }
    if (parsed.eventId) {
      return { mode: "event", eventId: parsed.eventId, normalized: trimmed };
    }
  } catch {
    // Ignore invalid JSON payloads and treat as plain token.
  }

  return { mode: "generic", normalized: trimmed };
};

export async function queueQrCodeCheckIn(qrValue: string): Promise<QrCheckInResult> {
  const parsed = parseQrPayload(qrValue);
  if (!parsed.normalized) {
    throw new Error("QR value is empty.");
  }

  const marker = new Date().toISOString();
  const checkInKey = buildCheckInKey("qr", parsed.eventId, marker);
  const checkInId = await queueAttendanceCheckIn({
    method: "qr",
    source: "manual",
    eventId: parsed.eventId,
    qrValue: parsed.normalized,
    checkInKey,
    timestamp: marker
  });

  return {
    checkInId,
    mode: parsed.mode,
    eventId: parsed.eventId
  };
}
