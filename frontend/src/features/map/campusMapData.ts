import type { CachedVenue } from "@/services/db";

export type CampusCategory =
  | "academic"
  | "library"
  | "canteen"
  | "lab"
  | "administration"
  | "transport"
  | "wellness"
  | "sports"
  | "student_union"
  | "accessibility";

export type FloorSpaceKind =
  | "classroom"
  | "lab"
  | "restroom"
  | "elevator"
  | "quiet_zone"
  | "study_room"
  | "office"
  | "entrance";

export interface FloorPlanSpace {
  id: string;
  label: string;
  kind: FloorSpaceKind;
}

export interface FloorPlanLevel {
  id: string;
  label: string;
  spaces: FloorPlanSpace[];
}

export interface CampusLocation {
  id: string;
  name: string;
  category: CampusCategory;
  position: [number, number];
  building?: string;
  description?: string;
  roomNumbers?: string[];
  facilities?: string[];
  openingHours?: string;
  menuPreview?: string[];
  floorPlans?: FloorPlanLevel[];
  accessibilityNotes?: string[];
}

export interface BuildingOutline {
  id: string;
  label: string;
  path: [number, number][];
}

export interface AccessibleRoute {
  id: string;
  label: string;
  path: [number, number][];
}

interface CategoryConfig {
  label: string;
  icon: string;
  markerColor: string;
}

export const CAMPUS_CENTER: [number, number] = [-6.7708, 39.2401];

export const CAMPUS_CATEGORY_ORDER: CampusCategory[] = [
  "academic",
  "library",
  "canteen",
  "lab",
  "administration",
  "transport",
  "wellness",
  "sports",
  "student_union",
  "accessibility"
];

export const CAMPUS_CATEGORY_CONFIG: Record<CampusCategory, CategoryConfig> = {
  academic: { label: "Academic Buildings", icon: "school", markerColor: "#4f46e5" },
  library: { label: "Library", icon: "local_library", markerColor: "#0f766e" },
  canteen: { label: "Food and Drink", icon: "restaurant", markerColor: "#ea580c" },
  lab: { label: "Labs", icon: "science", markerColor: "#9333ea" },
  administration: { label: "Administration", icon: "apartment", markerColor: "#2563eb" },
  transport: { label: "Transport", icon: "directions_bus", markerColor: "#0891b2" },
  wellness: { label: "Health and Wellness", icon: "medical_services", markerColor: "#16a34a" },
  sports: { label: "Sports Facilities", icon: "sports_soccer", markerColor: "#15803d" },
  student_union: { label: "Student Union", icon: "groups", markerColor: "#be123c" },
  accessibility: { label: "Accessible Entrances", icon: "accessible", markerColor: "#059669" }
};

