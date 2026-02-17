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
  | "accessibility"
  | "residence"
  | "landmark"
  | "facility"
  | "services"
  | "religious";

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
  accessible?: boolean;
  weightMultiplier?: number;
}

interface CategoryConfig {
  label: string;
  icon: string;
  markerColor: string;
}

type CampusLocationDraft = Omit<CampusLocation, "id">;

const at = (lat: number, lng: number): [number, number] => [lat, lng];
const APPROX = "Approximate coordinate from consolidated campus references.";
const PROPOSED = "Proposed/new location from planning references.";

export const CAMPUS_CENTER: [number, number] = [-6.780556, 39.203333];

export const CAMPUS_CATEGORY_ORDER: CampusCategory[] = [
  "academic",
  "library",
  "canteen",
  "residence",
  "lab",
  "sports",
  "wellness",
  "administration",
  "services",
  "student_union",
  "religious",
  "transport",
  "landmark",
  "facility",
  "accessibility"
];

export const CAMPUS_CATEGORY_CONFIG: Record<CampusCategory, CategoryConfig> = {
  academic: { label: "Academic and Venues", icon: "school", markerColor: "#4f46e5" },
  library: { label: "Libraries", icon: "local_library", markerColor: "#0f766e" },
  canteen: { label: "Food and Drink", icon: "restaurant", markerColor: "#ea580c" },
  lab: { label: "Labs and Studios", icon: "science", markerColor: "#9333ea" },
  administration: { label: "Administration", icon: "apartment", markerColor: "#2563eb" },
  transport: { label: "Gates and Transport", icon: "directions_bus", markerColor: "#0891b2" },
  wellness: { label: "Health Services", icon: "medical_services", markerColor: "#16a34a" },
  sports: { label: "Sports Facilities", icon: "sports_soccer", markerColor: "#15803d" },
  student_union: { label: "Student Affairs", icon: "groups", markerColor: "#be123c" },
  accessibility: { label: "Accessible Points", icon: "accessible", markerColor: "#059669" },
  residence: { label: "Hostels and Housing", icon: "home_work", markerColor: "#7c3aed" },
  landmark: { label: "Landmarks and Study Areas", icon: "location_on", markerColor: "#0f766e" },
  facility: { label: "Campus Utilities", icon: "construction", markerColor: "#b45309" },
  services: { label: "Banks and Services", icon: "storefront", markerColor: "#b91c1c" },
  religious: { label: "Religious Centers", icon: "church", markerColor: "#92400e" }
};

