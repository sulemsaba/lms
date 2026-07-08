import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { resolveExperience } from "@/features/auth/roleAccess";
import {
  selectEffectivePermissions,
  selectEffectiveRoleCodes,
  useAuthStore
} from "@/stores/authStore";
import { useStudentHubData, type StudentHubData } from "@/features/dashboard/useStudentHubData";
import type { LocalTask } from "@/services/db";

interface QuickAction {
  icon: string;
  label: string;
  path: string;
}

const LEARNER_ACTIONS: QuickAction[] = [
  { icon: "timer", label: "Focus Mode", path: "/focus-mode" },
  { icon: "style", label: "Quick Recap", path: "/quick-recap" },
  { icon: "edit_note", label: "New Note", path: "/notes?new=true" },
  { icon: "qr_code_scanner", label: "Scan QR", path: "/qr-scanner" },
  { icon: "smart_toy", label: "AI Tutor", path: "/ai-tutor" },
  { icon: "map", label: "Campus Map", path: "/map" }
];

const TEACHING_ACTIONS: QuickAction[] = [
  { icon: "assignment_add", label: "Assessments", path: "/assessments" },
  { icon: "grading", label: "Grading", path: "/assessments" },
  { icon: "calendar_month", label: "Timetable", path: "/timetable" },
  { icon: "menu_book", label: "My Courses", path: "/courses" },
  { icon: "support_agent", label: "Helpdesk", path: "/helpdesk" },
  { icon: "notifications", label: "Alerts", path: "/notifications" }
];

function greetingForNow(name: string | undefined): string {
  const hour = new Date().getHours();
  const window = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return name ? `${window}, ${name}` : window;
}

function SourceChip({ source }: { source: "network" | "cache" | "fallback" }) {
  if (source === "network") return null;
  return (
    <span className="rounded-lg bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
      {source === "cache" ? "offline copy" : "sample data"}
    </span>
  );
}