export const CORE_CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: "academic-cs-building",
    name: "CS Building",
    category: "academic",
    position: [-6.77098, 39.2399],
    building: "COICT Block A",
    description: "Computer Science lecture halls and project studios.",
    roomNumbers: ["Room 201", "Room 203", "Lab A2"],
    facilities: ["classrooms", "project studio", "student help desk"],
    floorPlans: [
      {
        id: "cs-ground",
        label: "Ground Floor",
        spaces: [
          { id: "cs-a101", label: "A101 Intro Programming", kind: "classroom" },
          { id: "cs-lab-g1", label: "Programming Lab G1", kind: "lab" },
          { id: "cs-rest-g", label: "Restrooms", kind: "restroom" },
          { id: "cs-elev-g", label: "Lift Lobby", kind: "elevator" }
        ]
      },
      {
        id: "cs-first",
        label: "First Floor",
        spaces: [
          { id: "cs-201", label: "Room 201 Data Structures", kind: "classroom" },
          { id: "cs-203", label: "Room 203 Algorithms", kind: "classroom" },
          { id: "cs-lab-f1", label: "Systems Lab", kind: "lab" },
          { id: "cs-rest-f1", label: "Restrooms", kind: "restroom" },
          { id: "cs-elev-f1", label: "Lift Lobby", kind: "elevator" }
        ]
      }
    ]
  },
  {
    id: "library-main",
    name: "Main Library",
    category: "library",
    position: [-6.77025, 39.24085],
    description: "Central library with quiet reading zones and group study rooms.",
    roomNumbers: ["Reference Wing", "Digital Library", "Group Study 2.1"],
    facilities: ["quiet zone", "group study", "printing", "digital catalog"],
    openingHours: "Mon-Sat: 07:30 - 22:00",
    floorPlans: [
      {
        id: "lib-l1",
        label: "Level 1",
        spaces: [
          { id: "lib-entry-1", label: "Main Entrance", kind: "entrance" },
          { id: "lib-quiet-1", label: "Quiet Reading Zone", kind: "quiet_zone" },
          { id: "lib-group-1", label: "Group Room 1A", kind: "study_room" },
          { id: "lib-rest-1", label: "Restrooms", kind: "restroom" },
          { id: "lib-elev-1", label: "Elevator Core", kind: "elevator" }
        ]
      },
      {
        id: "lib-l2",
        label: "Level 2",
        spaces: [
          { id: "lib-group-2", label: "Group Rooms 2A-2D", kind: "study_room" },
          { id: "lib-quiet-2", label: "Silent Research Zone", kind: "quiet_zone" },
          { id: "lib-office-2", label: "Librarian Office", kind: "office" },
          { id: "lib-rest-2", label: "Restrooms", kind: "restroom" },
          { id: "lib-elev-2", label: "Elevator Core", kind: "elevator" }
        ]
      }
    ]
  },
  {
    id: "canteen-central",
    name: "Mlimani Canteen",
    category: "canteen",
    position: [-6.77168, 39.24014],
    description: "Main student cafeteria.",
    openingHours: "Daily: 06:30 - 21:00",
    menuPreview: ["Pilau + Beans", "Grilled Chicken Wrap", "Vegetable Curry", "Fresh Juice"],
    facilities: ["halal meals", "vegetarian options", "takeaway"]
  },
  {
    id: "lab-innovation",
    name: "Innovation Lab",
    category: "lab",
    position: [-6.76992, 39.24142],
    building: "Engineering Annex",
    description: "Electronics and prototyping lab with computer clusters.",
    roomNumbers: ["Lab E-12", "Cluster C-7"],
    facilities: ["3D printing", "iot kits", "computer cluster"],
    floorPlans: [
      {
        id: "lab-main",
        label: "Main Floor",
        spaces: [
          { id: "lab-proto", label: "Prototyping Bay", kind: "lab" },
          { id: "lab-cluster", label: "Computer Cluster", kind: "lab" },
          { id: "lab-rest", label: "Restrooms", kind: "restroom" },
          { id: "lab-elev", label: "Lift Access", kind: "elevator" }
        ]
      }
    ]
  },
  {
    id: "admin-registrar",
    name: "Registrar and Finance Office",
    category: "administration",
    position: [-6.77138, 39.2389],
    building: "Administration Block",
    description: "Registrar, financial aid, and academic advising services.",
    roomNumbers: ["Counter 1", "Counter 2", "Advising Room A"],
    openingHours: "Mon-Fri: 08:00 - 16:30",
    facilities: ["registrar", "financial aid", "advising"]
  },
  {
    id: "transport-north-gate",
    name: "North Gate Transit Hub",
    category: "transport",
    position: [-6.76892, 39.23963],
    description: "Primary bus stop with bike racks and parking lot access.",
    facilities: ["bus stop", "bike racks", "parking lot"]
  },
  {
    id: "wellness-clinic",
    name: "Student Clinic and Counseling",
    category: "wellness",
    position: [-6.77201, 39.23922],
    description: "On-campus clinic and counseling support center.",
    openingHours: "Mon-Fri: 08:00 - 20:00",
    facilities: ["clinic", "counseling", "pharmacy desk"]
  },
  {
    id: "sports-complex",
    name: "Sports Complex",
    category: "sports",
    position: [-6.77258, 39.24098],
    description: "Gym, football field, indoor court, and athletics support.",
    openingHours: "Daily: 06:00 - 22:00",
    facilities: ["gym", "football field", "basketball court"]
  },
  {
    id: "union-center",
    name: "Student Union Center",
    category: "student_union",
    position: [-6.77104, 39.24158],
    description: "Student clubs, lounges, shops, and event rooms.",
    facilities: ["clubs", "lounge", "shops", "event hall"],
    floorPlans: [
      {
        id: "union-l1",
        label: "Level 1",
        spaces: [
          { id: "union-entrance", label: "Main Entrance", kind: "entrance" },
          { id: "union-club", label: "Club Office Wing", kind: "office" },
          { id: "union-rest", label: "Restrooms", kind: "restroom" },
          { id: "union-elev", label: "Elevator", kind: "elevator" }
        ]
      },
      {
        id: "union-l2",
        label: "Level 2",
        spaces: [
          { id: "union-lounge", label: "Collaboration Lounge", kind: "study_room" },
          { id: "union-media", label: "Media Lab", kind: "lab" },
          { id: "union-rest-2", label: "Restrooms", kind: "restroom" }
        ]
      }
    ]
  },
  {
    id: "access-library-ramp",
    name: "Library Accessible Entrance",
    category: "accessibility",
    position: [-6.77034, 39.24094],
    description: "Wheelchair-accessible entrance with ramp and lift access.",
    accessibilityNotes: ["Ramp gradient 1:12", "Automatic doors", "Direct elevator access"],
    facilities: ["accessible entrance", "wheelchair route"]
  }
];