const MAIN_CAMPUS_ACADEMIC: CampusLocationDraft[] = [
  {
    name: "Main Campus (Overall)",
    category: "landmark",
    position: at(-6.780556, 39.203333),
    description: "Central point reference for UDSM Main Campus."
  },
  {
    name: "Administration Block (Utawala)",
    category: "administration",
    position: at(-6.7807, 39.2035),
    description: "Main tower housing the VC and DVC offices."
  },
  {
    name: "Nkrumah Hall",
    category: "academic",
    position: at(-6.7805, 39.2046),
    description: "Historic assembly hall with Nyerere statue."
  },
  {
    name: "Yombo Lecture Theatre 1",
    category: "academic",
    position: at(-6.778, 39.202),
    description: "Round lecture hall in Yombo valley."
  },
  {
    name: "Yombo Lecture Theatre 2",
    category: "academic",
    position: at(-6.7779, 39.2018),
    description: "Round lecture hall in Yombo valley."
  },
  {
    name: "Yombo Lecture Theatre 3",
    category: "academic",
    position: at(-6.7778, 39.2017),
    description: "Video conference lecture hall."
  },
  {
    name: "Yombo Lecture Theatre 4",
    category: "academic",
    position: at(-6.7776, 39.2016),
    description: "Large lecture hall complex."
  },
  {
    name: "Yombo Lecture Theatre 5",
    category: "academic",
    position: at(-6.7775, 39.2015),
    description: "Large lecture hall complex."
  },
  {
    name: "New UDSM Library",
    category: "library",
    position: at(-6.7758, 39.2052),
    description: "Large modern library building."
  },
  {
    name: "Old Library (Dr. Chagula Lib)",
    category: "library",
    position: at(-6.7798, 39.2055),
    description: "Older library near science complex."
  },
  {
    name: "CoET - Main Admin Block",
    category: "academic",
    position: at(-6.783, 39.207),
    building: "College of Engineering and Technology",
    description: "CoET Block A and administrative offices."
  },
  {
    name: "CoET - Block L (Mechanical)",
    category: "lab",
    position: at(-6.7835, 39.2062),
    description: "Mechanical engineering workshops."
  },
  {
    name: "CoET - Block O (Chemical)",
    category: "lab",
    position: at(-6.7833, 39.2064),
    description: "Chemical and mining engineering labs."
  },
  {
    name: "CoET - Block Q (Workshops)",
    category: "lab",
    position: at(-6.7831, 39.2066),
    description: "Industrial engineering workshop area."
  },
  {
    name: "CoET - Block S (Drawing)",
    category: "lab",
    position: at(-6.7829, 39.2068),
    description: "Engineering drawing rooms."
  },
  {
    name: "Textile Engineering Building",
    category: "academic",
    position: at(-6.7828, 39.2072),
    description: "New textile studio and theatre."
  },
  {
    name: "UDBS (Business School)",
    category: "academic",
    position: at(-6.7845, 39.2025),
    description: "Business School glass buildings complex."
  },
  {
    name: "UDSoL (School of Law)",
    category: "academic",
    position: at(-6.783, 39.201),
    description: "Historic round mudhut building."
  },
  {
    name: "School of Education (SoED)",
    category: "academic",
    position: at(-6.7785, 39.2005),
    description: "Building near Hall 7 and mosque."
  },
  {
    name: "CoNAS (Science Complex)",
    category: "academic",
    position: at(-6.776, 39.206),
    description: "Chemistry, physics, and botany blocks."
  },
  {
    name: "Dept of Mathematics",
    category: "academic",
    position: at(-6.7765, 39.2055),
    description: "Department near old library."
  },
  {
    name: "Dept of Geography",
    category: "academic",
    position: at(-6.7788, 39.202),
    description: "Arts tower area."
  },
  {
    name: "Dept of History",
    category: "academic",
    position: at(-6.7786, 39.2018),
    description: "Arts tower area."
  },
  {
    name: "Institute of Kiswahili (TATAKI)",
    category: "academic",
    position: at(-6.778, 39.2025),
    description: "Dedicated institute building near arts."
  },
  {
    name: "Institute of Dev. Studies (IDS)",
    category: "academic",
    position: at(-6.779, 39.2012),
    description: "Near arts and Yombo path."
  },
  {
    name: "Confucius Institute",
    category: "academic",
    position: at(-6.7762, 39.205),
    description: "Chinese cultural centre near CoNAS."
  },
  {
    name: "Archaeology and Heritage",
    category: "academic",
    position: at(-6.7785, 39.2015),
    description: "Old archaeology building."
  },
  {
    name: "Dept of Creative Arts",
    category: "academic",
    position: at(-6.7782, 39.2022),
    description: "Sanaa building for music and theatre."
  },
  {
    name: "University Computing Centre",
    category: "academic",
    position: at(-6.783, 39.2075),
    description: "UCC building near CoET."
  },
  {
    name: "Gender and Special Needs Building",
    category: "academic",
    position: at(-6.7782, 39.201),
    description: PROPOSED
  },
  {
    name: "Innovation Centre",
    category: "academic",
    position: at(-6.7869, 39.2085),
    description: "HEET-related innovation hub near CoET."
  },
  {
    name: "Botanical Gardens",
    category: "landmark",
    position: at(-6.781, 39.205),
    description: "Tranquil study area near zoology."
  },
  {
    name: "Zoology Museum",
    category: "landmark",
    position: at(-6.78, 39.2052),
    description: "Museum in science complex."
  },
  {
    name: "Heritage Building Museum",
    category: "landmark",
    position: at(-6.7805, 39.204),
    description: "Museum stop on campus heritage trail."
  }
];

