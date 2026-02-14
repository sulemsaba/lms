import { apiClient } from "@/services/api/client";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginPayload {
  email: string;
  password: string;
  institutionId: string;
}

interface LoginRequestBody {
  email: string;
  password: string;
  institution_code: string;
}

export interface RoleBindingRead {
  role_code: string;
  scope_type: string;
  scope_id: string | null;
  active: boolean;
}

export interface CurrentAuthzResponse {
  user_id: string;
  institution_id: string;
  roles: RoleBindingRead[];
  permissions: string[];
}

export async function loginWithPassword(payload: LoginPayload): Promise<TokenPair> {
  const body: LoginRequestBody = {
    email: payload.email,
    password: payload.password,
    institution_code: "UDSM"
  };
  const response = await apiClient.post<TokenPair>("/auth/sso/callback", body, {
    headers: { "x-institution-id": payload.institutionId }
  });
  return response.data;
}

export async function fetchMyAuthorization(institutionId: string): Promise<CurrentAuthzResponse> {
  const response = await apiClient.get<CurrentAuthzResponse>("/rbac/me", {
    headers: { "x-institution-id": institutionId }
  });
  return response.data;
}
