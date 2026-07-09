import { isAxiosError } from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { getLandingPath } from "@/features/auth/roleAccess";
import { fetchMyAuthorization, loginWithPassword } from "@/services/api/authApi";
import { useAuthStore } from "@/stores/authStore";
import { parseJwtPayload } from "@/utils/jwt";

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
      return "Institution context is missing or invalid. Open \"Change institution\" below and enter a valid ID.";
    }
    return "Sign-in failed. Verify API URL, institution ID, and user credentials.";
  }

  return "Sign-in failed due to an unexpected error.";
}

const fieldClass =
  "w-full rounded-md border border-border bg-surface-hover px-3.5 py-3 text-sm text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none";
const labelClass = "mb-1.5 block text-xs font-semibold text-fg-muted";
const altCardClass =
  "flex w-full items-center gap-3 rounded-md border border-border bg-surface-hover px-3.5 py-3 text-left text-sm text-fg transition-colors duration-150 hover:border-primary";

type Panel = "none" | "demo" | "offline" | "institution";

/**
 * Sign-in with four visible entry modes: password (primary), demo role,
 * offline PIN, and institution switch — the UUID never blocks the happy path.
 */
export default function LoginPage() {
  const envInstitutionId = (import.meta.env.VITE_INSTITUTION_ID as string | undefined) ?? "";
  const storedInstitutionId = useAuthStore((state) => state.institutionId);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [institutionId, setInstitutionId] = useState(storedInstitutionId ?? envInstitutionId);
  const [demoRole, setDemoRole] = useState("student");
  const [offlinePin, setOfflinePin] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<Panel>("none");
  const setSession = useAuthStore((state) => state.setSession);
  const setAuthorization = useAuthStore((state) => state.setAuthorization);
  const registerDevice = useAuthStore((state) => state.registerDevice);
  const roleCodes = useAuthStore((state) => state.roleCodes);
  const permissions = useAuthStore((state) => state.permissions);
  const verifyOfflinePin = useAuthStore((state) => state.verifyOfflinePin);
  const unlockOfflineSession = useAuthStore((state) => state.unlockOfflineSession);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  const togglePanel = (next: Panel) => {
    setFeedback("");
    setPanel((current) => (current === next ? "none" : next));
  };

  const onSignIn = async () => {
    if (!email || !password) {
      setFeedback("Email and password are required.");
      return;
    }
    if (!institutionId) {
      setFeedback("No institution selected. Open \"Change institution\" below.");
      setPanel("institution");
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
        const codes = authz.roles.map((role) => role.role_code);
        setAuthorization(codes, authz.permissions);
        setUser({ name: email.split("@")[0], email });
        navigate(getLandingPath(codes, authz.permissions), { replace: true });
      } catch {
        setAuthorization([demoRole], []);
        setUser({ name: email.split("@")[0], email });
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
    setUser({ name: `${demoRole.replace("_", " ")} User`, email: `${demoRole}@demo.udsm.ac.tz` });
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
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between border-r border-border bg-surface p-11 lg:flex">
        <div className="flex items-center gap-2.5 text-sm font-bold text-fg">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-on-primary">
            <Icon name="school" size={16} />
          </span>
          Student Hub
        </div>
        <div>
          <h2 className="mb-3 text-3xl font-medium leading-tight text-fg [font-family:var(--font-display)] [text-wrap:balance]">
            Show up today.
            <br />
            Your streak is waiting.
          </h2>
          <p className="max-w-sm text-sm text-fg-muted">
            Courses, deadlines, focus sessions and progress — one calm place, online or off.
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-fg-muted">
          <span className="flex gap-1" aria-hidden="true">
            {["bg-primary-light", "bg-primary", "bg-primary", "bg-primary-light", "bg-primary", "bg-primary", "bg-primary-soft"].map(
              (tone, index) => (
                <i key={index} className={`h-2.5 w-2.5 rounded-[3px] ${tone}`} />
              )
            )}
          </span>
          your study week, at a glance
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-fg [font-family:var(--font-display)]">Welcome back</h1>
          <p className="mb-6 mt-1 text-sm text-fg-muted">Sign in to continue learning.</p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onSignIn();
            }}
            className="flex flex-col"
          >
            <div className="mb-3.5">
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                className={fieldClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@udsm.ac.tz"
                autoComplete="username"
              />
            </div>

            <div className="mb-3.5">
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  className={`${fieldClass} pr-11`}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex min-h-0 min-w-0 items-center px-3 text-fg-faint hover:text-fg"
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-md bg-primary py-3 text-sm font-semibold text-on-primary transition-opacity duration-150 hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {feedback ? (
            <p role="alert" className="mt-3 rounded-md bg-error-soft px-3 py-2 text-xs text-error-strong">
              {feedback}
            </p>
          ) : null}

          <div className="my-5 flex items-center gap-3 text-xs text-fg-faint">
            <span className="h-px flex-1 bg-border" />
            other ways in
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" className={altCardClass} onClick={() => togglePanel("offline")}>
              <Icon name="offline_pin" size={20} className="text-primary" />
              <span>
                <span className="block font-semibold">Offline PIN</span>
                <span className="block text-xs text-fg-muted">no network needed</span>
              </span>
            </button>
            <button type="button" className={altCardClass} onClick={() => togglePanel("demo")}>
              <Icon name="play_circle" size={20} className="text-primary" />
              <span>
                <span className="block font-semibold">Demo mode</span>
                <span className="block text-xs text-fg-muted">explore any role</span>
              </span>
            </button>
          </div>

          {panel === "demo" ? (
            <div className="mt-3 rounded-md border border-border bg-surface p-3.5">
              <label htmlFor="demoRole" className={labelClass}>
                Role to explore
              </label>
              <select
                id="demoRole"
                className={fieldClass}
                value={demoRole}
                onChange={(event) => setDemoRole(event.target.value)}
              >
                {demoRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.replace("_", " ")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onDemoMode}
                className="mt-2.5 w-full rounded-md border border-primary py-2.5 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-primary-soft"
              >
                Enter as {demoRole.replace("_", " ")}
              </button>
            </div>
          ) : null}

          {panel === "offline" ? (
            <div className="mt-3 rounded-md border border-border bg-surface p-3.5">
              <label htmlFor="offlinePin" className={labelClass}>
                Offline PIN
              </label>
              <input
                id="offlinePin"
                className={fieldClass}
                type="password"
                value={offlinePin}
                onChange={(event) => setOfflinePin(event.target.value)}
                placeholder="Enter your offline PIN"
              />
              <button
                type="button"
                onClick={onOfflineUnlock}
                className="mt-2.5 w-full rounded-md border border-primary py-2.5 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-primary-soft"
              >
                Unlock offline session
              </button>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5 text-xs text-fg-muted">
            <span className="flex items-center gap-1.5">
              <Icon name="account_balance" size={14} />
              {institutionId ? "Institution set" : "No institution selected"}
            </span>
            <button
              type="button"
              onClick={() => togglePanel("institution")}
              className="min-h-0 min-w-0 font-semibold text-primary hover:underline"
            >
              Change institution
            </button>
          </div>

          {panel === "institution" ? (
            <div className="mt-3 rounded-md border border-border bg-surface p-3.5">
              <label htmlFor="institutionId" className={labelClass}>
                Institution ID
              </label>
              <input
                id="institutionId"
                className={fieldClass}
                value={institutionId}
                onChange={(event) => setInstitutionId(event.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
              />
              <p className="mt-2 text-xs text-fg-faint">
                Your institution provides this ID. It's remembered on this device after you sign in.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