const MAIN_CAMPUS_VIMBWETA: CampusLocationDraft[] = [
  {
    name: "Vimbweta vya Yombo (Forest)",
    category: "landmark",
    position: at(-6.7778, 39.2015),
    description: "Dense tree area between Yombo 2 and 4."
  },
  {
    name: "Vimbweta vya 8-4-4",
    category: "landmark",
    position: at(-6.7788, 39.2002),
    description: "Study area near education and Hall 7."
  },
  {
    name: "Vimbweta vya Revolution Sq",
    category: "landmark",
    position: at(-6.779, 39.2038),
    description: "Benches near student centre and Nkrumah."
  },
  {
    name: "Vimbweta vya Old Library",
    category: "landmark",
    position: at(-6.7795, 39.2052),
    description: "Lawns near PE building and old library."
  },
  {
    name: "Vimbweta vya New Library",
    category: "landmark",
    position: at(-6.7758, 39.205),
    description: "Gardens surrounding new library."
  },
  {
    name: "Vimbweta vya CoET (Mwembeni)",
    category: "landmark",
    position: at(-6.7835, 39.2065),
    description: "Concrete benches under mango trees."
  },
  {
    name: "Vimbweta vya UDBS (Baobab)",
    category: "landmark",
    position: at(-6.784, 39.2028),
    description: "Landscaped gardens at business school."
  },
  {
    name: "Vimbweta vya Botany (Science)",
    category: "landmark",
    position: at(-6.7755, 39.2058),
    description: "Quiet spot near botany department."
  },
  {
    name: "The Mdigrii Tree",
    category: "landmark",
    position: at(-6.7808, 39.2036),
    description: "Famous meeting tree near bookshop."
  }
];

const MAIN_CAMPUS_SERVICES: CampusLocationDraft[] = [
  {
    name: "University Health Centre (UHC)",
    category: "wellness",
    position: at(-6.782, 39.208),
    openingHours: "24 hours",
    description: "Main campus hospital."
  },
  {
    name: "UHC Eye and Optical Clinic",
    category: "wellness",
    position: at(-6.782, 39.208),
    description: "Eye and optical clinic inside UHC."
  },
  {
    name: "UHC CTC / HIV Centre",
    category: "wellness",
    position: at(-6.7822, 39.2082),
    description: "Dedicated CTC unit at UHC."
  },
  {
    name: "Dean of Students (DoSO)",
    category: "student_union",
    position: at(-6.7811, 39.2039),
    description: "Student centre for loans and permits."
  },
  {
    name: "USAB (Accommodation)",
    category: "administration",
    position: at(-6.7818, 39.206),
    description: "Accommodation offices near Hall 5."
  },
  {
    name: "Estates Department",
    category: "administration",
    position: at(-6.7825, 39.206),
    description: "Campus maintenance and estates offices."
  },
  {
    name: "DARUSO Government Office",
    category: "student_union",
    position: at(-6.7811, 39.2039),
    description: "Student government headquarters."
  },
  {
    name: "UDSM Police Station",
    category: "services",
    position: at(-6.7805, 39.203),
    description: "Campus security station near admin parking."
  },
  {
    name: "Auxiliary Police (Main Gate)",
    category: "services",
    position: at(-6.7825, 39.2025),
    description: "Security guard post at main gate."
  },
  {
    name: "CRDB Bank (UDSM Branch)",
    category: "services",
    position: at(-6.7808, 39.2034),
    description: "Campus CRDB branch."
  },
  {
    name: "NMB Bank (UDSM Branch)",
    category: "services",
    position: at(-6.7812, 39.2036),
    description: "Campus NMB branch near student centre."
  },
  {
    name: "NBC Bank / ATM",
    category: "services",
    position: at(-6.781, 39.2035),
    description: "NBC ATM near bookshop."
  },
  {
    name: "University Bookshop",
    category: "services",
    position: at(-6.781, 39.2038),
    description: "Campus bookshop at student centre."
  },
  {
    name: "UDSM Post Office",
    category: "services",
    position: at(-6.7809, 39.2032),
    description: "Campus post office near admin."
  },
  {
    name: "Silversands Hotel (UDSM)",
    category: "services",
    position: at(-6.7745, 39.2065),
    description: "Visitor lodging."
  },
  {
    name: "UDASA Club",
    category: "services",
    position: at(-6.7805, 39.2085),
    description: "Staff club and social venue."
  },
  {
    name: "Main Library Accessible Entrance",
    category: "accessibility",
    position: at(-6.7798, 39.2055),
    accessibilityNotes: ["Accessible approach path", "Low gradient route"],
    description: APPROX
  }
];