export const CAMPUS_BUILDING_OUTLINES: BuildingOutline[] = [
  {
    id: "outline-cs",
    label: "CS Building",
    path: [
      [-6.77108, 39.2398],
      [-6.7709, 39.2398],
      [-6.7709, 39.24002],
      [-6.77108, 39.24002]
    ]
  },
  {
    id: "outline-library",
    label: "Main Library",
    path: [
      [-6.77036, 39.24072],
      [-6.77014, 39.24072],
      [-6.77014, 39.24098],
      [-6.77036, 39.24098]
    ]
  },
  {
    id: "outline-union",
    label: "Student Union Center",
    path: [
      [-6.77116, 39.24144],
      [-6.7709, 39.24144],
      [-6.7709, 39.2417],
      [-6.77116, 39.2417]
    ]
  }
];

export const CAMPUS_ACCESSIBLE_ROUTES: AccessibleRoute[] = [
  {
    id: "route-gate-library",
    label: "Step-free route: North Gate to Library Entrance",
    path: [
      [-6.76892, 39.23963],
      [-6.76955, 39.2399],
      [-6.77005, 39.2403],
      [-6.77034, 39.24094]
    ]
  },
  {
    id: "route-library-union",
    label: "Step-free route: Library to Student Union",
    path: [
      [-6.77034, 39.24094],
      [-6.77058, 39.2412],
      [-6.77084, 39.24142],
      [-6.77104, 39.24158]
    ]
  }
];

export const enrichWithNetworkVenues = (venues: CachedVenue[]): CampusLocation[] => {
  const existingNames = new Set(CORE_CAMPUS_LOCATIONS.map((location) => location.name.toLowerCase()));
  const networkLocations: CampusLocation[] = venues
    .filter((venue) => !existingNames.has(venue.name.toLowerCase()))
    .map((venue) => ({
      id: `network-${venue.id}`,
      name: venue.name,
      category: "academic",
      position: venue.gps,
      building: venue.campus,
      description: "Synced from server venue directory.",
      facilities: ["classrooms"]
    }));

  return [...CORE_CAMPUS_LOCATIONS, ...networkLocations];
};

