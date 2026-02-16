import { useMemo, useState } from "react";
import ReceiptCard from "../../../libs/ui-kit/src/components/ReceiptCard.jsx";

export default function App() {
  const [isOffline] = useState(false);
  const [queueDepth] = useState(0);
  const [lastSync] = useState("not yet");

  const status = useMemo(() => (isOffline ? "Offline" : "Online"), [isOffline]);

  return (
    <main className="app-shell" aria-label="Student Hub Home">
      <header className="top-bar">
        <h1>UDSM Student Hub</h1>
        <p>Offline-first LMS shell initialized</p>
      </header>

      <section className="offline-banner" aria-live="polite">
        Legacy prototype view. Run <strong>frontend</strong> app for full UI: <code>cd frontend && npm run dev</code>
      </section>

      {isOffline && (
        <section className="offline-banner" aria-live="polite">
          You are offline. Changes are saved and will sync when connected.
        </section>
      )}

      <div className="dashboard-grid">
        <section className="status-card" aria-live="polite">
          <h2>Sync Health</h2>
          <p>
            Status: <strong>{status}</strong>
          </p>
          <p>Queue depth: {queueDepth}</p>
          <p>Last sync: {lastSync}</p>
        </section>

        <section className="receipt-section">
          <h2>Latest Receipt</h2>
          <ReceiptCard
            state={isOffline ? "offline" : "online"}
            receiptId="UDSM-2026-000001"
            submissionRef="ASM-DSA-1001"
            timestamp="2026-02-13T08:30:00Z"
          />
        </section>
      </div>

      <nav className="bottom-nav" aria-label="Primary Navigation">
        <button type="button">Home</button>
        <button type="button">Courses</button>
        <button type="button">Assessments</button>
        <button type="button">Timetable</button>
        <button type="button">Helpdesk</button>
        <button type="button">Map</button>
        <button type="button">Profile</button>
      </nav>
    </main>
  );
}
