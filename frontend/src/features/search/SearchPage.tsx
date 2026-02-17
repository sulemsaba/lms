import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import {
  CAMPUS_ACCESSIBLE_ROUTES,
  CAMPUS_BUILDING_OUTLINES,
  enrichWithNetworkVenues
} from "@/features/map/campusMapData";
import { buildMapEntityIndex, encodeMapEntityRef, mapEntityKey, searchMapEntities } from "@/features/map/mapSearch";
import { db } from "@/services/db";
import styles from "./SearchPage.module.css";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  path: string;
}

interface SearchResultGroups {
  modules: SearchResultItem[];
  courses: SearchResultItem[];
  timetable: SearchResultItem[];
  tasks: SearchResultItem[];
  notes: SearchResultItem[];
  notifications: SearchResultItem[];
  mapAreas: SearchResultItem[];
}

interface ModuleIndexEntry extends SearchResultItem {
  keywords: string;
}

const moduleIndex: ModuleIndexEntry[] = [
  {
    id: "module-home",
    title: "Home",
    subtitle: "Dashboard and activity snapshot",
    path: "/",
    keywords: "dashboard summary overview"
  },
  {
    id: "module-courses",
    title: "Courses",
    subtitle: "Course list, instructors, and status",
    path: "/courses",
    keywords: "classes curriculum lecturer"
  },
  {
    id: "module-assessments",
    title: "Assessments",
    subtitle: "Quizzes, assignments, and submissions",
    path: "/assessments",
    keywords: "tests exams assignments"
  },
  {
    id: "module-timetable",
    title: "Timetable",
    subtitle: "Calendar and teaching schedule",
    path: "/timetable",
    keywords: "calendar schedule events"
  },
  {
    id: "module-helpdesk",
    title: "Helpdesk",
    subtitle: "Support tickets and service requests",
    path: "/helpdesk",
    keywords: "support ticket issue"
  },
  {
    id: "module-tasks",
    title: "Tasks",
    subtitle: "Personal action list and deadlines",
    path: "/tasks",
    keywords: "todo plan deadline"
  },
  {
    id: "module-notes",
    title: "Study Notes",
    subtitle: "Offline notes and revision material",
    path: "/notes",
    keywords: "notes summary revision"
  },
  {
    id: "module-notifications",
    title: "Notifications",
    subtitle: "Alerts and announcements",
    path: "/notifications",
    keywords: "alerts updates messages"
  },
  {
    id: "module-queue",
    title: "Queue Manager",
    subtitle: "Offline sync queue operations",
    path: "/queue-manager",
    keywords: "sync queue retry failed"
  },
  {
    id: "module-map",
    title: "Campus Map",
    subtitle: "Venues, campuses, and routes",
    path: "/map",
    keywords: "map navigation venues routes"
  },
  {
    id: "module-profile",
    title: "Profile",
    subtitle: "Session and user settings",
    path: "/profile",
    keywords: "account settings role"
  }
];

const emptyGroups: SearchResultGroups = {
  modules: [],
  courses: [],
  timetable: [],
  tasks: [],
  notes: [],
  notifications: [],
  mapAreas: []
};

const SEARCH_DEBOUNCE_MS = 200;

function includesQuery(values: string[], query: string): boolean {
  const haystack = values.join(" ").toLowerCase();
  return haystack.includes(query);
}

function limit<T>(items: T[], maxItems = 8): T[] {
  return items.slice(0, maxItems);
}

const mapEntityTypeLabel = (type: string): string => {
  if (type === "location") {
    return "Location";
  }
  if (type === "outline") {
    return "Building Outline";
  }
  return "Accessible Route";
};

/**
 * Unified local-first search across core LMS modules.
 */
