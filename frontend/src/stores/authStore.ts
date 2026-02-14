import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  institutionId: string | null;
  deviceId: string | null;
  offlinePinHash: string | null;
  roleCodes: string[];
  permissions: string[];
  primaryRole: string | null;
  impersonatedRoleCode: string | null;
  impersonatedPermissions: string[];
  isAuthenticated: boolean;
  setSession: (payload: { accessToken: string; refreshToken: string; institutionId: string | null }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setInstitutionId: (institutionId: string) => void;
  setAuthorization: (roleCodes: string[], permissions: string[]) => void;
  startImpersonation: (roleCode: string, permissions: string[]) => void;
  stopImpersonation: () => void;
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

export function selectEffectiveRoleCodes(state: AuthState): string[] {
  return state.impersonatedRoleCode ? [state.impersonatedRoleCode] : state.roleCodes;
}

export function selectEffectivePermissions(state: AuthState): string[] {
  return state.impersonatedRoleCode ? state.impersonatedPermissions : state.permissions;
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
      impersonatedRoleCode: null,
      impersonatedPermissions: [],
      isAuthenticated: false,
      setSession: ({ accessToken, refreshToken, institutionId }) =>
        set({
          accessToken,
          refreshToken,
          institutionId,
          impersonatedRoleCode: null,
          impersonatedPermissions: [],
          isAuthenticated: true
        }),
      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          institutionId: get().institutionId,
          impersonatedRoleCode: null,
          impersonatedPermissions: [],
          isAuthenticated: true
        }),
      setInstitutionId: (institutionId) => set({ institutionId }),
      setAuthorization: (roleCodes, permissions) =>
        set({
          roleCodes,
          permissions,
          primaryRole: getPrimaryRole(roleCodes),
          impersonatedRoleCode: null,
          impersonatedPermissions: []
        }),
      startImpersonation: (roleCode, permissions) =>
        set({
          impersonatedRoleCode: roleCode,
          impersonatedPermissions: permissions
        }),
      stopImpersonation: () =>
        set({
          impersonatedRoleCode: null,
          impersonatedPermissions: []
        }),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          institutionId: null,
          roleCodes: [],
          permissions: [],
          primaryRole: null,
          impersonatedRoleCode: null,
          impersonatedPermissions: [],
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
