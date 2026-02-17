import { db, type CachedNotification } from "@/services/db";
import { generateUuid } from "@/utils/id";

export type PushPermissionState = NotificationPermission | "unsupported";

export interface EnablePushAlertsResult {
  permission: PushPermissionState;
  subscribed: boolean;
  detail: string;
}

const VAPID_PUBLIC_KEY = ((import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY as string | undefined) ?? "").trim();

const supportsPushApis = (): boolean =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

const base64UrlToUint8Array = (value: string): Uint8Array => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(normalized);
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
};

export function getPushPermissionState(): PushPermissionState {
  if (!supportsPushApis()) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function enablePushAlerts(): Promise<EnablePushAlertsResult> {
  if (!supportsPushApis()) {
    return {
      permission: "unsupported",
      subscribed: false,
      detail: "This browser does not support push notifications."
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return {
      permission,
      subscribed: false,
      detail: "Push alerts were not enabled. Grant notification permission to continue."
    };
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    return {
      permission,
      subscribed: true,
      detail: "Push alerts already enabled on this device."
    };
  }

  if (!VAPID_PUBLIC_KEY) {
    return {
      permission,
      subscribed: false,
      detail: "Permission granted. Add VITE_WEB_PUSH_PUBLIC_KEY to enable remote push delivery."
    };
  }

  try {
    await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(VAPID_PUBLIC_KEY)
    });
    return {
      permission,
      subscribed: true,
      detail: "Push alerts enabled successfully."
    };
  } catch {
    return {
      permission,
      subscribed: false,
      detail: "Permission granted, but push subscription failed. Check VAPID key and HTTPS configuration."
    };
  }
}

export async function createLocalAlert(
  title: string,
  message: string,
  level: CachedNotification["level"] = "accent"
): Promise<void> {
  const now = new Date().toISOString();
  const notification: CachedNotification = {
    id: `local-alert-${generateUuid()}`,
    title,
    message,
    level,
    read: false,
    createdAt: now
  };

  await db.notifications.put(notification);

  if (!supportsPushApis() || Notification.permission !== "granted") {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.showNotification(title, {
        body: message,
        tag: notification.id
      });
    } else {
      new Notification(title, { body: message, tag: notification.id });
    }
  } catch {
    // Ignore browser notification failures; local persistence already succeeded.
  }
}
