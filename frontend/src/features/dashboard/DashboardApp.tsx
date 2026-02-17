import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";
import "./DashboardApp.css";

interface StudentFeatureLink {
  label: string;
  icon: string;
  path: string;
  summary: string;
}

interface DashboardScheduleItem {
  title: string;
  time: string;
}

type ActivityStatus = "completed" | "in-progress" | "not-started";

interface ActivityCard {
  id: string;
  title: string;
  lesson: string;
  durationMinutes: number;
  completedSteps: number;
  totalSteps: number;
  status: ActivityStatus;
  path: string;
}

interface SubjectCard {
  id: string;
  title: string;
  subtitle: string;
  grade: string;
  topics: string[];
  completed: number;
  total: number;
  nextUp: string;
  path: string;
  progressColor: string;
}

interface WeeklyCard {
  id: string;
  title: string;
  lesson: string;
  status: ActivityStatus;
  path: string;
}

interface WeeklyColumn {
  day: string;
  totalMinutes: number;
  cards: WeeklyCard[];
}

const SUBJECT_PROGRESS: SubjectCard[] = [
  {
    id: "math",
    title: "Math",
    subtitle: "Basic Math",
    grade: "Grade 2",
    topics: ["Addition & Subtraction", "Place Value Understanding", "Word Problem Solving"],
    completed: 6,
    total: 8,
    nextUp: "Grade 3 (2-Digit Subtraction with Regrouping)",
    path: "/courses",
    progressColor: "var(--dashboard-purple)"
  },
  {
    id: "reading",
    title: "Reading",
    subtitle: "Basic Reading",
    grade: "Grade 2",
    topics: ["Vocabulary Building", "Reading Comprehension", "Story Retelling"],
    completed: 3,
    total: 8,
    nextUp: "Grade 3 (Long & Short Vowels)",
    path: "/courses",
    progressColor: "var(--dashboard-pink)"
  }
];

const WEEKLY_ACTIVITY: WeeklyColumn[] = [
  {
    day: "Monday",
    totalMinutes: 46,
    cards: [
      { id: "m1", title: "Reading", lesson: "Lesson-2", status: "completed", path: "/courses" },
      { id: "m2", title: "Math", lesson: "Lesson-1", status: "in-progress", path: "/assessments" }
    ]
  },
  {
    day: "Tuesday",
    totalMinutes: 30,
    cards: [
      { id: "t1", title: "Math", lesson: "Lesson-2", status: "completed", path: "/assessments" },
      { id: "t2", title: "Reading", lesson: "Lesson-1", status: "not-started", path: "/courses" }
    ]
  },
  {
    day: "Wednesday",
    totalMinutes: 80,
    cards: [
      { id: "w1", title: "Reading", lesson: "Lesson-3", status: "completed", path: "/resources" },
      { id: "w2", title: "Math", lesson: "Lesson-3", status: "completed", path: "/assignments" }
    ]
  },
  {
    day: "Thursday",
    totalMinutes: 60,
    cards: [
      { id: "th1", title: "Reading", lesson: "Lesson-1", status: "in-progress", path: "/courses" },
      { id: "th2", title: "Math", lesson: "Lesson-2", status: "not-started", path: "/assessments" }
    ]
  },
  {
    day: "Friday",
    totalMinutes: 30,
    cards: [
      { id: "f1", title: "Reading", lesson: "Lesson-1", status: "completed", path: "/resources" },
      { id: "f2", title: "Math", lesson: "Lesson-1", status: "not-started", path: "/courses" }
    ]
  }
];

const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  completed: "Completed",
  "in-progress": "In Progress",
  "not-started": "Not Started"
};

