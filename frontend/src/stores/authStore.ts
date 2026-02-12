import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  deviceId: string | null;
  offlinePinHash: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  registerDevice: (deviceId: string) => void;
  setOfflinePin: (pin: string) => void;
  verifyOfflinePin: (pin: string) => boolean;
}

function hashPin(pin: string): string {
  return btoa(`udsm:${pin}`);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      deviceId: null,
      offlinePinHash: null,
      isAuthenticated: false,
      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true
        }),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        }),
      registerDevice: (deviceId) => set({ deviceId }),
      setOfflinePin: (pin) => set({ offlinePinHash: hashPin(pin) }),
      verifyOfflinePin: (pin) => get().offlinePinHash === hashPin(pin)
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
