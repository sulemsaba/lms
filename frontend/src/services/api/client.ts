import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig
} from "axios";
import { useAuthStore } from "@/stores/authStore";
import { createIdempotencyKey } from "@/utils/id";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "https://api.hub.udsm.ac.tz";

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

  const method = next.method?.toLowerCase();
  const isMutation = method === "post" || method === "put" || method === "patch" || method === "delete";

  if (isMutation && !next.headers.get("x-idempotency-key")) {
    next.headers.set("x-idempotency-key", createIdempotencyKey("request"));
  }

  return next;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  }
);
