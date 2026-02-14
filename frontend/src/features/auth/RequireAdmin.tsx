import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { canAccessAdminArea } from "@/features/auth/roleAccess";
import { useAuthStore } from "@/stores/authStore";

interface RequireAdminProps {
  children: ReactElement;
}

/**
 * Restricts admin routes to users with admin roles/permissions.
 */
export default function RequireAdmin({ children }: RequireAdminProps) {
  const roleCodes = useAuthStore((state) => state.roleCodes);
  const permissions = useAuthStore((state) => state.permissions);

  if (!canAccessAdminArea(roleCodes, permissions)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
