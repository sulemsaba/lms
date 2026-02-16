import { createBrowserRouter } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import DashboardApp from "@/features/dashboard/DashboardApp";
import CoursesPage from "@/features/courses/CoursesPage";
import AssessmentsPage from "@/features/assessments/AssessmentsPage";
import MapPage from "@/features/map/MapPage";
import ProfilePage from "@/features/profile/ProfilePage";
import ReceiptDetailPage from "@/features/receipts/ReceiptDetailPage";
import TimetablePage from "@/features/timetable/TimetablePage";
import HelpdeskPage from "@/features/helpdesk/HelpdeskPage";
import LoginPage from "@/features/auth/LoginPage";
import OfflinePinPage from "@/features/auth/OfflinePinPage";
import RbacMatrixPage from "@/features/admin/RbacMatrixPage";
import TasksPage from "@/features/tasks/TasksPage";
import NotificationsPage from "@/features/notifications/NotificationsPage";
import QueueManagerPage from "@/features/offline/QueueManagerPage";
import NotesPage from "@/features/notes/NotesPage";
import SearchPage from "@/features/search/SearchPage";
import FeaturePlaceholderPage from "@/features/student/FeaturePlaceholderPage";
import RequireAuth from "@/features/auth/RequireAuth";
import RedirectIfAuthenticated from "@/features/auth/RedirectIfAuthenticated";
import RequireAdmin from "@/features/auth/RequireAdmin";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RequireAuth>
        <DashboardApp />
      </RequireAuth>
    )
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { path: "courses", element: <CoursesPage /> },
      { path: "assessments", element: <AssessmentsPage /> },
      { path: "assignments", element: <AssessmentsPage /> },
      { path: "map", element: <MapPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "timetable", element: <TimetablePage /> },
      {
        path: "results",
        element: <FeaturePlaceholderPage title="Results" description="View GPA summaries, course grades, and transcript exports." />
      },
      {
        path: "payments",
        element: <FeaturePlaceholderPage title="Payments" description="Track tuition status, fee statements, and payment history." />
      },
      {
        path: "community",
        element: (
          <FeaturePlaceholderPage
            title="Community"
            description="Access student discussions, announcements, and collaboration spaces."
          />
        )
      },
      { path: "helpdesk", element: <HelpdeskPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "notes", element: <NotesPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "queue-manager", element: <QueueManagerPage /> },
      {
        path: "focus-mode",
        element: (
          <FeaturePlaceholderPage
            title="Focus Mode"
            description="Use structured focus sessions and break cycles to improve study consistency."
          />
        )
      },
      {
        path: "resources",
        element: <FeaturePlaceholderPage title="Resources" description="Browse saved documents, notes, and course materials." />
      },
      {
        path: "study-groups",
        element: <FeaturePlaceholderPage title="Study Groups" description="Join and coordinate peer study sessions by course." />
      },
      {
        path: "rbac-matrix",
        element: (
          <RequireAdmin>
            <RbacMatrixPage />
          </RequireAdmin>
        )
      },
      { path: "receipts/:id", element: <ReceiptDetailPage /> }
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
