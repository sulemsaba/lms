import { useMemo, type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { buildStudentFeaturePaths, getLandingPath } from "@/features/auth/roleAccess";
import {
  selectEffectivePermissions,
  selectEffectiveRoleCodes,
  useAuthStore
} from "@/stores/authStore";

interface RequireFeatureAccessProps {
  featurePath: string;
  children: ReactElement;
}

/**
 * Restricts route access to modules available in the current role experience.
 */
export default function RequireFeatureAccess({ featurePath, children }: RequireFeatureAccessProps) {
  const roleCodes = useAuthStore(selectEffectiveRoleCodes);
  const permissions = useAuthStore(selectEffectivePermissions);
  const allowed = useMemo(() => new Set(buildStudentFeaturePaths(roleCodes, permissions)), [permissions, roleCodes]);

  if (!allowed.has(featurePath)) {
    return <Navigate to={getLandingPath(roleCodes, permissions)} replace />;
  }

  return children;
}
