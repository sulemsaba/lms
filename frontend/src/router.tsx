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
      { path: "map", element: <MapPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "timetable", element: <TimetablePage /> },
      { path: "helpdesk", element: <HelpdeskPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "notes", element: <NotesPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "queue-manager", element: <QueueManagerPage /> },
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
