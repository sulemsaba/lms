/**
 * Returns true when browser connectivity is unavailable.
 */
export function isOffline(): boolean {
  return typeof navigator !== "undefined" ? !navigator.onLine : false;
}
