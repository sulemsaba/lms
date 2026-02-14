import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { db, type CachedNotification } from "@/services/db";
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

  const loadNotifications = async () => {
    const current = await db.notifications.toArray();
    if (current.length === 0) {
      await db.notifications.bulkPut(defaultNotifications);
      setItems(sortNotifications(defaultNotifications));
      return;
    }
    setItems(sortNotifications(current));
  };

  useEffect(() => {
    void loadNotifications();
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

  return (
    <section className={styles.stack}>
      <Card>
        <h2>Notifications</h2>
        <p>Unread: {unreadCount}</p>
        <div className={styles.actions}>
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
