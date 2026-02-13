import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { apiClient } from "@/services/api/client";
import styles from "./RbacMatrixPage.module.css";

interface RoleRow {
  role: string;
  scope: string;
  canDo: string;
}

const roleRows: RoleRow[] = [
  { role: "SuperAdmin", scope: "Institution", canDo: "Full control, roles, policies, audit visibility" },
  { role: "ICTAdmin", scope: "Institution", canDo: "Infra, integrations, logs, backups" },
  { role: "ExamOfficer", scope: "Institution", canDo: "Exam schedule, grade release, transcripts" },
  { role: "CollegeAdmin", scope: "College", canDo: "Manage departments/staff, enrollment oversight" },
  { role: "CollegeExamOfficer", scope: "College", canDo: "College exam logistics and clashes" },
  { role: "HoD", scope: "Department", canDo: "Department courses, lecturers, TA, approvals" },
  { role: "DeptAdmin", scope: "Department", canDo: "Enrollment/scheduling reports support" },
  { role: "Lecturer", scope: "Course", canDo: "Content, assessments, grading, release grades" },
  { role: "TA", scope: "Course", canDo: "Assist grading and support (limited)" },
  { role: "Student", scope: "Course", canDo: "Learn, submit, track progress, receipts, helpdesk" },
  { role: "ExternalExaminer", scope: "Course", canDo: "Read-only review of materials/submissions" },
  { role: "Guest", scope: "Public", canDo: "Public catalogue/map/demo only" }
];

/**
 * Human-readable RBAC matrix view for admins and implementers.
 */
export default function RbacMatrixPage() {
  const [rows, setRows] = useState<RoleRow[]>(roleRows);

  useEffect(() => {
    let mounted = true;

    interface ApiRoleRow {
      role_code: string;
      scope_type: string;
      permissions: string[];
    }

    async function loadMatrix() {
      try {
        const response = await apiClient.get<ApiRoleRow[]>("/rbac/matrix");
        if (!mounted) {
          return;
        }
        setRows(
          response.data.map((item) => ({
            role: item.role_code,
            scope: item.scope_type,
            canDo: item.permissions.slice(0, 4).join(", ")
          }))
        );
      } catch {
        if (mounted) {
          setRows(roleRows);
        }
      }
    }

    void loadMatrix();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className={styles.stack}>
      <Card>
        <h2>RBAC Matrix</h2>
        <p>Scope-based role model used by UDSM Student Hub.</p>
      </Card>
      <Card>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Scope</th>
                <th>Primary Capabilities</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.role}>
                  <td>{row.role}</td>
                  <td>{row.scope}</td>
                  <td>{row.canDo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
