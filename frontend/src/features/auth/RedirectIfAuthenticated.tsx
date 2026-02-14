import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { getLandingPath } from "@/features/auth/roleAccess";
import { useAuthStore } from "@/stores/authStore";

interface RedirectIfAuthenticatedProps {
  children: ReactElement;
}

/**
 * Redirects authenticated users away from auth pages to their role landing page.
 */
export default function RedirectIfAuthenticated({ children }: RedirectIfAuthenticatedProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const roleCodes = useAuthStore((state) => state.roleCodes);
  const permissions = useAuthStore((state) => state.permissions);

  if (isAuthenticated) {
    return <Navigate to={getLandingPath(roleCodes, permissions)} replace />;
  }

  return children;
}
