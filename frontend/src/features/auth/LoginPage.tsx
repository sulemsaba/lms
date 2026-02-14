import { isAxiosError } from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getLandingPath } from "@/features/auth/roleAccess";
import { fetchMyAuthorization, loginWithPassword } from "@/services/api/authApi";
import { useAuthStore } from "@/stores/authStore";
import { parseJwtPayload } from "@/utils/jwt";
import styles from "./LoginPage.module.css";

const defaultDemoInstitutionId = "00000000-0000-0000-0000-000000000000";
const demoRoles = [
  "student",
  "lecturer",
  "ta",
  "external_examiner",
  "college_admin",
  "super_admin",
  "guest"
];

function toFriendlyAuthError(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) {
      return "Invalid credentials for this institution.";
    }
    if (status === 400) {
      return "Institution context is missing or invalid. Enter a valid institution UUID.";
    }
    return "Sign-in failed. Verify API URL, institution ID, and user credentials.";
  }

  return "Sign-in failed due to an unexpected error.";
}

/**
 * Login flow supporting both RBAC API auth and explicit demo-role mode.
 */
export default function LoginPage() {
  const envInstitutionId = (import.meta.env.VITE_INSTITUTION_ID as string | undefined) ?? "";
  const storedInstitutionId = useAuthStore((state) => state.institutionId);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institutionId, setInstitutionId] = useState(storedInstitutionId ?? envInstitutionId);
  const [demoRole, setDemoRole] = useState("student");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const setAuthorization = useAuthStore((state) => state.setAuthorization);
  const registerDevice = useAuthStore((state) => state.registerDevice);
  const navigate = useNavigate();

  const onSignIn = async () => {
    if (!email || !password) {
      setFeedback("Email and password are required.");
      return;
    }
    if (!institutionId) {
      setFeedback("Institution ID (UUID) is required.");
      return;
    }

    setLoading(true);
    setFeedback("");
    try {
      const tokenPair = await loginWithPassword({ email, password, institutionId });
      const tokenPayload = parseJwtPayload(tokenPair.access_token);
      const resolvedInstitutionId =
        typeof tokenPayload?.institution_id === "string" ? tokenPayload.institution_id : institutionId;

      setSession({
        accessToken: tokenPair.access_token,
        refreshToken: tokenPair.refresh_token,
        institutionId: resolvedInstitutionId
      });
      registerDevice(`device-${email}`);

      try {
        const authz = await fetchMyAuthorization(resolvedInstitutionId);
        const roleCodes = authz.roles.map((role) => role.role_code);
        setAuthorization(roleCodes, authz.permissions);
        navigate(getLandingPath(roleCodes, authz.permissions), { replace: true });
      } catch {
        setAuthorization([demoRole], []);
        setFeedback("Authenticated, but RBAC profile lookup failed. Using selected role view temporarily.");
        navigate(getLandingPath([demoRole], []), { replace: true });
      }
    } catch (error) {
      setFeedback(toFriendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const onDemoMode = () => {
    const fallbackInstitutionId = institutionId || envInstitutionId || defaultDemoInstitutionId;
    setSession({
      accessToken: "demo-access-token",
      refreshToken: "demo-refresh-token",
      institutionId: fallbackInstitutionId
    });
    setAuthorization([demoRole], []);
    registerDevice(`demo-${demoRole}`);
    navigate(getLandingPath([demoRole], []), { replace: true });
  };

  return (
    <Card>
      <div className={styles.stack}>
        <h2>Sign In</h2>
        <p>Use your institutional account. Access is routed by your assigned role.</p>

        <label className={styles.field}>
          <span>Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@udsm.ac.tz"
            autoComplete="username"
          />
        </label>

        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
        </label>

        <label className={styles.field}>
          <span>Institution ID (UUID)</span>
          <input
            value={institutionId}
            onChange={(event) => setInstitutionId(event.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
        </label>

        <label className={styles.field}>
          <span>Demo Role</span>
          <select value={demoRole} onChange={(event) => setDemoRole(event.target.value)}>
            {demoRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.actions}>
          <Button onClick={() => void onSignIn()} loading={loading}>
            Sign In
          </Button>
          <Button variant="secondary" onClick={onDemoMode} disabled={loading}>
            Continue In Demo Mode
          </Button>
        </div>

        {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
      </div>
    </Card>
  );
}
