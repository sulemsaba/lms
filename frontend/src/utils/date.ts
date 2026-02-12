import { format, formatDistanceToNow } from "date-fns";

/**
 * Formats an ISO timestamp into a readable local date-time string.
 */
export function formatDateTime(timestamp: string): string {
  return format(new Date(timestamp), "PPpp");
}

/**
 * Returns relative time (for sync freshness and activity labels).
 */
export function relativeFromNow(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}
