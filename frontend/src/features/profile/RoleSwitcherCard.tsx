import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  IMPERSONATION_ROLE_CODES,
  canSuperAdminImpersonate,
  formatRoleLabel,
  getLandingPath
} from "@/features/auth/roleAccess";
import { fetchRoleMatrix, type RoleMatrixItem } from "@/services/api/authApi";
import {
  selectEffectivePermissions,
  selectEffectiveRoleCodes,
  useAuthStore
} from "@/stores/authStore";
import styles from "./RoleSwitcherCard.module.css";

interface RoleOption {
  roleCode: string;
  permissions: string[];
}

const fallbackRoleOptions: RoleOption[] = IMPERSONATION_ROLE_CODES.map((roleCode) => ({
  roleCode,
  permissions: []
}));

/**
 * Super-admin only UI for temporary role impersonation without ending session.
 */
export default function RoleSwitcherCard() {
  const navigate = useNavigate();
  const actualRoleCodes = useAuthStore((state) => state.roleCodes);
  const actualPermissions = useAuthStore((state) => state.permissions);
  const institutionId = useAuthStore((state) => state.institutionId);
  const impersonatedRoleCode = useAuthStore((state) => state.impersonatedRoleCode);
  const effectiveRoleCodes = useAuthStore(selectEffectiveRoleCodes);
  const effectivePermissions = useAuthStore(selectEffectivePermissions);
  const startImpersonation = useAuthStore((state) => state.startImpersonation);
  const stopImpersonation = useAuthStore((state) => state.stopImpersonation);

  const canImpersonate = canSuperAdminImpersonate(actualRoleCodes);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>(fallbackRoleOptions);
  const [selectedRoleCode, setSelectedRoleCode] = useState(impersonatedRoleCode ?? "student");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!canImpersonate || !institutionId) {
      return;
    }

    let cancelled = false;
    const loadRoleOptions = async () => {
      try {
        const rows: RoleMatrixItem[] = await fetchRoleMatrix(institutionId);
        if (cancelled) {
          return;
        }

        const filteredRows = rows.filter((row) => row.role_code !== "super_admin");
        if (filteredRows.length === 0) {
          setRoleOptions(fallbackRoleOptions);
          return;
        }
        setRoleOptions(
          filteredRows.map((row) => ({
            roleCode: row.role_code,
            permissions: row.permissions
          }))
        );
      } catch {
        if (!cancelled) {
          setRoleOptions(fallbackRoleOptions);
        }
      }
    };

    void loadRoleOptions();
    return () => {
      cancelled = true;
    };
  }, [canImpersonate, institutionId]);

  useEffect(() => {
    if (impersonatedRoleCode) {
      setSelectedRoleCode(impersonatedRoleCode);
    }
  }, [impersonatedRoleCode]);

  const selectedOption = useMemo(
    () => roleOptions.find((option) => option.roleCode === selectedRoleCode),
    [roleOptions, selectedRoleCode]
  );

  if (!canImpersonate) {
    return null;
  }

  const onApplyImpersonation = () => {
    const roleCode = selectedOption?.roleCode ?? selectedRoleCode;
    const permissions = selectedOption?.permissions ?? [];
    startImpersonation(roleCode, permissions);
    setStatusMessage(`Impersonation enabled: ${formatRoleLabel(roleCode)}.`);
    navigate(getLandingPath([roleCode], permissions), { replace: true });
  };

  const onStopImpersonation = () => {
    stopImpersonation();
    setStatusMessage("Impersonation stopped. Returned to your own session.");
    navigate(getLandingPath(actualRoleCodes, actualPermissions), { replace: true });
  };

  return (
    <Card>
      <div className={styles.stack}>
        <h2>Role Switcher</h2>
        <p>Super-admin session impersonation for UI verification and support triage.</p>

        <div className={styles.row}>
          <span>Current effective role</span>
          <strong>{effectiveRoleCodes.length > 0 ? formatRoleLabel(effectiveRoleCodes[0]) : "Unknown"}</strong>
        </div>
        <div className={styles.row}>
          <span>Impersonation status</span>
          <strong>{impersonatedRoleCode ? "Active" : "Off"}</strong>
        </div>
        <div className={styles.row}>
          <span>Effective permissions</span>
          <strong>{effectivePermissions.length}</strong>
        </div>

        <label className={styles.field}>
          <span>Switch to role</span>
          <select value={selectedRoleCode} onChange={(event) => setSelectedRoleCode(event.target.value)}>
            {roleOptions.map((option) => (
              <option key={option.roleCode} value={option.roleCode}>
                {formatRoleLabel(option.roleCode)}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onApplyImpersonation}>
            Apply Impersonation
          </Button>
          <Button variant="text" onClick={onStopImpersonation} disabled={!impersonatedRoleCode}>
            End Impersonation
          </Button>
        </div>

        {statusMessage ? <p className={styles.status}>{statusMessage}</p> : null}
      </div>
    </Card>
  );
}