const MAIN_CAMPUS_CANTEENS: CampusLocationDraft[] = [
  {
    name: "Main Canteen (Hall 4)",
    category: "canteen",
    position: at(-6.7812, 39.2038),
    description: "Central cafeteria."
  },
  {
    name: "Cafeteria 2",
    category: "canteen",
    position: at(-6.781, 39.2058),
    description: "Cafeteria near Hall 2."
  },
  {
    name: "Yombo Cafeteria",
    category: "canteen",
    position: at(-6.7775, 39.2018),
    description: "Food point next to Yombo 4."
  },
  {
    name: "Hillpark Canteen",
    category: "canteen",
    position: at(-6.7806, 39.204),
    description: "Cafe-style canteen near admin."
  },
  {
    name: "Mama Lishe (Hall 4)",
    category: "canteen",
    position: at(-6.7815, 39.2042),
    description: "Vibanda food stalls."
  },
  {
    name: "Retrop Canteen",
    category: "canteen",
    position: at(-6.783, 39.2075),
    description: "Near CoET Block A."
  },
  {
    name: "UDBS Canteen",
    category: "canteen",
    position: at(-6.7848, 39.2022),
    description: "Inside UDBS complex."
  }
];

const MAIN_CAMPUS_RESIDENCES: CampusLocationDraft[] = [
  {
    name: "Hall 1",
    category: "residence",
    position: at(-6.781, 39.2055),
    description: "Residence near Cafeteria 2."
  },
  {
    name: "Hall 2",
    category: "residence",
    position: at(-6.7812, 39.206),
    description: "Residence near chapel."
  },
  {
    name: "Hall 3",
    category: "residence",
    position: at(-6.782, 39.2065),
    description: "Residence near CoET."
  },
  {
    name: "Hall 4",
    category: "residence",
    position: at(-6.7815, 39.2045),
    description: "Central hostel block."
  },
  {
    name: "Hall 5",
    category: "residence",
    position: at(-6.7818, 39.2062),
    description: "Residence near USAB."
  },
  {
    name: "Hall 6",
    category: "residence",
    position: at(-6.7822, 39.208),
    description: "Residence near hospital."
  },
  {
    name: "Hall 7",
    category: "residence",
    position: at(-6.7795, 39.2005),
    description: "Residence near mosque."
  },
  {
    name: "Magufuli Hostel (Block A)",
    category: "residence",
    position: at(-6.786, 39.213),
    description: "New hostel cluster (Ubungo side)."
  },
  {
    name: "Magufuli Hostel (Block B)",
    category: "residence",
    position: at(-6.7862, 39.2132),
    description: "New hostel cluster."
  },
  {
    name: "Magufuli Hostel (Block C)",
    category: "residence",
    position: at(-6.7864, 39.2134),
    description: "New hostel cluster."
  },
  {
    name: "Magufuli Hostel (Block D)",
    category: "residence",
    position: at(-6.7866, 39.2136),
    description: "New hostel cluster."
  },
  {
    name: "Magufuli Hostel (Block E)",
    category: "residence",
    position: at(-6.7868, 39.2138),
    description: "New hostel cluster."
  },
  {
    name: "Magufuli Hostel (Block F)",
    category: "residence",
    position: at(-6.787, 39.214),
    description: "New hostel cluster."
  },
  {
    name: "Magufuli Cafeteria",
    category: "canteen",
    position: at(-6.7865, 39.2135),
    description: "Cafeteria inside Magufuli hostels."
  },
  {
    name: "Dr. Magufuli Dispensary",
    category: "wellness",
    position: at(-6.7863, 39.2133),
    description: "Medical unit inside Magufuli hostels."
  }
];

const MAIN_CAMPUS_SPORTS_AND_RELIGION: CampusLocationDraft[] = [
  {
    name: "UDSM Swimming Pool",
    category: "sports",
    position: at(-6.7825, 39.203),
    description: "Main campus swimming pool."
  },
  {
    name: "Main Football Pitch",
    category: "sports",
    position: at(-6.7828, 39.2035),
    description: "Main football field."
  },
  {
    name: "Gymnasium",
    category: "sports",
    position: at(-6.7826, 39.2032),
    description: "Indoor sports hall."
  },
  {
    name: "Tennis/Basketball Courts",
    category: "sports",
    position: at(-6.7827, 39.2029),
    description: "Outdoor courts."
  },
  {
    name: "Central Mosque",
    category: "religious",
    position: at(-6.7795, 39.2005),
    description: "Near Hall 7."
  },
  {
    name: "St. Thomas (RC Church)",
    category: "religious",
    position: at(-6.7815, 39.2065),
    description: "Near Hall 2."
  },
  {
    name: "KKKT Chapel (Lutheran)",
    category: "religious",
    position: at(-6.7818, 39.206),
    description: "Near Hall 5."
  },
  {
    name: "Joint Christian Chapel",
    category: "religious",
    position: at(-6.7816, 39.2062),
    description: "Near sports pool area."
  }
];

