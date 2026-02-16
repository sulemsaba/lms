import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import "./DashboardApp.css";

interface NavItem {
  label: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface CalendarDay {
  label: string;
  muted?: boolean;
  today?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main Menu",
    items: [
      { label: "Dashboard", icon: "dashboard" },
      { label: "My Courses", icon: "menu_book" },
      { label: "Assignments", icon: "assignment" },
      { label: "Timetable", icon: "calendar_month" }
    ]
  },
  {
    title: "University",
    items: [
      { label: "Results", icon: "account_balance" },
      { label: "Payments", icon: "receipt_long" },
      { label: "Community", icon: "forum" }
    ]
  }
];

const DAY_HEADERS = ["M", "T", "W", "T", "F", "S", "S"];
const CALENDAR_DAYS: CalendarDay[] = [
  { label: "29", muted: true },
  { label: "30", muted: true },
  { label: "1" },
  { label: "2" },
  { label: "3" },
  { label: "4" },
  { label: "5" },
  { label: "6" },
  { label: "7" },
  { label: "8" },
  { label: "9" },
  { label: "10" },
  { label: "11" },
  { label: "12" },
  { label: "13" },
  { label: "14", today: true },
  { label: "15" },
  { label: "16" },
  { label: "17" },
  { label: "18" },
  { label: "19" }
];

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

/**
 * Static dashboard view that mirrors the provided UDSM layout.
 */
