import { Link } from "react-router-dom";
import Card from "@/components/ui/Card";
import { useAuthStore } from "@/stores/authStore";
import styles from "./ProfilePage.module.css";

/**
 * User settings, auth status, and data controls.
 */
export default function ProfilePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const deviceId = useAuthStore((state) => state.deviceId);

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
      </Card>
      <Card>
        <h2>Data Usage</h2>
        <p>Low-data mode is enabled for media and map resources.</p>
        <p>
          <Link to="/rbac-matrix">Open RBAC matrix</Link>
        </p>
      </Card>
    </div>
  );
}
