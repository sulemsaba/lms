import { useEffect, useState } from "react";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { fetchTimetableEvents, type TimetableListItem } from "@/services/api/timetableApi";
import styles from "./TimetablePage.module.css";

/**
 * Weekly timetable with venue context.
 */
export default function TimetablePage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimetableListItem[]>([]);
  const [sourceLabel, setSourceLabel] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const result = await fetchTimetableEvents();
      if (!mounted) {
        return;
      }
      setEvents(result.events);
      if (result.source === "cache") {
        setSourceLabel("Showing cached timetable (offline mode).");
      } else if (result.source === "fallback") {
        setSourceLabel("Showing built-in timetable. Connect once to cache your events.");
      } else {
        setSourceLabel("");
      }
      setLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <SkeletonLoader type="card" />;
  }

  return (
    <section className={styles.list}>
      <h2>Timetable</h2>
      {sourceLabel ? <p className={styles.hint}>{sourceLabel}</p> : null}
      {events.map((event) => (
        <article key={event.id} className={styles.item}>
          <strong>{event.label}</strong>
          <p>{event.detail}</p>
        </article>
      ))}
    </section>
  );
}
