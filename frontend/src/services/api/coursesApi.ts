import { apiClient } from "@/services/api/client";
import { db, type CachedCourse } from "@/services/db";

export interface CourseListItem {
  id: string;
  title: string;
  lecturer: string;
  cached: boolean;
}

export interface CourseFetchResult {
  courses: CourseListItem[];
  source: "network" | "cache" | "fallback";
}

interface ApiCourse {
  id: string;
  code: string;
  title: string;
  status?: string;
}

const fallbackCourses: CourseListItem[] = [
  { id: "fallback-c1", title: "Data Structures", lecturer: "Dr. Mushi", cached: true },
  { id: "fallback-c2", title: "Machine Learning", lecturer: "Prof. Amani", cached: true },
  { id: "fallback-c3", title: "Database Systems", lecturer: "Dr. Zawadi", cached: true }
];

function toListItem(course: CachedCourse, cached: boolean): CourseListItem {
  return {
    id: course.id,
    title: course.title,
    lecturer: course.lecturer,
    cached
  };
}

function toCachedCourse(course: ApiCourse): CachedCourse {
  return {
    id: course.id,
    code: course.code,
    title: course.title,
    lecturer: "Assigned Lecturer",
    status: course.status ?? "active",
    updatedAt: new Date().toISOString()
  };
}

/**
 * Loads courses with network-first strategy and durable local cache fallback.
 */
export async function fetchCourses(): Promise<CourseFetchResult> {
  try {
    const response = await apiClient.get<ApiCourse[] | { courses?: ApiCourse[] }>("/courses");
    const rows = Array.isArray(response.data) ? response.data : response.data.courses ?? [];
    const cachedCourses = rows.map(toCachedCourse);
    if (cachedCourses.length > 0) {
      await db.courses.bulkPut(cachedCourses);
    }
    return {
      courses: cachedCourses.map((item) => toListItem(item, false)),
      source: "network"
    };
  } catch {
    const cachedCourses = await db.courses.toArray();
    if (cachedCourses.length > 0) {
      return {
        courses: cachedCourses.map((item) => toListItem(item, true)),
        source: "cache"
      };
    }
    return {
      courses: fallbackCourses,
      source: "fallback"
    };
  }
}
