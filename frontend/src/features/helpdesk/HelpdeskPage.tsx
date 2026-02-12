import { useState } from "react";
import Button from "@/components/ui/Button";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import styles from "./HelpdeskPage.module.css";

/**
 * Helpdesk ticket creation with offline queue fallback.
 */
export default function HelpdeskPage() {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const { addAction } = useOfflineQueue();

  const onSubmit = async () => {
    await addAction({
      id: "ticket",
      entity: "helpdesk",
      action: "create_ticket",
      payload: { title, details },
      idempotencyKey: `helpdesk-${Date.now()}`
    });
    setMessage("Ticket saved offline and queued for sync.");
    setTitle("");
    setDetails("");
  };

  return (
    <section>
      <h2>Helpdesk</h2>
      <div className={styles.form}>
        <input
          className={styles.input}
          placeholder="Ticket title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          className={styles.textarea}
          placeholder="Describe the issue"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
        />
        <Button onClick={() => void onSubmit()}>Create Ticket</Button>
      </div>
      <p>{message}</p>
    </section>
  );
}