const MAIN_CAMPUS_GATES_AND_ROADS: CampusLocationDraft[] = [
  {
    name: "Main Gate (Sam Nujoma)",
    category: "transport",
    position: at(-6.7825, 39.2025),
    description: "Primary campus entrance."
  },
  {
    name: "Changanyikeni Gate",
    category: "transport",
    position: at(-6.773, 39.2085),
    description: "Exit to Changanyikeni."
  },
  {
    name: "Survey / Mlimani City Gate",
    category: "transport",
    position: at(-6.775, 39.215),
    description: "Exit to Ardhi and Mlimani City."
  },
  {
    name: "Sewage / Ubungo Gate",
    category: "transport",
    position: at(-6.786, 39.204),
    description: "Back exit to Ubungo/Maji."
  },
  {
    name: "University Road",
    category: "transport",
    position: at(-6.781, 39.203),
    description: "Main internal spine road."
  },
  {
    name: "Yombo Road",
    category: "transport",
    position: at(-6.778, 39.201),
    description: "Road to Yombo valley."
  }
];

const COICT_KIJITONYAMA: CampusLocationDraft[] = [
  {
    name: "CoICT Main Building",
    category: "academic",
    position: at(-6.7715, 39.241),
    description: "Campus HQ with major teaching spaces."
  },
  {
    name: "CoICT Block A (Admin)",
    category: "administration",
    position: at(-6.7714, 39.2412),
    description: "Administration wing."
  },
  {
    name: "CoICT Block B (Academic)",
    category: "academic",
    position: at(-6.7716, 39.2408),
    description: "Classrooms and staff offices."
  },
  {
    name: "CoICT Lecture Theatre",
    category: "academic",
    position: at(-6.7716, 39.2409),
    description: "Main lecture hall."
  },
  {
    name: "CoICT Computer Labs",
    category: "lab",
    position: at(-6.7717, 39.2407),
    description: "Student computer labs."
  },
  {
    name: "CoICT Innovation Hub",
    category: "academic",
    position: at(-6.7715, 39.2413),
    description: "Startup and innovation space."
  },
  {
    name: "Huawei ICT Academy",
    category: "lab",
    position: at(-6.7717, 39.2409),
    description: "Specialized ICT lab."
  },
  {
    name: "CoICT Library",
    category: "library",
    position: at(-6.7713, 39.2411),
    description: "CoICT library."
  },
  {
    name: "CoICT Canteen",
    category: "canteen",
    position: at(-6.771, 39.2415),
    description: "Dedicated food court."
  },
  {
    name: "CoICT Hostel",
    category: "residence",
    position: at(-6.7705, 39.242),
    description: "On-campus hostel."
  },
  {
    name: "Sayansi Bus Station",
    category: "transport",
    position: at(-6.772, 39.24),
    description: "Primary landmark for CoICT transit."
  }
];

const SJMC_MIKOCHENI: CampusLocationDraft[] = [
  {
    name: "SJMC Main Building",
    category: "academic",
    position: at(-6.7685, 39.2485),
    description: "Campus HQ on New City Road, Mikocheni B."
  },
  {
    name: "SJMC Radio/TV Studio",
    category: "lab",
    position: at(-6.7686, 39.2486),
    description: "Broadcast studios."
  },
  {
    name: "SJMC Library",
    category: "library",
    position: at(-6.7685, 39.2485),
    description: "Library inside main building."
  },
  {
    name: "SJMC Canteen",
    category: "canteen",
    position: at(-6.7684, 39.2487),
    description: "SJMC student canteen."
  }
];

