export interface JwtPayload {
  sub?: string;
  institution_id?: string;
  [key: string]: unknown;
}

export function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  const payload = parts[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);

  try {
    const decoded = atob(`${base64}${padding}`);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}
