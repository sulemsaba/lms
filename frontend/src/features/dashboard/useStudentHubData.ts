import { useCallback, useEffect, useState } from "react";
import { fetchCourses, type CourseListItem } from "@/services/api/coursesApi";
import { fetchTimetableEvents, type TimetableListItem } from "@/services/api/timetableApi";
import { fetchSuccessDashboard, type SuccessDashboard } from "@/services/api/studentSuccessApi";
import { db, type LocalTask } from "@/services/db";

export interface NextClassInfo {
  title: string;
  venueLabel: string;
  minutesUntil: number;
}

export interface StudentHubData {
  courses: CourseListItem[];
  coursesSource: "network" | "cache" | "fallback";
  todayEvents: TimetableListItem[];
  timetableSource: "network" | "cache" | "fallback";
  nextClass: NextClassInfo | null;
  streakDays: number | null;
  badgesCount: number | null;
  skillsCount: number | null;
  successAvailable: boolean;
  openTasks: LocalTask[];
}

function isToday(iso: string | undefined): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function computeNextClass(events: TimetableListItem[]): NextClassInfo | null {
  const now = Date.now();
  const upcoming = events
    .filter((event) => event.startsAt && new Date(event.startsAt).getTime() > now)
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime());
  const next = upcoming[0];
  if (!next?.startsAt) return null;
  return {
    title: next.title ?? next.detail,
    venueLabel: next.venueLabel ?? "TBA",
    minutesUntil: Math.round((new Date(next.startsAt).getTime() - now) / 60000)
  };
}

function maxStreak(dashboard: SuccessDashboard | null): number | null {
  if (!dashboard) return null;
  const counts = dashboard.streaks.map((streak) => streak.current_count ?? 0);
  return counts.length > 0 ? Math.max(...counts) : 0;
}

async function fetchOpenTasks(): Promise<LocalTask[]> {
  const rows = await db.tasks.toArray();
  return rows
    .filter((task) => !task.completed)
    .sort((left, right) => {
      if (left.dueDate && right.dueDate) return left.dueDate.localeCompare(right.dueDate);
      if (left.dueDate) return -1;
      if (right.dueDate) return 1;
      return right.updatedAt.localeCompare(left.updatedAt);
    });
}

export function useStudentHubData() {
  const [data, setData] = useState<StudentHubData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (isCancelled?: () => boolean) => {
    const [coursesResult, timetableResult, successResult, openTasks] = await Promise.all([
      fetchCourses(),
      fetchTimetableEvents(),
      fetchSuccessDashboard(),
      fetchOpenTasks()
    ]);
    if (isCancelled?.()) return;
    setData({
      courses: coursesResult.courses,
      coursesSource: coursesResult.source,
      todayEvents: timetableResult.events.filter((event) => isToday(event.startsAt)),
      timetableSource: timetableResult.source,
      nextClass: computeNextClass(timetableResult.events),
      streakDays: maxStreak(successResult.dashboard),
      badgesCount: successResult.dashboard?.badges.length ?? null,
      skillsCount: successResult.dashboard?.skills.length ?? null,
      successAvailable: successResult.source === "network",
      openTasks
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  const completeTask = useCallback(
    async (taskId: string) => {
      await db.tasks.update(taskId, { completed: true, updatedAt: new Date().toISOString() });
      await load();
    },
    [load]
  );

  return { data, isLoading, completeTask };
}