const MABIBO_HOSTELS: CampusLocationDraft[] = [
  {
    name: "Mabibo Hostel Block A",
    category: "residence",
    position: at(-6.8038, 39.218),
    description: "Off-campus hostel."
  },
  {
    name: "Mabibo Hostel Block B",
    category: "residence",
    position: at(-6.804, 39.2182),
    description: "Off-campus hostel."
  },
  {
    name: "Mabibo Hostel Block C",
    category: "residence",
    position: at(-6.8042, 39.2184),
    description: "Off-campus hostel."
  },
  {
    name: "Mabibo Hostel Block D",
    category: "residence",
    position: at(-6.8044, 39.2186),
    description: "Off-campus hostel."
  },
  {
    name: "Mabibo Hostel Block E",
    category: "residence",
    position: at(-6.8046, 39.2188),
    description: "Off-campus hostel."
  },
  {
    name: "Mabibo Hostel Block F",
    category: "residence",
    position: at(-6.8048, 39.219),
    description: "Off-campus hostel."
  },
  {
    name: "Mabibo Cafeteria",
    category: "canteen",
    position: at(-6.8042, 39.2195),
    description: "Central dining hall."
  },
  {
    name: "Mabibo Dispensary",
    category: "wellness",
    position: at(-6.8035, 39.2185),
    description: "Medical unit."
  }
];

const KUNDUCHI_CAMPUS: CampusLocationDraft[] = [
  {
    name: "SoAF (Aquatic Sciences)",
    category: "academic",
    position: at(-6.671, 39.216),
    description: "School of aquatic sciences in Kunduchi."
  },
  {
    name: "Wetland Centre",
    category: "lab",
    position: at(-6.6715, 39.2165),
    description: "Marine biology and wetland research centre."
  }
];

const CLASS_AND_EXAM_VENUES: CampusLocationDraft[] = [
  {
    name: "Theater1",
    category: "academic",
    position: at(-6.7808, 39.204),
    description: "Common large venue for classes and exams.",
    roomNumbers: ["Theater1"]
  },
  {
    name: "Theater2",
    category: "academic",
    position: at(-6.7809, 39.2042),
    description: "Large central theatre for classes and exams.",
    roomNumbers: ["Theater2"]
  },
  {
    name: "COAF LR1 to LR10",
    category: "academic",
    position: at(-6.778, 39.204),
    description: "CoAF lecture rooms for teaching and exams.",
    roomNumbers: ["COAF LR1", "COAF LR2", "COAF LR3", "COAF LR4", "COAF LR5", "COAF LR6", "COAF LR7", "COAF LR8", "COAF LR9", "COAF LR10"]
  },
  {
    name: "HEALTH LR 1 / HEALTH LR 2",
    category: "academic",
    position: at(-6.782, 39.208),
    description: "Health lecture rooms near UHC.",
    roomNumbers: ["HEALTH LR1", "HEALTH LR2"]
  },
  {
    name: "HEALTH LAB 1 / HEALTH LAB 2",
    category: "lab",
    position: at(-6.782, 39.208),
    description: "Health practical labs near UHC.",
    roomNumbers: ["HEALTH LAB1", "HEALTH LAB2"]
  },
  {
    name: "SR1 to SR16 (Seminar Rooms)",
    category: "academic",
    position: at(-6.7798, 39.2037),
    description: "Seminar rooms cluster used for tutorials and exams.",
    roomNumbers: ["SR1", "SR2", "SR3", "SR4", "SR5", "SR6", "SR7", "SR8", "SR9", "SR10", "SR11", "SR12", "SR13", "SR14", "SR15", "SR16"]
  },
  {
    name: "A-series Rooms (A4, A9, A21, A106, A108, A206, A214, A218)",
    category: "academic",
    position: at(-6.7785, 39.2015),
    description: "Arts tower room series used for lectures and exams."
  },
  {
    name: "ALRA/ALRB/ALRC/ALRD (Arts Lecture Rooms A-D)",
    category: "academic",
    position: at(-6.778, 39.201),
    description: "Arts lecture room block."
  },
  {
    name: "ATA/ATB",
    category: "academic",
    position: at(-6.7782, 39.2012),
    description: "Arts tutorial/lecture rooms."
  },
  {
    name: "PB 06 / PB 08 / PB 09",
    category: "academic",
    position: at(-6.7795, 39.2025),
    description: "PB room cluster for classes and exams."
  },
  {
    name: "SC109 / SC314 / SC315 / SC316",
    category: "lab",
    position: at(-6.776, 39.206),
    description: "Science complex rooms for lectures and practicals."
  },
  {
    name: "UDBS1/C033, UDBS2/C124, UDBS3/C520",
    category: "academic",
    position: at(-6.7845, 39.2025),
    description: "Business school room cluster for classes and exams."
  },
  {
    name: "Library Conference Room / Library 2nd Floor / New Library Study Room",
    category: "library",
    position: at(-6.7758, 39.2052),
    description: "Library-based overflow teaching and exam spaces."
  },
  {
    name: "CASSA / CASSB / CASSC",
    category: "academic",
    position: at(-6.779, 39.204),
    description: "CoSS room cluster for social sciences."
  }
];

