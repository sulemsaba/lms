import { lazy, Suspense, type ReactElement } from "react";
import { createBrowserRouter } from "react-router-dom";
import LoginPage from "@/features/auth/LoginPage";
import OfflinePinPage from "@/features/auth/OfflinePinPage";
import FeaturePlaceholderPage from "@/features/student/FeaturePlaceholderPage";
import RequireAuth from "@/features/auth/RequireAuth";
import RedirectIfAuthenticated from "@/features/auth/RedirectIfAuthenticated";
import RequireAdmin from "@/features/auth/RequireAdmin";
import RequireFeatureAccess from "@/features/auth/RequireFeatureAccess";

const AppShell = lazy(() => import("@/components/layout/AppShell"));
const DashboardApp = lazy(() => import("@/features/dashboard/DashboardApp"));
const CoursesPage = lazy(() => import("@/features/courses/CoursesPage"));
const AssessmentsPage = lazy(() => import("@/features/assessments/AssessmentsPage"));
const MapPage = lazy(() => import("@/features/map/MapPage"));
const ProfilePage = lazy(() => import("@/features/profile/ProfilePage"));
const ReceiptDetailPage = lazy(() => import("@/features/receipts/ReceiptDetailPage"));
const TimetablePage = lazy(() => import("@/features/timetable/TimetablePage"));
const HelpdeskPage = lazy(() => import("@/features/helpdesk/HelpdeskPage"));
const RbacMatrixPage = lazy(() => import("@/features/admin/RbacMatrixPage"));
const TasksPage = lazy(() => import("@/features/tasks/TasksPage"));
const NotificationsPage = lazy(() => import("@/features/notifications/NotificationsPage"));
const QueueManagerPage = lazy(() => import("@/features/offline/QueueManagerPage"));
const NotesPage = lazy(() => import("@/features/notes/NotesPage"));
const SearchPage = lazy(() => import("@/features/search/SearchPage"));

const routeLoadingFallback = <div style={{ padding: "16px" }}>Loading...</div>;

function withSuspense(element: ReactElement): ReactElement {
  return <Suspense fallback={routeLoadingFallback}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RequireAuth>
        {withSuspense(<DashboardApp />)}
      </RequireAuth>
    )
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        {withSuspense(<AppShell />)}
      </RequireAuth>
    ),
    children: [
      { path: "courses", element: withSuspense(<CoursesPage />) },
      { path: "assessments", element: withSuspense(<AssessmentsPage />) },
      { path: "assignments", element: withSuspense(<AssessmentsPage />) },
      { path: "map", element: withSuspense(<MapPage />) },
      { path: "profile", element: withSuspense(<ProfilePage />) },
      { path: "timetable", element: withSuspense(<TimetablePage />) },
      {
        path: "results",
        element: (
          <RequireFeatureAccess featurePath="/results">
            <FeaturePlaceholderPage title="Results" description="View GPA summaries, course grades, and transcript exports." />
          </RequireFeatureAccess>
        )
      },
      {
        path: "payments",
        element: (
          <RequireFeatureAccess featurePath="/payments">
            <FeaturePlaceholderPage
              title="Payments"
              description="Track tuition status, fee statements, and payment history."
            />
          </RequireFeatureAccess>
        )
      },
      {
        path: "community",
        element: (
          <RequireFeatureAccess featurePath="/community">
            <FeaturePlaceholderPage
              title="Community"
              description="Access student discussions, announcements, and collaboration spaces."
            />
          </RequireFeatureAccess>
        )
      },
      { path: "helpdesk", element: withSuspense(<HelpdeskPage />) },
      { path: "tasks", element: withSuspense(<TasksPage />) },
      { path: "notifications", element: withSuspense(<NotificationsPage />) },
      { path: "notes", element: withSuspense(<NotesPage />) },
      { path: "search", element: withSuspense(<SearchPage />) },
      { path: "queue-manager", element: withSuspense(<QueueManagerPage />) },
      {
        path: "focus-mode",
        element: (
          <RequireFeatureAccess featurePath="/focus-mode">
            <FeaturePlaceholderPage
              title="Focus Mode"
              description="Use structured focus sessions and break cycles to improve study consistency."
            />
          </RequireFeatureAccess>
        )
      },
      {
        path: "resources",
        element: (
          <RequireFeatureAccess featurePath="/resources">
            <FeaturePlaceholderPage title="Resources" description="Browse saved documents, notes, and course materials." />
          </RequireFeatureAccess>
        )
      },
      {
        path: "study-groups",
        element: (
          <RequireFeatureAccess featurePath="/study-groups">
            <FeaturePlaceholderPage title="Study Groups" description="Join and coordinate peer study sessions by course." />
          </RequireFeatureAccess>
        )
      },
      {
        path: "rbac-matrix",
        element: (
          <RequireAdmin>
            {withSuspense(<RbacMatrixPage />)}
          </RequireAdmin>
        )
      },
      { path: "receipts/:id", element: withSuspense(<ReceiptDetailPage />) }
    ]
  },
  {
    path: "/login",
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    )
  },
  { path: "/offline-pin", element: <OfflinePinPage /> }
]);
