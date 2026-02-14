import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  institutionId: string | null;
  deviceId: string | null;
  offlinePinHash: string | null;
  roleCodes: string[];
  permissions: string[];
  primaryRole: string | null;
  isAuthenticated: boolean;
  setSession: (payload: { accessToken: string; refreshToken: string; institutionId: string | null }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setInstitutionId: (institutionId: string) => void;
  setAuthorization: (roleCodes: string[], permissions: string[]) => void;
  clearAuth: () => void;
  registerDevice: (deviceId: string) => void;
  setOfflinePin: (pin: string) => void;
  verifyOfflinePin: (pin: string) => boolean;
}

function hashPin(pin: string): string {
  return btoa(`udsm:${pin}`);
}

function getPrimaryRole(roleCodes: string[]): string | null {
  return roleCodes[0] ?? null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      institutionId: null,
      deviceId: null,
      offlinePinHash: null,
      roleCodes: [],
      permissions: [],
      primaryRole: null,
      isAuthenticated: false,
      setSession: ({ accessToken, refreshToken, institutionId }) =>
        set({
          accessToken,
          refreshToken,
          institutionId,
          isAuthenticated: true
        }),
      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          institutionId: get().institutionId,
          isAuthenticated: true
        }),
      setInstitutionId: (institutionId) => set({ institutionId }),
      setAuthorization: (roleCodes, permissions) =>
        set({
          roleCodes,
          permissions,
          primaryRole: getPrimaryRole(roleCodes)
        }),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          institutionId: null,
          roleCodes: [],
          permissions: [],
          primaryRole: null,
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
