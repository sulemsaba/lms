import { Link, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatRoleLabel } from "@/features/auth/roleAccess";
import RoleSwitcherCard from "@/features/profile/RoleSwitcherCard";
import { selectEffectiveRoleCodes, useAuthStore } from "@/stores/authStore";
import styles from "./ProfilePage.module.css";

/**
 * User settings, auth status, and data controls.
 */
export default function ProfilePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const institutionId = useAuthStore((state) => state.institutionId);
  const deviceId = useAuthStore((state) => state.deviceId);
  const roleCodes = useAuthStore((state) => state.roleCodes);
  const effectiveRoleCodes = useAuthStore(selectEffectiveRoleCodes);
  const impersonatedRoleCode = useAuthStore((state) => state.impersonatedRoleCode);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const onSignOut = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className={styles.stack}>
      <Card>
        <h2>Profile</h2>
        <div className={styles.row}>
          <span>Session</span>
          <strong>{isAuthenticated ? "Authenticated" : "Guest"}</strong>
        </div>
        <div className={styles.row}>
          <span>Device ID</span>
          <strong>{deviceId ?? "Not registered"}</strong>
        </div>
        <div className={styles.row}>
          <span>Institution ID</span>
          <strong>{institutionId ?? "Not set"}</strong>
        </div>
        <div className={styles.row}>
          <span>Roles</span>
          <strong>{roleCodes.length > 0 ? roleCodes.map(formatRoleLabel).join(", ") : "Not loaded"}</strong>
        </div>
        <div className={styles.row}>
          <span>Effective Role</span>
          <strong>
            {effectiveRoleCodes.length > 0 ? formatRoleLabel(effectiveRoleCodes[0]) : "Not loaded"}
            {impersonatedRoleCode ? " (Impersonated)" : ""}
          </strong>
        </div>
      </Card>
      <RoleSwitcherCard />
      <Card>
        <h2>Data Usage</h2>
        <p>Low-data mode is enabled for media and map resources.</p>
        <p>
          <Link to="/rbac-matrix">Open RBAC matrix</Link>
        </p>
        <p>
          <Link to="/offline-pin">Open offline PIN page</Link>
        </p>
        <Button variant="text" onClick={onSignOut}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}