const formatWeekRange = (anchorDate: Date): string => {
  const start = new Date(anchorDate);
  const normalizedWeekday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - normalizedWeekday);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `Week of ${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
};

/**
 * Static dashboard view that mirrors the provided UDSM layout.
 */
export default function DashboardApp() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: dashboardData, isLoading } = useDashboard();

  const weekLabel = useMemo(() => formatWeekRange(new Date()), []);

  const onSelectFeature = (path: string) => {
    navigate(path);
  };

  const isPathActive = (path: string): boolean => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname === path;
  };

  const studentName = useMemo(() => {
    const message = dashboardData?.welcomeMessage ?? "";
    const match = message.match(/Welcome(?: back)?,\s*([^!]+)/i);
    return match?.[1]?.trim() ?? "Student";
  }, [dashboardData?.welcomeMessage]);

  const scheduleItems = useMemo(
    () => ((dashboardData?.schedule ?? []) as DashboardScheduleItem[]),
    [dashboardData?.schedule]
  );

  const todayActivities = useMemo((): ActivityCard[] => {
    const seeded = scheduleItems.slice(0, 4).map((item, index) => {
      const status: ActivityStatus = index === 0 ? "completed" : index === 1 ? "in-progress" : "not-started";
      return {
        id: `${item.title}-${index}`,
        title: item.title.split(":")[0] ?? item.title,
        lesson: `Lesson-${index + 1}`,
        durationMinutes: 15 + index * 5,
        completedSteps: status === "completed" ? 4 : status === "in-progress" ? 3 : 0,
        totalSteps: 4,
        status,
        path: status === "completed" ? "/resources" : "/assessments"
      };
    });

    const fallback: ActivityCard[] = [
      {
        id: "fallback-reading",
        title: "Reading",
        lesson: "Lesson-1",
        durationMinutes: 20,
        completedSteps: 0,
        totalSteps: 4,
        status: "not-started",
        path: "/courses"
      },
      {
        id: "fallback-math",
        title: "Math",
        lesson: "Lesson-1",
        durationMinutes: 20,
        completedSteps: 0,
        totalSteps: 4,
        status: "not-started",
        path: "/assessments"
      }
    ];

    while (seeded.length < 4 && fallback.length > 0) {
      const next = fallback.shift();
      if (next) {
        seeded.push(next);
      }
    }

    return seeded;
  }, [scheduleItems]);

  const summaryCards = useMemo(() => {
    const attendance = Math.max(0, Math.min(100, Math.round(dashboardData?.attendance ?? 80)));
    const assignments = Math.max(1, dashboardData?.assignments ?? 1);
    const pending = Math.max(0, dashboardData?.assignmentsPending ?? 0);
    const completedAssignments = Math.max(0, assignments - pending);
    const activityPercent = Math.round((completedAssignments / assignments) * 100);

    return [
      { id: "student-progress", label: "Student Progress", value: `${attendance} %`, icon: "stacked_bar_chart" },
      { id: "total-activity", label: "Total Activity", value: `${activityPercent} %`, icon: "checklist" },
      { id: "total-time", label: "Total Time", value: "1h 39m", icon: "schedule" }
    ];
  }, [dashboardData?.assignments, dashboardData?.assignmentsPending, dashboardData?.attendance]);

  const totalTodayMinutes = useMemo(
    () => todayActivities.reduce((total, current) => total + current.durationMinutes, 0),
    [todayActivities]
  );

  const featureLinks = useMemo(
    () => ((dashboardData?.visibleStudentFeatures ?? []) as StudentFeatureLink[]).slice(0, 8),
    [dashboardData?.visibleStudentFeatures]
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <section className="dashboard-page">
        <header className="dashboard-header">
          <div className="dashboard-heading">
            <h1>Dashboard</h1>
            <p>{weekLabel}</p>
          </div>
          <div className="dashboard-top-right">
            <button type="button" className="profile-chip" onClick={() => onSelectFeature("/profile")}>
              <div className="profile-copy">
                <strong>{studentName}</strong>
                <span>Grade 2</span>
              </div>
            </button>
            <div className="header-actions">
              <button type="button" className="icon-btn" onClick={() => onSelectFeature("/search")} aria-label="Search">
                <span className="material-symbols-rounded">search</span>
              </button>
              <button
                type="button"
                className="icon-btn has-dot"
                onClick={() => onSelectFeature("/notifications")}
                aria-label="Notifications"
              >
                <span className="material-symbols-rounded">notifications</span>
              </button>
              <button type="button" className="icon-btn" onClick={() => onSelectFeature("/community")} aria-label="Messages">
                <span className="material-symbols-rounded">mail</span>
              </button>
            </div>
          </div>
        </header>

        <section className="summary-grid">
          {summaryCards.map((card) => (
            <article key={card.id} className="summary-card">
              <div>
                <h2>{card.value}</h2>
                <p>{card.label}</p>
              </div>
              <span className="material-symbols-rounded">{card.icon}</span>
            </article>
          ))}
        </section>

        <section className="subject-grid">
          {SUBJECT_PROGRESS.map((subject) => (
            <article key={subject.id} className="subject-card">
              <div className="subject-header">
                <div>
                  <h3>{subject.title}</h3>
                  <p>{subject.subtitle}</p>
                </div>
                <span className="grade-pill">{subject.grade}</span>
              </div>

              <ul className="subject-topics">
                {subject.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>

              <div className="subject-progress-row">
                <div className="subject-progress-track">
                  <span
                    className="subject-progress-fill"
                    style={{
                      width: `${Math.round((subject.completed / subject.total) * 100)}%`,
                      backgroundColor: subject.progressColor
                    }}
                  />
                </div>
                <span className="subject-progress-count">
                  {subject.completed} / {subject.total}
                </span>
              </div>

              <div className="subject-footer">
                <p>Next up: {subject.nextUp}</p>
                <button type="button" className="link-button" onClick={() => onSelectFeature(subject.path)}>
                  Next Grade
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <h2>Today&apos;s Activity</h2>
            <div className="panel-meta">
              <span>Total time: {totalTodayMinutes} minutes</span>
              <button type="button" className="link-button" onClick={() => onSelectFeature("/timetable")}>
                View Timetable
              </button>
            </div>
          </div>
          <div className="activity-grid">
            {todayActivities.map((activity) => (
              <article key={activity.id} className="activity-card">
                <div className="activity-header">
                  <div>
                    <h3>{activity.title}</h3>
                    <p>{activity.lesson}</p>
                  </div>
                  <span className={`status-pill ${activity.status}`}>{ACTIVITY_STATUS_LABEL[activity.status]}</span>
                </div>
                <p className="activity-time">Time: {activity.durationMinutes} minutes</p>
                <div className="activity-progress-row">
                  <div className="activity-progress-track">
                    <span
                      className={`activity-progress-fill ${activity.status}`}
                      style={{ width: `${Math.round((activity.completedSteps / activity.totalSteps) * 100)}%` }}
                    />
                  </div>
                  <span>
                    {activity.completedSteps} / {activity.totalSteps}
                  </span>
                </div>
                <button type="button" className="ghost-button" onClick={() => onSelectFeature(activity.path)}>
                  View Lesson
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <h2>Weekly Activity</h2>
            <button type="button" className="link-button" onClick={() => onSelectFeature("/queue-manager")}>
              Queue Manager
            </button>
          </div>
          <div className="weekly-grid">
            {WEEKLY_ACTIVITY.map((day) => (
              <article key={day.day} className="weekly-column">
                <h3>{day.day}</h3>
                <p className="weekly-total">Total Time: {day.totalMinutes} min</p>
                <div className="weekly-list">
                  {day.cards.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className="weekly-entry"
                      onClick={() => onSelectFeature(entry.path)}
                    >
                      <div>
                        <strong>{entry.title}</strong>
                        <span>{entry.lesson}</span>
                      </div>
                      <span className={`status-pill ${entry.status}`}>{ACTIVITY_STATUS_LABEL[entry.status]}</span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <h2>Quick Feature Access</h2>
            <span>{featureLinks.length} modules</span>
          </div>
          <div className="feature-grid">
            {featureLinks.map((feature) => (
              <button
                key={feature.path}
                type="button"
                className={`feature-tile${isPathActive(feature.path) ? " active" : ""}`}
                onClick={() => onSelectFeature(feature.path)}
              >
                <span className="material-symbols-rounded">{feature.icon}</span>
                <span className="feature-copy">
                  <span className="feature-title">{feature.label}</span>
                  <span className="feature-sub">{feature.summary}</span>
                </span>
              </button>
            ))}
            {featureLinks.length === 0 ? (
              <p className="empty-state">
                Feature links will appear after permissions are loaded. Open Courses or Map to continue.
              </p>
            ) : null}
          </div>
        </section>
    </section>
  );
}
