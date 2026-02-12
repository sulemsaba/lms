import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/authStore";
import { createIdempotencyKey } from "@/utils/id";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "https://api.hub.udsm.ac.tz";

export const apiClient = axios.create({
  baseURL,
  timeout: 15000
});

apiClient.interceptors.request.use((config: AxiosRequestConfig) => {
  const next = { ...config };
  const authState = useAuthStore.getState();

  if (!next.headers) {
    next.headers = {};
  }

  if (authState.accessToken) {
    next.headers.Authorization = `Bearer ${authState.accessToken}`;
  }

  const method = next.method?.toLowerCase();
  const isMutation = method === "post" || method === "put" || method === "patch" || method === "delete";

  if (isMutation && !next.headers["x-idempotency-key"]) {
    next.headers["x-idempotency-key"] = createIdempotencyKey("request");
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
