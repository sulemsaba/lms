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

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "courses", element: <CoursesPage /> },
      { path: "assessments", element: <AssessmentsPage /> },
      { path: "map", element: <MapPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "timetable", element: <TimetablePage /> },
      { path: "helpdesk", element: <HelpdeskPage /> },
      { path: "receipts/:id", element: <ReceiptDetailPage /> }
    ]
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/offline-pin", element: <OfflinePinPage /> }
]);