export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [groups, setGroups] = useState<SearchResultGroups>(emptyGroups);
  const normalizedQuery = debouncedQuery.trim().toLowerCase();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    let mounted = true;

    const runSearch = async () => {
      if (!normalizedQuery) {
        const quickModules = limit(moduleIndex, 6).map(({ keywords: _keywords, ...item }) => item);
        if (mounted) {
          setGroups({
            ...emptyGroups,
            modules: quickModules
          });
        }
        return;
      }

      const [courses, timetableEvents, tasks, notes, notifications, venues] = await Promise.all([
        db.courses.toArray(),
        db.timetableEvents.toArray(),
        db.tasks.toArray(),
        db.notes.toArray(),
        db.notifications.toArray(),
        db.venues.toArray()
      ]);

      const mapEntities = buildMapEntityIndex(
        enrichWithNetworkVenues(venues),
        CAMPUS_BUILDING_OUTLINES,
        CAMPUS_ACCESSIBLE_ROUTES
      );

      const mapAreaResults = searchMapEntities(normalizedQuery, mapEntities, { category: "all", limit: 10 }).map(
        (entity) => {
          const nextParams = new URLSearchParams();
          nextParams.set("q", normalizedQuery);
          nextParams.set("focus", encodeMapEntityRef(entity.ref));
          return {
            id: `map-area-${mapEntityKey(entity.ref)}`,
            title: entity.title,
            subtitle: `${mapEntityTypeLabel(entity.ref.type)} • ${entity.subtitle}`,
            path: `/map?${nextParams.toString()}`
          };
        }
      );

      const nextGroups: SearchResultGroups = {
        modules: limit(
          moduleIndex
            .filter((item) => includesQuery([item.title, item.subtitle, item.keywords], normalizedQuery))
            .map(({ keywords: _keywords, ...item }) => item)
        ),
        courses: limit(
          courses
            .filter((item) => includesQuery([item.code, item.title, item.lecturer, item.status], normalizedQuery))
            .map((item) => ({
              id: `course-${item.id}`,
              title: `${item.code} - ${item.title}`,
              subtitle: `Lecturer: ${item.lecturer}`,
              path: "/courses"
            }))
        ),
        timetable: limit(
          timetableEvents
            .filter((item) => includesQuery([item.title, item.courseLabel, item.venueLabel, item.eventType], normalizedQuery))
            .map((item) => ({
              id: `event-${item.id}`,
              title: item.title,
              subtitle: `${item.courseLabel} - ${item.venueLabel}`,
              path: "/timetable"
            }))
        ),
        tasks: limit(
          tasks
            .filter((item) => includesQuery([item.title, item.notes, item.dueDate ?? ""], normalizedQuery))
            .map((item) => ({
              id: `task-${item.id}`,
              title: item.title,
              subtitle: item.dueDate ? `Due ${item.dueDate}` : "No deadline",
              path: "/tasks"
            }))
        ),
        notes: limit(
          notes
            .filter((item) => includesQuery([item.title, item.content, item.courseLabel], normalizedQuery))
            .map((item) => ({
              id: `note-${item.id}`,
              title: item.title,
              subtitle: item.courseLabel ? `Course: ${item.courseLabel}` : "General note",
              path: "/notes"
            }))
        ),
        notifications: limit(
          notifications
            .filter((item) => includesQuery([item.title, item.message], normalizedQuery))
            .map((item) => ({
              id: `notification-${item.id}`,
              title: item.title,
              subtitle: item.message,
              path: "/notifications"
            }))
        ),
        mapAreas: mapAreaResults
      };

      if (mounted) {
        setGroups(nextGroups);
      }
    };

    void runSearch();

    return () => {
      mounted = false;
    };
  }, [normalizedQuery]);

  const totalMatches = useMemo(
    () =>
      groups.modules.length +
      groups.courses.length +
      groups.timetable.length +
      groups.tasks.length +
      groups.notes.length +
      groups.notifications.length +
      groups.mapAreas.length,
    [groups]
  );

  return (
    <section className={styles.stack}>
      <Card>
        <h2>Global Search</h2>
        <p>Search across modules and offline data from one place.</p>
        <div className={styles.searchRow}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search modules, courses, map areas, tasks, notes..."
            aria-label="Global search"
          />
          <Badge color="accent" text={`${totalMatches} match${totalMatches === 1 ? "" : "es"}`} />
        </div>
      </Card>

      <SearchSection title="Modules" items={groups.modules} emptyLabel={normalizedQuery ? "No module matches." : "Quick links"} />
      <SearchSection title="Courses" items={groups.courses} emptyLabel="No course matches." />
      <SearchSection title="Timetable Events" items={groups.timetable} emptyLabel="No timetable matches." />
      <SearchSection title="Tasks" items={groups.tasks} emptyLabel="No task matches." />
      <SearchSection title="Study Notes" items={groups.notes} emptyLabel="No note matches." />
      <SearchSection title="Notifications" items={groups.notifications} emptyLabel="No notification matches." />
      <SearchSection title="Map Areas" items={groups.mapAreas} emptyLabel="No map area matches." />
    </section>
  );
}

interface SearchSectionProps {
  title: string;
  items: SearchResultItem[];
  emptyLabel: string;
}

function SearchSection({ title, items, emptyLabel }: SearchSectionProps) {
  return (
    <Card>
      <div className={styles.sectionHeader}>
        <h3>{title}</h3>
        <Badge color="success" text={`${items.length}`} />
      </div>
      {items.length === 0 ? (
        <p className={styles.empty}>{emptyLabel}</p>
      ) : (
        <div className={styles.resultList}>
          {items.map((item) => (
            <Link key={item.id} to={item.path} className={styles.resultItem}>
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
