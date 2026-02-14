import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { refreshSyncQueueMetrics, syncWithExponentialBackoff } from "@/services/sync/backgroundSync";
import { db, type OfflineAction } from "@/services/db";
import styles from "./QueueManagerPage.module.css";

function sortActions(actions: OfflineAction[]): OfflineAction[] {
  return [...actions].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

/**
 * Offline queue operations console for manual recovery and troubleshooting.
 */
export default function QueueManagerPage() {
  const [actions, setActions] = useState<OfflineAction[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadActions = async () => {
    const rows = await db.offlineActions.toArray();
    setActions(sortActions(rows));
    await refreshSyncQueueMetrics();
  };

  useEffect(() => {
    void loadActions();
  }, []);

  const counts = useMemo(() => {
    const pending = actions.filter((item) => item.syncStatus === "pending").length;
    const failed = actions.filter((item) => item.syncStatus === "failed").length;
    const syncing = actions.filter((item) => item.syncStatus === "syncing").length;
    return { pending, failed, syncing, total: actions.length };
  }, [actions]);

  const onSyncNow = async () => {
    setBusy(true);
    setMessage("");
    try {
      await syncWithExponentialBackoff();
      setMessage("Sync completed. Queue metrics updated.");
      await loadActions();
    } catch {
      setMessage("Sync attempt failed. Failed records remain available for retry.");
    } finally {
      setBusy(false);
    }
  };

  const onRetryFailed = async () => {
    const failed = actions.filter((item) => item.syncStatus === "failed");
    if (failed.length === 0) {
      setMessage("No failed records to retry.");
      return;
    }

    await db.offlineActions.bulkPut(
      failed.map((item) => ({
        ...item,
        syncStatus: "pending"
      }))
    );
    setMessage(`${failed.length} failed records moved back to pending.`);
    await loadActions();
  };

  const onClearFailed = async () => {
    const failedIds = actions
      .filter((item) => item.syncStatus === "failed")
      .map((item) => item.id)
      .filter((id): id is string => typeof id === "string");

    if (failedIds.length === 0) {
      setMessage("No failed records to clear.");
      return;
    }

    await db.offlineActions.bulkDelete(failedIds);
    setMessage(`${failedIds.length} failed records removed from queue.`);
    await loadActions();
  };

  return (
    <section className={styles.stack}>
      <Card>
        <h2>Queue Manager</h2>
        <p>Pending: {counts.pending} | Failed: {counts.failed} | Syncing: {counts.syncing}</p>
        <div className={styles.actions}>
          <Button onClick={() => void onSyncNow()} loading={busy}>
            Sync Now
          </Button>
          <Button variant="secondary" onClick={() => void onRetryFailed()} disabled={busy}>
            Retry Failed
          </Button>
          <Button variant="text" onClick={() => void onClearFailed()} disabled={busy}>
            Clear Failed
          </Button>
          <Button variant="text" onClick={() => void loadActions()} disabled={busy}>
            Refresh
          </Button>
        </div>
        {message ? <p className={styles.message}>{message}</p> : null}
      </Card>

      {counts.total === 0 ? (
        <Card>
          <p>Queue is empty.</p>
        </Card>
      ) : null}

      {actions.map((action) => (
        <Card key={action.id}>
          <div className={styles.itemHeader}>
            <div>
              <h3>
                {action.entity} / {action.action}
              </h3>
              <p className={styles.meta}>
                {action.createdAt.toLocaleString()} | retries: {action.retryCount}
              </p>
            </div>
            <Badge
              color={
                action.syncStatus === "pending"
                  ? "warning"
                  : action.syncStatus === "failed"
                    ? "error"
                    : "accent"
              }
              text={action.syncStatus}
            />
          </div>
          <pre className={styles.payload}>{JSON.stringify(action.payload, null, 2)}</pre>
        </Card>
      ))}
    </section>
  );
}
