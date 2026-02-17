import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { attemptBeaconAutoCheckIn } from "@/services/attendance/checkIn";
import { fetchTimetableEvents, type TimetableListItem } from "@/services/api/timetableApi";
import { createLocalAlert } from "@/services/notifications/pushAlerts";
import styles from "./TimetablePage.module.css";

/**
 * Weekly timetable with venue context.
 */
export default function TimetablePage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimetableListItem[]>([]);
  const [sourceLabel, setSourceLabel] = useState("");
  const [autoCheckInEnabled, setAutoCheckInEnabled] = useState(false);
  const [beaconBusy, setBeaconBusy] = useState(false);
  const [beaconStatus, setBeaconStatus] = useState("");

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

  const requestCurrentPosition = (): Promise<[number, number]> =>
    new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Location services are unavailable in this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve([position.coords.latitude, position.coords.longitude]),
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 45_000 }
      );
    });

  const runBeaconCheck = useCallback(async () => {
    if (events.length === 0) {
      setBeaconStatus("No timetable events available for check-in.");
      return;
    }

    setBeaconBusy(true);
    try {
      const currentPosition = await requestCurrentPosition();
      const result = await attemptBeaconAutoCheckIn(events, currentPosition);
      setBeaconStatus(result.message);

      if (result.status === "checked-in") {
        await createLocalAlert("Attendance Check-In", result.message, "success");
      }
    } catch {
      setBeaconStatus("Location permission denied or unavailable. Enable GPS to use auto check-in.");
    } finally {
      setBeaconBusy(false);
    }
  }, [events]);

  useEffect(() => {
    if (!autoCheckInEnabled) {
      return;
    }

    void runBeaconCheck();
    const interval = window.setInterval(() => {
      void runBeaconCheck();
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [autoCheckInEnabled, runBeaconCheck]);

  if (loading) {
    return <SkeletonLoader type="card" />;
  }

  return (
    <section className={styles.list}>
      <h2>Timetable</h2>
      {sourceLabel ? <p className={styles.hint}>{sourceLabel}</p> : null}
      <article className={styles.beaconPanel}>
        <h3>Beacon Auto Check-In</h3>
        <p>Enable automatic attendance check-in when you are near the class venue.</p>
        <div className={styles.beaconActions}>
          <Button
            onClick={() => setAutoCheckInEnabled((currentValue) => !currentValue)}
            disabled={beaconBusy}
          >
            {autoCheckInEnabled ? "Disable Auto Check-In" : "Enable Auto Check-In"}
          </Button>
          <Button variant="secondary" onClick={() => void runBeaconCheck()} loading={beaconBusy}>
            Check In Now
          </Button>
        </div>
        {beaconStatus ? <p className={styles.hint}>{beaconStatus}</p> : null}
      </article>
      {events.map((event) => (
        <article key={event.id} className={styles.item}>
          <strong>{event.label}</strong>
          <p>{event.detail}</p>
        </article>
      ))}
    </section>
  );
}
