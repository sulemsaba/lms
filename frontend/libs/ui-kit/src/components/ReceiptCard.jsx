export default function ReceiptCard({ state = "online", receiptId, submissionRef, timestamp }) {
  const statusLabel = state === "offline" ? "Saved Offline" : "Synced";

  return (
    <article className="receipt-card" data-state={state} aria-label="Submission receipt">
      <header className="receipt-header">
        <h3>Submission Receipt</h3>
        <span className="status" aria-live="polite">
          {statusLabel}
        </span>
      </header>

      <dl className="receipt-grid">
        <div>
          <dt>Receipt ID</dt>
          <dd>{receiptId}</dd>
        </div>
        <div>
          <dt>Submission Ref</dt>
          <dd>{submissionRef}</dd>
        </div>
        <div>
          <dt>Timestamp</dt>
          <dd>{timestamp}</dd>
        </div>
      </dl>
    </article>
  );
}