const buildLocationId = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const withGeneratedIds = (items: CampusLocationDraft[]): CampusLocation[] => {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const base = buildLocationId(item.name);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return {
      id: count === 0 ? base : `${base}-${count + 1}`,
      ...item
    };
  });
};

export const CORE_CAMPUS_LOCATIONS: CampusLocation[] = withGeneratedIds([
  ...MAIN_CAMPUS_ACADEMIC,
  ...MAIN_CAMPUS_VIMBWETA,
  ...MAIN_CAMPUS_SERVICES,
  ...MAIN_CAMPUS_CANTEENS,
  ...MAIN_CAMPUS_RESIDENCES,
  ...MAIN_CAMPUS_SPORTS_AND_RELIGION,
  ...MAIN_CAMPUS_GATES_AND_ROADS,
  ...COICT_KIJITONYAMA,
  ...SJMC_MIKOCHENI,
  ...MABIBO_HOSTELS,
  ...KUNDUCHI_CAMPUS,
  ...CLASS_AND_EXAM_VENUES
]);

export const CAMPUS_BUILDING_OUTLINES: BuildingOutline[] = [
  {
    id: "outline-nkrumah",
    label: "Nkrumah Hall",
    path: [at(-6.78062, 39.20448), at(-6.7804, 39.20448), at(-6.7804, 39.20472), at(-6.78062, 39.20472)]
  },
  {
    id: "outline-old-library",
    label: "Old Library",
    path: [at(-6.77992, 39.20535), at(-6.77968, 39.20535), at(-6.77968, 39.20567), at(-6.77992, 39.20567)]
  },
  {
    id: "outline-new-library",
    label: "New UDSM Library",
    path: [at(-6.77595, 39.20502), at(-6.77568, 39.20502), at(-6.77568, 39.20536), at(-6.77595, 39.20536)]
  },
  {
    id: "outline-coet",
    label: "CoET Core",
    path: [at(-6.78345, 39.20618), at(-6.78278, 39.20618), at(-6.78278, 39.20705), at(-6.78345, 39.20705)]
  },
  {
    id: "outline-udbs",
    label: "UDBS",
    path: [at(-6.7847, 39.2023), at(-6.78428, 39.2023), at(-6.78428, 39.20272), at(-6.7847, 39.20272)]
  },
  {
    id: "outline-uhc",
    label: "University Health Centre",
    path: [at(-6.78215, 39.20786), at(-6.78186, 39.20786), at(-6.78186, 39.2082), at(-6.78215, 39.2082)]
  }
];

export const CAMPUS_ACCESSIBLE_ROUTES: AccessibleRoute[] = [
  {
    id: "route-main-gate-nkrumah",
    label: "Step-free route: Main Gate to Nkrumah Hall",
    path: [at(-6.7825, 39.2025), at(-6.7818, 39.2032), at(-6.7811, 39.204), at(-6.7805, 39.2046)],
    accessible: true,
    weightMultiplier: 1
  },
  {
    id: "route-nkrumah-old-library",
    label: "Step-free route: Nkrumah Hall to Old Library",
    path: [at(-6.7805, 39.2046), at(-6.7802, 39.205), at(-6.77995, 39.2053), at(-6.7798, 39.2055)],
    accessible: true,
    weightMultiplier: 1
  },
  {
    id: "route-nkrumah-new-library",
    label: "Step-free route: Nkrumah Hall to New Library",
    path: [at(-6.7805, 39.2046), at(-6.7798, 39.2049), at(-6.7787, 39.2051), at(-6.7772, 39.2052), at(-6.7758, 39.2052)],
    accessible: true,
    weightMultiplier: 1
  },
  {
    id: "route-nkrumah-coet",
    label: "Step-free route: Nkrumah Hall to CoET",
    path: [at(-6.7805, 39.2046), at(-6.7812, 39.2055), at(-6.782, 39.2062), at(-6.783, 39.207)],
    accessible: true,
    weightMultiplier: 1
  },
  {
    id: "route-coet-uhc",
    label: "Step-free route: CoET to University Health Centre",
    path: [at(-6.783, 39.207), at(-6.7828, 39.2074), at(-6.7825, 39.2078), at(-6.782, 39.208)],
    accessible: true,
    weightMultiplier: 1
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
