import type { TabItem } from "@/types";

const ADMIN_ROLES = new Set([
  "super_admin",
  "ict_admin",
  "exam_officer",
  "college_admin",
  "college_exam_officer",
  "hod",
  "dept_admin"
]);

const TEACHING_ROLES = new Set(["lecturer", "ta", "external_examiner"]);

const STUDENT_ROLES = new Set(["student"]);

const GUEST_ROLES = new Set(["guest"]);

function hasAnyRole(roleCodes: string[], expected: Set<string>): boolean {
  return roleCodes.some((roleCode) => expected.has(roleCode));
}

function hasAnyPermission(permissions: string[], expected: string[]): boolean {
  return expected.some((permission) => permissions.includes(permission));
}

function addUnique(items: TabItem[], item: TabItem): void {
  if (!items.some((current) => current.path === item.path)) {
    items.push(item);
  }
}

type Experience = "admin" | "teaching" | "student" | "guest";

function resolveExperience(roleCodes: string[], permissions: string[]): Experience {
  if (hasAnyRole(roleCodes, ADMIN_ROLES) || permissions.includes("system.users_roles.manage")) {
    return "admin";
  }

  if (hasAnyRole(roleCodes, TEACHING_ROLES) || hasAnyPermission(permissions, ["submission.grade", "assessment.create"])) {
    return "teaching";
  }

  if (hasAnyRole(roleCodes, STUDENT_ROLES) || permissions.includes("assessment.submit")) {
    return "student";
  }

  if (hasAnyRole(roleCodes, GUEST_ROLES)) {
    return "guest";
  }

  return "student";
}

export function formatRoleLabel(roleCode: string): string {
  return roleCode
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function canAccessAdminArea(roleCodes: string[], permissions: string[]): boolean {
  return hasAnyRole(roleCodes, ADMIN_ROLES) || permissions.includes("system.users_roles.manage");
}

export function getLandingPath(roleCodes: string[], permissions: string[]): string {
  const experience = resolveExperience(roleCodes, permissions);

  if (experience === "admin") {
    return "/rbac-matrix";
  }

  if (experience === "teaching") {
    return "/assessments";
  }

  if (experience === "guest") {
    return "/map";
  }

  return "/";
}

export function getPortalTitle(roleCodes: string[], permissions: string[]): string {
  const experience = resolveExperience(roleCodes, permissions);

  if (experience === "admin") {
    return "UDSM Admin Portal";
  }

  if (experience === "teaching") {
    return "UDSM Teaching Portal";
  }

  if (experience === "guest") {
    return "UDSM Guest Portal";
  }

  return "UDSM Student Hub";
}

export function getPortalSubtitle(roleCodes: string[], permissions: string[]): string {
  const experience = resolveExperience(roleCodes, permissions);

  if (experience === "admin") {
    return "Roles, permissions, operations, and institutional oversight";
  }

  if (experience === "teaching") {
    return "Course delivery, assessment workflows, and academic coordination";
  }

  if (experience === "guest") {
    return "Public learning resources and campus discovery";
  }

  return "Offline-first learning and campus life";
}

export function buildNavItems(roleCodes: string[], permissions: string[]): TabItem[] {
  const experience = resolveExperience(roleCodes, permissions);
  const items: TabItem[] = [];

  addUnique(items, { label: "Home", icon: "home", path: "/" });

  const canSeeCourses = hasAnyPermission(permissions, ["course.read", "course.write"]) || experience !== "guest";
  if (canSeeCourses) {
    addUnique(items, { label: "Courses", icon: "menu_book", path: "/courses" });
  }

  const canSeeAssessments =
    hasAnyPermission(permissions, ["assessment.read", "assessment.submit", "assessment.create"]) ||
    experience === "student" ||
    experience === "teaching" ||
    experience === "admin";
  if (canSeeAssessments) {
    addUnique(items, { label: "Assess", icon: "assignment", path: "/assessments" });
  }

  const canSeeTimetable =
    hasAnyPermission(permissions, ["timetable.read", "timetable.write"]) ||
    experience === "student" ||
    experience === "teaching" ||
    experience === "admin";
  if (canSeeTimetable) {
    addUnique(items, { label: "Timetable", icon: "calendar_month", path: "/timetable" });
  }

  const canSeeHelpdesk = hasAnyPermission(permissions, ["helpdesk.create", "helpdesk.read.own", "helpdesk.read.scope"]);
  if (canSeeHelpdesk || experience === "student" || experience === "teaching" || experience === "admin") {
    addUnique(items, { label: "Helpdesk", icon: "support_agent", path: "/helpdesk" });
  }

  addUnique(items, { label: "Map", icon: "map", path: "/map" });

  if (canAccessAdminArea(roleCodes, permissions)) {
    addUnique(items, { label: "RBAC", icon: "admin_panel_settings", path: "/rbac-matrix" });
  }

  addUnique(items, { label: "Profile", icon: "person", path: "/profile" });

  return items;
}