function StatTile({
  icon,
  value,
  label,
  tone
}: {
  icon: string;
  value: string;
  label: string;
  tone: "primary" | "success" | "warning" | "info";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info"
  };
  return (
    <div className="flex items-center gap-3 rounded-md bg-surface p-4 shadow-1">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tones[tone]}`}>
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-fg">{value}</p>
        <p className="truncate text-xs text-fg-muted">{label}</p>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  action,
  children
}: {
  title: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg bg-surface p-5 shadow-1">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        {action ? (
          <button
            onClick={action.onClick}
            className="flex min-h-0 min-w-0 items-center gap-1 rounded-sm px-2 py-1 text-sm font-medium text-primary transition-colors duration-150 hover:bg-primary-soft"
          >
            {action.label}
            <Icon name="arrow_forward" size={14} />
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <Icon name={icon} size={28} className="text-fg-faint" />
      <p className="text-sm text-fg-muted">{message}</p>
    </div>
  );
}

function QuickActionsGrid({ actions }: { actions: QuickAction[] }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => navigate(action.path)}
          className="flex flex-col items-center gap-2 rounded-md border border-border bg-surface p-3 transition-colors duration-150 hover:border-primary hover:bg-primary-soft"
        >
          <Icon name={action.icon} size={22} className="text-primary" />
          <span className="text-xs font-medium text-fg">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

function TaskList({
  tasks,
  onComplete
}: {
  tasks: LocalTask[];
  onComplete: (taskId: string) => void;
}) {
  const navigate = useNavigate();
  if (tasks.length === 0) {
    return <EmptyState icon="task_alt" message="No open tasks. Plan your next study session." />;
  }
  return (
    <ul className="flex flex-col gap-1">
      {tasks.slice(0, 4).map((task) => (
        <li key={task.id} className="flex items-center gap-3 rounded-md p-2 transition-colors duration-150 hover:bg-surface-hover">
          <button
            onClick={() => onComplete(task.id)}
            aria-label={`Complete ${task.title}`}
            className="flex min-h-0 min-w-0 shrink-0 items-center justify-center rounded-full p-1 text-fg-faint transition-colors duration-150 hover:text-success"
          >
            <Icon name="radio_button_unchecked" size={20} />
          </button>
          <button
            onClick={() => navigate("/tasks")}
            className="flex min-h-0 min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
          >
            <span className="text-sm font-medium text-fg">{task.title}</span>
            {task.dueDate ? (
              <span className="text-xs text-fg-muted">Due {task.dueDate}</span>
            ) : null}
          </button>
          <span
            className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium ${
              task.priority === "high"
                ? "bg-error-soft text-error-strong"
                : task.priority === "medium"
                  ? "bg-warning-soft text-warning"
                  : "bg-surface-hover text-fg-muted"
            }`}
          >
            {task.priority}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TodaySchedule({ data }: { data: StudentHubData }) {
  if (data.todayEvents.length === 0) {
    return <EmptyState icon="event_available" message="Nothing scheduled today." />;
  }
  return (
    <ul className="flex flex-col gap-1">
      {data.todayEvents.map((event) => (
        <li key={event.id} className="flex items-center gap-3 rounded-md p-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
            <Icon name="schedule" size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">{event.title ?? event.detail}</p>
            <p className="truncate text-xs text-fg-muted">
              {event.label}
              {event.venueLabel ? ` · ${event.venueLabel}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CoursesList({ data }: { data: StudentHubData }) {
  const navigate = useNavigate();
  if (data.courses.length === 0) {
    return <EmptyState icon="menu_book" message="No courses yet." />;
  }
  return (
    <ul className="flex flex-col gap-1">
      {data.courses.slice(0, 4).map((course) => (
        <li key={course.id}>
          <button
            onClick={() => navigate("/courses")}
            className="flex w-full min-w-0 items-center gap-3 rounded-md p-2 text-left transition-colors duration-150 hover:bg-surface-hover"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary-soft text-secondary">
              <Icon name="menu_book" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{course.title}</p>
              <p className="truncate text-xs text-fg-muted">{course.lecturer}</p>
            </div>
            <Icon name="chevron_right" size={18} className="shrink-0 text-fg-faint" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Role-aware Home: learners/students get a study-focused view, teaching
 * staff a delivery-focused one. All data comes from real sources (API,
 * offline cache, or local tasks) — offline copies are labeled, never faked.
 */
export default function StudentHub() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const roleCodes = useAuthStore(selectEffectiveRoleCodes);
  const permissions = useAuthStore(selectEffectivePermissions);
  const experience = useMemo(
    () => resolveExperience(roleCodes, permissions),
    [roleCodes, permissions]
  );
  const { data, isLoading, completeTask } = useStudentHubData();

  const isTeaching = experience === "teaching";

  if (isLoading || !data) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="card" />
        <SkeletonLoader type="card" />
      </div>
    );
  }

  const streakValue =
    data.streakDays !== null ? `${data.streakDays} day${data.streakDays === 1 ? "" : "s"}` : "—";
  const nextClassValue = data.nextClass
    ? data.nextClass.minutesUntil < 120
      ? `in ${data.nextClass.minutesUntil}m`
      : data.nextClass.title
    : "None ahead";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      {/* Greeting */}
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-fg">{greetingForNow(user?.name)}</h1>
          <p className="text-sm text-fg-muted">
            {isTeaching
              ? "Here's your teaching day at a glance."
              : "Keep the momentum — your learning day at a glance."}
          </p>
        </div>
        {!data.successAvailable ? (
          <span className="rounded-lg bg-surface-hover px-2 py-1 text-xs text-fg-muted">
            Streaks & badges sync when you're back online
          </span>
        ) : null}
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isTeaching ? (
          <>
            <StatTile icon="menu_book" value={String(data.courses.length)} label="Courses" tone="primary" />
            <StatTile icon="event" value={String(data.todayEvents.length)} label="Sessions today" tone="info" />
            <StatTile icon="schedule" value={nextClassValue} label={data.nextClass ? `Next: ${data.nextClass.title}` : "Next session"} tone="warning" />
            <StatTile icon="checklist" value={String(data.openTasks.length)} label="Open tasks" tone="success" />
          </>
        ) : (
          <>
            <StatTile icon="local_fire_department" value={streakValue} label="Study streak" tone="warning" />
            <StatTile icon="schedule" value={nextClassValue} label={data.nextClass ? `Next: ${data.nextClass.title}` : "Next class"} tone="primary" />
            <StatTile icon="checklist" value={String(data.openTasks.length)} label="Open tasks" tone="info" />
            <StatTile
              icon="military_tech"
              value={data.badgesCount !== null ? String(data.badgesCount) : "—"}
              label="Badges earned"
              tone="success"
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <QuickActionsGrid actions={isTeaching ? TEACHING_ACTIONS : LEARNER_ACTIONS} />

      {/* Content columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title={isTeaching ? "Today's sessions" : "Today"}
          action={{ label: "Timetable", onClick: () => navigate("/timetable") }}
        >
          <div className="mb-2 flex justify-end">
            <SourceChip source={data.timetableSource} />
          </div>
          <TodaySchedule data={data} />
        </SectionCard>

        <SectionCard title="To-do" action={{ label: "All tasks", onClick: () => navigate("/tasks") }}>
          <TaskList tasks={data.openTasks} onComplete={(taskId) => void completeTask(taskId)} />
        </SectionCard>

        <SectionCard
          title={isTeaching ? "Your courses" : "Jump back in"}
          action={{ label: "Courses", onClick: () => navigate("/courses") }}
        >
          <div className="mb-2 flex justify-end">
            <SourceChip source={data.coursesSource} />
          </div>
          <CoursesList data={data} />
        </SectionCard>

        <SectionCard
          title={isTeaching ? "Assessment workflows" : "Level up"}
          action={
            isTeaching
              ? { label: "Assessments", onClick: () => navigate("/assessments") }
              : { label: "Badges", onClick: () => navigate("/badges") }
          }
        >
          {isTeaching ? (
            <EmptyState icon="grading" message="Review submissions and manage grading from Assessments." />
          ) : (
            <div className="flex flex-col gap-1">
              {[
                { icon: "style", title: "Quick Recap", meta: "Flashcards for spaced review", path: "/quick-recap" },
                { icon: "timer", title: "Focus session", meta: "Pomodoro with distraction-free timer", path: "/focus-mode" },
                { icon: "leaderboard", title: "Leaderboard", meta: "See where you stand this week", path: "/leaderboard" }
              ].map((item) => (
                <button
                  key={item.title}
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors duration-150 hover:bg-surface-hover"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{item.title}</p>
                    <p className="truncate text-xs text-fg-muted">{item.meta}</p>
                  </div>
                  <Icon name="chevron_right" size={18} className="shrink-0 text-fg-faint" />
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
