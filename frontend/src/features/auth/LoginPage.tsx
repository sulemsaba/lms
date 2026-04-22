import { isAxiosError } from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
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
  const [offlinePin, setOfflinePin] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemoMode, setShowDemoMode] = useState(false);
  const [showOfflineMode, setShowOfflineMode] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const setAuthorization = useAuthStore((state) => state.setAuthorization);
  const registerDevice = useAuthStore((state) => state.registerDevice);
  const roleCodes = useAuthStore((state) => state.roleCodes);
  const permissions = useAuthStore((state) => state.permissions);
  const verifyOfflinePin = useAuthStore((state) => state.verifyOfflinePin);
  const unlockOfflineSession = useAuthStore((state) => state.unlockOfflineSession);
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

  const onOfflineUnlock = () => {
    if (!offlinePin) {
      setFeedback("Enter your offline PIN first.");
      return;
    }

    if (!verifyOfflinePin(offlinePin)) {
      setFeedback("Offline PIN does not match this device.");
      return;
    }

    unlockOfflineSession();
    const effectiveRoles = roleCodes.length > 0 ? roleCodes : [demoRole];
    navigate(getLandingPath(effectiveRoles, permissions), { replace: true });
  };

  return (
    <div className={styles.page}>
      <div className={styles.loginContainer}>
        {/* Branding */}
        <div className={styles.branding}>
          <div className={styles.logoIcon}>
            <span className="material-symbols-rounded" style={{ fontSize: 36 }}>school</span>
          </div>
          <h1 className={styles.title}>Student Hub</h1>
          <p className={styles.subtitle}>Sign in to your institutional account</p>
        </div>

        {/* Main Sign-In Form */}
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            void onSignIn();
          }}
        >
          <div className={styles.field}>
            <label htmlFor="email" className={styles.fieldLabel}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>mail</span>
              Email
            </label>
            <input
              id="email"
              className={styles.input}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@udsm.ac.tz"
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.fieldLabel}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>lock</span>
              Password
            </label>
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="institutionId" className={styles.fieldLabel}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>business</span>
              Institution ID
            </label>
            <input
              id="institutionId"
              className={styles.input}
              value={institutionId}
              onChange={(event) => setInstitutionId(event.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
            />
          </div>

          <Button fullWidth onClick={() => void onSignIn()} loading={loading}>
            Sign In
          </Button>

          {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
        </form>

        {/* Divider */}
        <div className={styles.divider}>
          <span>or</span>
        </div>

        {/* Alternative Actions */}
        <div className={styles.altActions}>
          <button
            className={styles.altActionBtn}
            type="button"
            onClick={() => {
              setShowDemoMode(!showDemoMode);
              setShowOfflineMode(false);
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>play_circle</span>
            Continue in Demo Mode
          </button>

          <button
            className={styles.altActionBtn}
            type="button"
            onClick={() => {
              setShowOfflineMode(!showOfflineMode);
              setShowDemoMode(false);
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>offline_pin</span>
            Offline Access
          </button>
        </div>

        {/* Demo Mode Panel */}
        {showDemoMode && (
          <div className={styles.expandedPanel}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>badge</span>
                Select Role
              </label>
              <select
                className={styles.input}
                value={demoRole}
                onChange={(event) => setDemoRole(event.target.value)}
              >
                {demoRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="secondary" fullWidth onClick={onDemoMode}>
              Enter as {demoRole.replace("_", " ")}
            </Button>
          </div>
        )}

        {/* Offline Mode Panel */}
        {showOfflineMode && (
          <div className={styles.expandedPanel}>
            <div className={styles.field}>
              <label htmlFor="offlinePin" className={styles.fieldLabel}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>pin</span>
                Offline PIN
              </label>
              <input
                id="offlinePin"
                className={styles.input}
                type="password"
                value={offlinePin}
                onChange={(event) => setOfflinePin(event.target.value)}
                placeholder="Enter your offline PIN"
              />
            </div>
            <Button variant="text" fullWidth onClick={onOfflineUnlock}>
              Unlock Offline Session
            </Button>
          </div>
        )}

        {/* Footer */}
        <p className={styles.footer}>
          Access is routed by your assigned institutional role.
        </p>
      </div>
    </div>
  );
}
