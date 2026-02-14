import { createBrowserRouter } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import HomePage from "@/features/home/HomePage";
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
import RequireAuth from "@/features/auth/RequireAuth";
import RedirectIfAuthenticated from "@/features/auth/RedirectIfAuthenticated";
import RequireAdmin from "@/features/auth/RequireAdmin";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "courses", element: <CoursesPage /> },
      { path: "assessments", element: <AssessmentsPage /> },
      { path: "map", element: <MapPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "timetable", element: <TimetablePage /> },
      { path: "helpdesk", element: <HelpdeskPage /> },
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
