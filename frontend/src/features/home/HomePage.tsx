import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "@/components/ui/Card";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { useSyncStore } from "@/stores/syncStore";
import styles from "./HomePage.module.css";

const moduleLinks = [
  { label: "Courses", path: "/courses" },
  { label: "Assessments", path: "/assessments" },
  { label: "Timetable", path: "/timetable" },
  { label: "Helpdesk", path: "/helpdesk" },
  { label: "Tasks", path: "/tasks" },
  { label: "Notifications", path: "/notifications" },
  { label: "Queue Manager", path: "/queue-manager" },
  { label: "Map", path: "/map" },
  { label: "Profile", path: "/profile" }
];

/**
 * Home dashboard with schedule and offline-aware state.
 */
export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const syncStatus = useSyncStore((state) => state.syncStatus);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 350);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return <SkeletonLoader type="card" />;
  }

  return (
    <div className={styles.stack}>
      <Card>
        <h2>Today's Schedule</h2>
        <p>CS101 - Lecture Hall 1, 10:00 AM</p>
        <p>DB202 - COICT Lab 3, 2:00 PM</p>
      </Card>
      <Card>
        <h2>Upcoming Deadline</h2>
        <p>Algorithm Analysis Report due tomorrow at 23:59.</p>
        <p className={styles.muted}>Network status: {syncStatus}</p>
      </Card>
      <Card>
        <h2>Explore Modules</h2>
        <div className={styles.moduleGrid}>
          {moduleLinks.map((item) => (
            <Link key={item.path} to={item.path} className={styles.moduleLink}>
              {item.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
