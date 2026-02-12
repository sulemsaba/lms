import { useCallback } from "react";
import { createIdempotencyKey } from "@/utils/id";

/**
 * Generates idempotency keys tied to a domain entity.
 */
export function useIdempotency(entity = "generic") {
  const generateKey = useCallback(() => createIdempotencyKey(entity), [entity]);
  return { generateKey };
}