export default function DashboardApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState("Dashboard");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION_SECONDS);
  const timerRef = useRef<number | null>(null);

  const currentDate = useMemo(() => new Date().toLocaleDateString("en-GB", DATE_OPTIONS), []);
  const timerText = useMemo(() => formatFocusClock(timeLeft), [timeLeft]);
  const timerProgress = timeLeft / FOCUS_DURATION_SECONDS;
  const timerStrokeOffset = RING_CIRCUMFERENCE * (1 - timerProgress);

  useEffect(() => {
    if (!timerRunning) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          setTimerRunning(false);
          window.alert("Session Complete!");
          return FOCUS_DURATION_SECONDS;
        }
        return previous - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerRunning]);

  const onSelectNav = (label: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setActiveNavItem(label);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="dashboard-root">
      <aside id="sidebar" className={sidebarOpen ? "active" : undefined}>
        <div className="brand">
          <div className="brand-icon">
            <span className="material-symbols-rounded">school</span>
          </div>
          <div className="brand-text">UDSM Hub</div>
        </div>

        <ul className="nav-menu">
          {NAV_SECTIONS.map((section) => (
            <Fragment key={section.title}>
              <li className="nav-category">{section.title}</li>
              {section.items.map((item) => (
                <li className="nav-item" key={item.label}>
                  <a
                    href="#"
                    className={`nav-link${activeNavItem === item.label ? " active" : ""}`}
                    onClick={onSelectNav(item.label)}
                  >
                    <span className="material-symbols-rounded">{item.icon}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </Fragment>
          ))}
        </ul>

        <div className="user-profile">
          <div className="avatar" />
          <div className="user-info">
            <h4>Suleiman M.</h4>
            <p>Computer Science</p>
          </div>
          <span className="material-symbols-rounded user-expand">expand_more</span>
        </div>
      </aside>

      <main>
        <header>
          <div className="header-left">
            <button type="button" className="material-symbols-rounded menu-toggle" onClick={() => setSidebarOpen((open) => !open)}>
              menu
            </button>
            <div className="header-title">
              <h1>Dashboard</h1>
              <p>{currentDate}</p>
            </div>
          </div>

          <div className="header-actions">
            <button type="button" className="icon-btn" aria-label="Search">
              <span className="material-symbols-rounded">search</span>
            </button>
            <button type="button" className="icon-btn has-dot" aria-label="Notifications">
              <span className="material-symbols-rounded">notifications</span>
            </button>
            <button type="button" className="icon-btn" aria-label="Messages">
              <span className="material-symbols-rounded">mail</span>
            </button>
          </div>
        </header>

        <div className="scroll-container">
          <div className="grid-dashboard">
            <div className="banner">
              <div className="banner-content">
                <h2>Welcome back, Suleiman!</h2>
                <p>
                  You have completed <strong>76%</strong> of your GPA target this semester. You have a Data Structures exam
                  coming up in 3 days.
                </p>
                <button type="button" className="btn-white">
                  View Exam Schedule
                </button>
              </div>
              <span className="material-symbols-rounded banner-icon">auto_stories</span>
            </div>

            <div className="stats-row">
              <div className="stat-card blue">
                <span className="stat-label">Current GPA</span>
                <span className="stat-value">3.8</span>
                <span className="stat-sub text-up">
                  <span className="material-symbols-rounded trend-icon">trending_up</span>
                  +0.2 vs last sem
                </span>
              </div>
              <div className="stat-card green">
                <span className="stat-label">Attendance</span>
                <span className="stat-value">95%</span>
                <span className="stat-sub text-up">Excellent standing</span>
              </div>
              <div className="stat-card orange">
                <span className="stat-label">Assignments</span>
                <span className="stat-value">12</span>
                <span className="stat-sub">3 Pending submission</span>
              </div>
              <div className="stat-card red">
                <span className="stat-label">Next Class</span>
                <span className="stat-value">45m</span>
                <span className="stat-sub">CS101 · Hall 4</span>
              </div>
            </div>

            <div className="col-main">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Today&apos;s Schedule</h3>
                  <span className="card-action">View Full Calendar</span>
                </div>

                <div className="list-item">
                  <div className="item-icon primary">
                    <span className="material-symbols-rounded">code</span>
                  </div>
                  <div className="item-content">
                    <div className="item-title">CS101: Intro to Programming</div>
                    <div className="item-sub">10:00 AM - 12:00 PM · Lecture Hall 1</div>
                  </div>
                  <span className="tag lecture">Lecture</span>
                </div>

                <div className="list-item">
                  <div className="item-icon orange">
                    <span className="material-symbols-rounded">functions</span>
                  </div>
                  <div className="item-content">
                    <div className="item-title">MT200: Discrete Mathematics</div>
                    <div className="item-sub">02:00 PM - 04:00 PM · Seminar Room 3</div>
                  </div>
                  <span className="tag tutorial">Tutorial</span>
                </div>

                <div className="list-item">
                  <div className="item-icon alert">
                    <span className="material-symbols-rounded">timer</span>
                  </div>
                  <div className="item-content">
                    <div className="item-title">Study Group: Algorithms</div>
                    <div className="item-sub">05:00 PM · Library</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Recent Resources</h3>
                </div>
                <div className="resources">
                  <div className="resource-card">
                    <span className="material-symbols-rounded resource-icon pdf">picture_as_pdf</span>
                    <div>
                      <div className="resource-title">Algebra_Notes.pdf</div>
                      <div className="resource-meta">2.4 MB · Just now</div>
                    </div>
                  </div>
                  <div className="resource-card">
                    <span className="material-symbols-rounded resource-icon doc">description</span>
                    <div>
                      <div className="resource-title">Project_Brief.docx</div>
                      <div className="resource-meta">500 KB · 2 hrs ago</div>
                    </div>
                  </div>
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
                  <h3 className="card-title">October 2024</h3>
                  <div className="calendar-controls">
                    <button type="button" className="calendar-nav" aria-label="Previous month">
                      <span className="material-symbols-rounded">chevron_left</span>
                    </button>
                    <button type="button" className="calendar-nav" aria-label="Next month">
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
                  {CALENDAR_DAYS.map((cell) => (
                    <div
                      key={`${cell.label}-${cell.today ? "today" : "day"}`}
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
                  <div className="classmate-row">
                    <div className="classmate-avatar felix" />
                    <div className="classmate-text">
                      <div className="classmate-name">Francis Tran</div>
                      <div className="classmate-status online">Studying Biology</div>
                    </div>
                  </div>
                  <div className="classmate-row">
                    <div className="classmate-avatar eliana" />
                    <div className="classmate-text">
                      <div className="classmate-name">Eliana P.</div>
                      <div className="classmate-status">Idle for 10m</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
