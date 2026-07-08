import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig
} from "axios";
import { useAuthStore } from "@/stores/authStore";
import { createIdempotencyKey } from "@/utils/id";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "https://api.hub.udsm.ac.tz";
const envInstitutionId = import.meta.env.VITE_INSTITUTION_ID as string | undefined;

export const apiClient = axios.create({
  baseURL,
  timeout: 15000
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const next = config;
  const authState = useAuthStore.getState();

  if (!next.headers) {
    next.headers = new AxiosHeaders();
  } else if (!(next.headers instanceof AxiosHeaders)) {
    next.headers = AxiosHeaders.from(next.headers);
  }

  if (authState.accessToken) {
    next.headers.set("Authorization", `Bearer ${authState.accessToken}`);
  }

  const institutionId = authState.institutionId ?? envInstitutionId;
  if (institutionId && !next.headers.get("x-institution-id")) {
    next.headers.set("x-institution-id", institutionId);
  }

  const method = next.method?.toLowerCase();
  const isMutation = method === "post" || method === "put" || method === "patch" || method === "delete";

  if (isMutation && !next.headers.get("x-idempotency-key")) {
    next.headers.set("x-idempotency-key", createIdempotencyKey("request"));
  }

  return next;
});

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
  if (!refreshToken) {
    clearAuth();
    return null;
  }
  try {
    // Bare axios call: must skip the interceptors so a failed refresh can't loop.
    const response = await axios.post<RefreshResponse>(
      `${baseURL}/auth/refresh`,
      { refresh_token: refreshToken },
      { timeout: 15000 }
    );
    setTokens(response.data.access_token, response.data.refresh_token);
    return response.data.access_token;
  } catch {
    clearAuth();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (error.response?.status !== 401 || !original || original._retried) {
      return Promise.reject(error);
    }

    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    const newToken = await refreshPromise;
    if (!newToken) {
      return Promise.reject(error);
    }

    original._retried = true;
    original.headers = AxiosHeaders.from(original.headers);
    original.headers.set("Authorization", `Bearer ${newToken}`);
    return apiClient.request(original);
  }
);
