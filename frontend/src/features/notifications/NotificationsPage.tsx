import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { db, type CachedNotification } from "@/services/db";
import {
  createLocalAlert,
  enablePushAlerts,
  getPushPermissionState,
  type PushPermissionState
} from "@/services/notifications/pushAlerts";
import styles from "./NotificationsPage.module.css";

const defaultNotifications: CachedNotification[] = [
  {
    id: "welcome",
    title: "Welcome",
    message: "You can read notifications offline after first load.",
    level: "success",
    read: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "offline-tips",
    title: "Offline Tip",
    message: "Submit work offline and sync once connectivity returns.",
    level: "accent",
    read: false,
    createdAt: new Date(Date.now() - 3600_000).toISOString()
  },
  {
    id: "grade-post",
    title: "Grade Posted",
    message: "CS101 grades are available now. Open Results to review your score.",
    level: "success",
    read: false,
    createdAt: new Date(Date.now() - 90 * 60_000).toISOString()
  },
  {
    id: "campus-emergency-drill",
    title: "Emergency Alert",
    message: "Campus drill at 17:00. Follow official safety guidance and assembly points.",
    level: "warning",
    read: false,
    createdAt: new Date(Date.now() - 20 * 60_000).toISOString()
  }
];

function sortNotifications(rows: CachedNotification[]): CachedNotification[] {
  return [...rows].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

/**
 * Local-first notifications center with read-state controls.
 */
export default function NotificationsPage() {
  const [items, setItems] = useState<CachedNotification[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [pushPermission, setPushPermission] = useState<PushPermissionState>("unsupported");
  const [pushMessage, setPushMessage] = useState("");
  const [pushBusy, setPushBusy] = useState(false);

  const loadNotifications = async () => {
    const current = await db.notifications.toArray();
    const existingIds = new Set(current.map((row) => row.id));
    const missingSeedRows = defaultNotifications.filter((item) => !existingIds.has(item.id));
    if (missingSeedRows.length > 0) {
      await db.notifications.bulkPut(missingSeedRows);
    }
    const nextRows = await db.notifications.toArray();
    setItems(sortNotifications(nextRows));
  };

  useEffect(() => {
    void loadNotifications();
    setPushPermission(getPushPermissionState());
  }, []);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);
  const visibleItems = showUnreadOnly ? items.filter((item) => !item.read) : items;

  const markRead = async (notification: CachedNotification) => {
    if (notification.read) {
      return;
    }
    await db.notifications.put({
      ...notification,
      read: true
    });
    await loadNotifications();
  };

  const markAllRead = async () => {
    if (items.length === 0) {
      return;
    }
    await db.notifications.bulkPut(items.map((item) => ({ ...item, read: true })));
    await loadNotifications();
  };

  const clearRead = async () => {
    const readIds = items.filter((item) => item.read).map((item) => item.id);
    await db.notifications.bulkDelete(readIds);
    await loadNotifications();
  };

  const onEnablePushAlerts = async () => {
    setPushBusy(true);
    try {
      const result = await enablePushAlerts();
      setPushPermission(result.permission);
      setPushMessage(result.detail);
    } finally {
      setPushBusy(false);
    }
  };

  const onSendTestAlert = async () => {
    await createLocalAlert("Test Alert", "Push alert pipeline is active for this device.", "accent");
    setPushMessage("Test alert sent.");
    await loadNotifications();
  };

  return (
    <section className={styles.stack}>
      <Card>
        <h2>Notifications</h2>
        <p>Unread: {unreadCount}</p>
        <p className={styles.pushState}>Push permission: {pushPermission}</p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => void onEnablePushAlerts()} loading={pushBusy}>
            Enable Push Alerts
          </Button>
          <Button variant="secondary" onClick={() => void onSendTestAlert()} disabled={pushBusy}>
            Send Test Alert
          </Button>
          <Button variant="secondary" onClick={() => setShowUnreadOnly((value) => !value)}>
            {showUnreadOnly ? "Show All" : "Show Unread"}
          </Button>
          <Button variant="text" onClick={() => void markAllRead()}>
            Mark All Read
          </Button>
          <Button variant="text" onClick={() => void clearRead()}>
            Clear Read
          </Button>
        </div>
        {pushMessage ? <p className={styles.pushState}>{pushMessage}</p> : null}
      </Card>

      {visibleItems.length === 0 ? (
        <Card>
          <p>No notifications in this view.</p>
        </Card>
      ) : null}

      {visibleItems.map((item) => (
        <Card key={item.id}>
          <div className={styles.header}>
            <div>
              <h3>{item.title}</h3>
              <p className={styles.date}>{new Date(item.createdAt).toLocaleString()}</p>
            </div>
            <Badge color={item.level} text={item.read ? "Read" : "Unread"} />
          </div>
          <p>{item.message}</p>
          {!item.read ? (
            <Button variant="secondary" onClick={() => void markRead(item)}>
              Mark Read
            </Button>
          ) : null}
        </Card>
      ))}
    </section>
  );
}
