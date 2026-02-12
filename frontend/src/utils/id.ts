/**
 * Generates a UUID compatible with offline idempotent operations.
 */
export function generateUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * Creates a deterministic idempotency key prefix per entity.
 */
export function createIdempotencyKey(entity: string): string {
  return `${entity}-${Date.now()}-${generateUuid()}`;
}
