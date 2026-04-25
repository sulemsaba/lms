import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { useAuthStore } from "@/stores/authStore";
import "./StudentHub.css";

interface CampusEvent {
  id: string;
  title: string;
  time: string;
  location: string;
  type: 'academic' | 'social' | 'food' | 'sports';
  emoji: string;
}

interface QuickTask {
  id: string;
  title: string;
  icon: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}

interface StudySpot {
  id: string;
  name: string;
  description: string;
  busyness: number;
  hasPower: boolean;
  hasWifi: boolean;
  emoji: string;
}

export default function StudentHub() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [mood, setMood] = useState<'productive' | 'chill' | 'stressed' | 'social'>('productive');
  const [loading, setLoading] = useState(true);

  // Simulate data load
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 17) setTimeOfDay('afternoon');
    else if (hour < 22) setTimeOfDay('evening');
    else setTimeOfDay('night');
    return () => clearTimeout(timer);
  }, []);

  // ── Greeting ──
  const getGreeting = () => {
    const greetings = {
      morning: ['Good morning!', 'Ready to crush the day?', 'Rise and shine!'],
      afternoon: ['Afternoon vibes!', 'How\u2019s your day going?', 'Keep the momentum!'],
      evening: ['Evening grind!', 'Still going strong?', 'Almost there!'],
      night: ['Night owl!', 'Burning midnight oil?', 'You\u2019re dedicated!'],
    };
    const options = greetings[timeOfDay];
    return options[Math.floor(Math.random() * options.length)];
  };

  // ── Mood options ──
  const moodOptions = [
    { id: 'productive', icon: 'bolt', color: 'var(--color-primary)' },
    { id: 'chill', icon: 'self_improvement', color: 'var(--color-secondary)' },
    { id: 'stressed', icon: 'psychology', color: '#EF4444' },
    { id: 'social', icon: 'diversity_3', color: '#8B5CF6' },
  ] as const;

  // ── Real data ──
  const campusEvents: CampusEvent[] = [
    { id: '1', title: 'Free Coffee @ Main Library', time: '8 AM \u2013 10 AM', location: 'Library Cafe', type: 'food', emoji: 'coffee' },
    { id: '2', title: 'AI & ML Workshop', time: '2 PM \u2013 4 PM', location: 'CS Building 302', type: 'academic', emoji: 'smart_toy' },
    { id: '3', title: 'Campus Football Tournament', time: '4 PM \u2013 6 PM', location: 'Sports Complex', type: 'sports', emoji: 'sports_soccer' },
    { id: '4', title: 'Student Band Night', time: '7 PM \u2013 10 PM', location: 'Student Center', type: 'social', emoji: 'music_note' },
    { id: '5', title: 'Late Night Study Session', time: '10 PM \u2013 1 AM', location: '24/7 Study Hall', type: 'academic', emoji: 'lightbulb' },
  ];

  const quickTasks: QuickTask[] = [
    { id: '1', title: 'Submit Calculus Assignment', icon: 'assignment', time: 'Due tomorrow!', priority: 'high' },
    { id: '2', title: 'Print lab report', icon: 'print', time: 'Before 3 PM', priority: 'medium' },
    { id: '3', title: 'Find group for CS project', icon: 'group', time: 'This week', priority: 'medium' },
    { id: '4', title: 'Buy coffee tokens', icon: 'local_cafe', time: 'Whenever', priority: 'low' },
    { id: '5', title: 'Return library books', icon: 'menu_book', time: 'Overdue!', priority: 'high' },
  ];

  const studySpots: StudySpot[] = [
    { id: '1', name: 'Main Library 3rd Floor', description: 'Quiet zone, power outlets', busyness: 4, hasPower: true, hasWifi: true, emoji: 'library_books' },
    { id: '2', name: 'CS Building Lounge', description: 'Group study friendly', busyness: 3, hasPower: true, hasWifi: true, emoji: 'developer_mode' },
    { id: '3', name: 'Botanical Garden Bench', description: 'Outdoor, peaceful', busyness: 2, hasPower: false, hasWifi: false, emoji: 'park' },
    { id: '4', name: 'Student Center Cafe', description: 'Coffee + studying', busyness: 5, hasPower: true, hasWifi: true, emoji: 'coffee' },
  ];

  return (
    <div className="student-hub">
      {/* ═══ HEADER ═══ */}
      <header className="hub-header">
        <div className="header-content">
          <div className="greeting-row">
            <div className="greeting-text">
              <h1>{getGreeting()}</h1>
              <p className="student-name">{user?.name || 'Student'} <span className="vibe-dot">{timeOfDay} vibes</span></p>
            </div>
            {/* Compact mood toggle */}
            <div className="mood-pills">
              {moodOptions.map((opt) => (
                <button
                  key={opt.id}
                  className={`mood-pill ${mood === opt.id ? 'active' : ''}`}
                  onClick={() => setMood(opt.id as typeof mood)}
                  style={{ '--mood-color': opt.color } as any}
                  aria-label={opt.id}
                  title={opt.id}
                >
                  <Icon name={opt.icon} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Quick stats row */}
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-value">7</span>
              <span className="stat-label">Day streak</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">3</span>
              <span className="stat-label">Due soon</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">85%</span>
              <span className="stat-label">Attendance</span>
            </div>
            <div className="stat-item accent">
              <span className="stat-value">CS101</span>
              <span className="stat-label">Next class in 45m</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ CONTENT GRID (2 columns) ═══ */}
      <div className="hub-grid">
        {/* ── MAIN COLUMN ── */}
        <div className="main-column">
          {loading ? (
            <>
              <SkeletonLoader type="card" />
              <SkeletonLoader type="card" />
              <SkeletonLoader type="card" />
            </>
          ) : (
            <>
              {/* Quick Actions — condensed */}
              <section className="hub-card quick-actions-card">
                <h2 className="card-title">Quick Actions</h2>
                <div className="actions-grid">
                  {[
                    { icon: 'qr_code_scanner', label: 'Scan QR', path: '/qr-scanner' },
                    { icon: 'timer', label: 'Focus Mode', path: '/focus-mode' },
                    { icon: 'edit_note', label: 'Quick Note', path: '/notes?new=true' },
                    { icon: 'smart_toy', label: 'AI Tutor', path: '/ai-tutor' },
                    { icon: 'search', label: 'Find Spot', path: '/map' },
                    { icon: 'group', label: 'Study Buddy', path: '/study-groups' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className="action-button"
                      onClick={() => navigate(action.path)}
                    >
                      <span className="action-icon">
                        <Icon name={action.icon} size={22} />
                      </span>
                      <span className="action-label">{action.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* To-Do List */}
              <section className="hub-card tasks-card">
                <div className="card-header">
                  <h2 className="card-title">To-Do</h2>
                  <span className="card-badge">{quickTasks.length} items</span>
                </div>
                <div className="tasks-list">
                  {quickTasks.map((task) => (
                    <div key={task.id} className={`task-item ${task.priority}`}>
                      <div className="task-check">
                        <button className="check-btn" aria-label={`Complete ${task.title}`}>
                          <Icon name="check_circle_outline" size={22} />
                        </button>
                      </div>
                      <div className="task-body">
                        <h4>{task.title}</h4>
                        <span className={`task-tag ${task.priority}`}>{task.time}</span>
                      </div>
                      <Icon name={task.icon} size={18} className="task-icon" />
                    </div>
                  ))}
                </div>
                <button className="add-task-btn">
                  <Icon name="add" size={18} />
                  Add task
                </button>
              </section>

              {/* Events Today */}
              <section className="hub-card events-card">
                <div className="card-header">
                  <h2 className="card-title">Today on Campus</h2>
                  <button className="see-all-btn" onClick={() => navigate('/timetable')}>
                    See all <Icon name="arrow_forward" size={14} />
                  </button>
                </div>
                <div className="events-scroll">
                  {campusEvents.map((event) => (
                    <div key={event.id} className="event-item">
                      <div className="event-icon" data-type={event.type}>
                        <Icon name={event.emoji} size={22} />
                      </div>
                      <div className="event-body">
                        <h4>{event.title}</h4>
                        <div className="event-meta">
                          <span><Icon name="schedule" size={12} /> {event.time}</span>
                          <span><Icon name="location_on" size={12} /> {event.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* ── SIDE COLUMN ── */}
        <div className="side-column">
          {loading ? (
            <>
              <SkeletonLoader type="card" />
              <SkeletonLoader type="card" />
            </>
          ) : (
            <>
              {/* Study Spots */}
              <section className="hub-card spots-card">
                <div className="card-header">
                  <h2 className="card-title">Study Spots</h2>
                  <span className="card-badge">Live</span>
                </div>
                <div className="spots-list">
                  {studySpots.map((spot) => (
                    <div key={spot.id} className="spot-item">
                      <div className="spot-top">
                        <div className="spot-name">
                          <Icon name={spot.emoji} size={18} />
                          <span>{spot.name}</span>
                        </div>
                        <div className="busyness-indicator" style={{ '--level': spot.busyness } as any}>
                          <span className="busyness-label">
                            {spot.busyness <= 2 ? 'Quiet' : spot.busyness <= 4 ? 'Moderate' : 'Busy'}
                          </span>
                          <div className="busyness-track">
                            {[1, 2, 3, 4, 5].map((l) => (
                              <div key={l} className={`busyness-bar ${l <= spot.busyness ? 'fill' : ''}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="spot-desc">{spot.description}</p>
                      <div className="spot-tags">
                        {spot.hasPower && <span className="tag">Power</span>}
                        {spot.hasWifi && <span className="tag">WiFi</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="card-action-btn" onClick={() => navigate('/map')}>
                  <Icon name="map" size={16} />
                  View campus map
                </button>
              </section>

              {/* Jump Back In */}
              <section className="hub-card links-card">
                <h2 className="card-title">Jump Back In</h2>
                <div className="links-list">
                  {[
                    { icon: 'menu_book', title: 'Continue Calculus', meta: 'Last viewed 2h ago', path: '/courses' },
                    { icon: 'assignment', title: 'CS Assignment', meta: 'Due tomorrow', path: '/assessments' },
                    { icon: 'folder_open', title: 'Physics Notes', meta: 'Edited yesterday', path: '/notes' },
                  ].map((link) => (
                    <button key={link.title} className="link-item" onClick={() => navigate(link.path)}>
                      <div className="link-icon">
                        <Icon name={link.icon} size={20} />
                      </div>
                      <div className="link-body">
                        <h4>{link.title}</h4>
                        <p>{link.meta}</p>
                      </div>
                      <Icon name="chevron_right" size={18} className="link-arrow" />
                    </button>
                  ))}
                </div>
              </section>

              {/* Mood Suggestions — compact */}
              <section className="hub-card mood-card">
                <div className="card-header">
                  <h2 className="card-title">Suggestions</h2>
                  <span className="card-badge" style={{ textTransform: 'capitalize' }}>{mood}</span>
                </div>
                <div className="mood-suggestions">
                  {mood === 'productive' && (
                    <p><Icon name="bolt" size={16} /> Try Pomodoro — library is quiet right now</p>
                  )}
                  {mood === 'chill' && (
                    <p><Icon name="self_improvement" size={16} /> Cafe has 20% off — botanical garden is peaceful</p>
                  )}
                  {mood === 'stressed' && (
                    <p><Icon name="psychology" size={16} /> Take 5 min — counseling center: Room 101</p>
                  )}
                  {mood === 'social' && (
                    <p><Icon name="diversity_3" size={16} /> 3 study groups active — band night at 7 PM</p>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
