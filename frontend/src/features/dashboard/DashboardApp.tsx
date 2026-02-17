import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "@/components/layout/BottomNav";
import { useDashboard } from "@/hooks/useDashboard";
import "./DashboardApp.css";

interface CalendarDay {
  label: string;
  muted?: boolean;
  today?: boolean;
}

const DAY_HEADERS = ["M", "T", "W", "T", "F", "S", "S"];

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "short",
  day: "numeric"
};
const FOCUS_DURATION_SECONDS = 25 * 60;
const RING_CIRCUMFERENCE = 314;

const formatFocusClock = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

const buildCalendarDays = (monthCursor: Date): CalendarDay[] => {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const days: CalendarDay[] = [];

  for (let index = firstDayIndex; index > 0; index -= 1) {
    days.push({ label: String(daysInPreviousMonth - index + 1), muted: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({ label: String(day), today: isCurrentMonth && day === today.getDate() });
  }

  const trailingDayCount = (7 - (days.length % 7)) % 7;
  for (let day = 1; day <= trailingDayCount; day += 1) {
    days.push({ label: String(day), muted: true });
  }

  return days;
};

/**
 * Static dashboard view that mirrors the provided UDSM layout.
 */
export default function DashboardApp() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION_SECONDS);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const workerRef = useRef<Worker | null>(null);

  const { data: dashboardData, isLoading } = useDashboard();

  const currentDate = useMemo(() => new Date().toLocaleDateString("en-GB", DATE_OPTIONS), []);
  const timerText = useMemo(() => formatFocusClock(timeLeft), [timeLeft]);
  const calendarTitle = useMemo(
    () => calendarMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    [calendarMonth]
  );
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const timerProgress = timeLeft / FOCUS_DURATION_SECONDS;
  const timerStrokeOffset = RING_CIRCUMFERENCE * (1 - timerProgress);

  useEffect(() => {
    workerRef.current = new Worker(new URL("../../workers/focus-timer.worker.ts", import.meta.url));

    workerRef.current.onmessage = (e) => {
      setTimeLeft(e.data.timeLeft);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (timerRunning) {
      workerRef.current?.postMessage({ command: "start", duration: timeLeft });
    } else {
      workerRef.current?.postMessage({ command: "stop" });
    }
  }, [timerRunning, timeLeft]);

  const onSelectFeature = (path: string) => {
    navigate(path);
  };

  const onShiftCalendarMonth = (monthOffset: number) => {
    setCalendarMonth(
      (currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1)
    );
  };

  const isPathActive = (path: string): boolean => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname === path;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-root">
      <BottomNav />

      <main>
        <header>
          <div className="header-left">
            <div className="header-title">
              <h1>Dashboard</h1>
              <p>{currentDate}</p>
            </div>
          </div>

          <div className="header-actions">
            <button type="button" className="icon-btn" aria-label="Search" onClick={() => onSelectFeature("/search")}>
              <span className="material-symbols-rounded">search</span>
            </button>
            <button
              type="button"
              className="icon-btn has-dot"
              aria-label="Notifications"
              onClick={() => onSelectFeature("/notifications")}
            >
              <span className="material-symbols-rounded">notifications</span>
            </button>
            <button type="button" className="icon-btn" aria-label="Messages" onClick={() => onSelectFeature("/community")}>
              <span className="material-symbols-rounded">mail</span>
            </button>
          </div>
        </header>

        <div className="scroll-container">
          <div className="grid-dashboard">
            <div className="banner">
              <div className="banner-content">
                <h2>{dashboardData?.welcomeMessage}</h2>
                <p>
                  You have completed <strong>76%</strong> of your GPA target this semester. You have a Data Structures exam
                  coming up in 3 days.
                </p>
                <button type="button" className="btn-white" onClick={() => onSelectFeature("/timetable")}>
                  View Exam Schedule
                </button>
              </div>
              <span className="material-symbols-rounded banner-icon">auto_stories</span>
            </div>

            <div className="stats-row">
              <div className="stat-card blue">
                <span className="stat-label">Current GPA</span>
                <span className="stat-value">{dashboardData?.gpa}</span>
                <span className="stat-sub text-up">
                  <span className="material-symbols-rounded trend-icon">trending_up</span>
                  +{dashboardData?.gpaTrend} vs last sem
                </span>
              </div>
              <div className="stat-card green">
                <span className="stat-label">Attendance</span>
                <span className="stat-value">{dashboardData?.attendance}%</span>
                <span className="stat-sub text-up">Excellent standing</span>
              </div>
              <div className="stat-card orange">
                <span className="stat-label">Assignments</span>
                <span className="stat-value">{dashboardData?.assignments}</span>
                <span className="stat-sub">{dashboardData?.assignmentsPending} Pending submission</span>
              </div>
              <div className="stat-card red">
                <span className="stat-label">Next Class</span>
                <span className="stat-value">{dashboardData?.nextClassTime}</span>
                <span className="stat-sub">{dashboardData?.nextClass}</span>
              </div>
            </div>

            <div className="card student-features">
              <div className="card-header">
                <h3 className="card-title">All Student Features</h3>
                <span className="card-action">{dashboardData?.visibleStudentFeatures.length} Modules</span>
              </div>
              <div className="feature-grid">
                {dashboardData?.visibleStudentFeatures.map((feature: any) => (
                  <button
                    key={feature.label}
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
              </div>
            </div>

            <div className="col-main">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Today&apos;s Schedule</h3>
                  <button
                    type="button"
                    className="card-action card-action-btn"
                    onClick={() => onSelectFeature("/timetable")}
                  >
                    View Full Calendar
                  </button>
                </div>

                {dashboardData?.schedule.map((item: any) => (
                  <div className="list-item" key={item.title}>
                    <div className={`item-icon ${item.iconColor}`}>
                      <span className="material-symbols-rounded">{item.icon}</span>
                    </div>
                    <div className="item-content">
                      <div className="item-title">{item.title}</div>
                      <div className="item-sub">{item.time}</div>
                    </div>
                    {item.tag && <span className={`tag ${item.tagColor}`}>{item.tag}</span>}
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Recent Resources</h3>
                </div>
                <div className="resources">
                  {dashboardData?.resources.map((resource: any) => (
                    <div className="resource-card" key={resource.title}>
                      <span className={`material-symbols-rounded resource-icon ${resource.iconColor}`}>{resource.icon}</span>
                      <div>
                        <div className="resource-title">{resource.title}</div>
                        <div className="resource-meta">{resource.meta}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-side">
              <div className="card focus-card">
                <div className="card-header">
                  <h3 className="card-title">Focus Mode</h3>
                  <span className="material-symbols-rounded muted-icon">more_horiz</span>
                </div>

                <div className="progress-wrapper">
                  <svg className="progress-svg" viewBox="0 0 120 120">
                    <circle className="progress-circle-bg" cx="60" cy="60" r="50" />
                    <circle
                      className="progress-circle-fill"
                      cx="60"
                      cy="60"
                      r="50"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={timerStrokeOffset}
                    />
                  </svg>
                  <div className="progress-text">
                    <div className="progress-val">{timerText}</div>
                    <div className="progress-label">Minutes</div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`btn-white focus-toggle${timerRunning ? " running" : ""}`}
                  onClick={() => setTimerRunning((running) => !running)}
                >
                  {timerRunning ? "Pause Focus" : "Start Focus"}
                </button>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">{calendarTitle}</h3>
                  <div className="calendar-controls">
                    <button
                      type="button"
                      className="calendar-nav"
                      aria-label="Previous month"
                      onClick={() => onShiftCalendarMonth(-1)}
                    >
                      <span className="material-symbols-rounded">chevron_left</span>
                    </button>
                    <button
                      type="button"
                      className="calendar-nav"
                      aria-label="Next month"
                      onClick={() => onShiftCalendarMonth(1)}
                    >
                      <span className="material-symbols-rounded">chevron_right</span>
                    </button>
                  </div>
                </div>
                <div className="mini-calendar">
                  {DAY_HEADERS.map((day) => (
                    <div key={day} className="day-head">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((cell, index) => (
                    <div
                      key={`${cell.label}-${cell.today ? "today" : "day"}-${index}`}
                      className={`day-cell${cell.today ? " today" : ""}${cell.muted ? " muted-day" : ""}`}
                    >
                      {cell.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Online Classmates</h3>
                </div>
                <div className="classmate-list">
                  {dashboardData?.onlineClassmates.map((classmate: any) => (
                    <div className="classmate-row" key={classmate.name}>
                      <div className={`classmate-avatar ${classmate.avatar}`} />
                      <div className="classmate-text">
                        <div className="classmate-name">{classmate.name}</div>
                        <div className={`classmate-status ${classmate.statusColor}`}>{classmate.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
