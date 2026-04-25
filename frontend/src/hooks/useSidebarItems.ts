import { useMemo } from 'react';
import { buildStudentFeaturePaths } from '@/features/auth/roleAccess';
import { selectEffectivePermissions, selectEffectiveRoleCodes, useAuthStore } from '@/stores/authStore';
import { SidebarItem, SidebarSection } from '@/components/layout/types';

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: "Dashboard",
    items: [
      { label: "Dashboard", icon: "dashboard", path: "/" },
      { label: "Campus Map", icon: "map", path: "/map" },
      { label: "Search", icon: "search", path: "/search" },
      { label: "Profile", icon: "person", path: "/profile" }
    ]
  },
  {
    title: "Academics",
    items: [
      { label: "My Courses", icon: "menu_book", path: "/courses" },
      { label: "Assessments", icon: "assignment", path: "/assessments" },
      { label: "Assignments", icon: "assignment", path: "/assignments" },
      { label: "QR Scanner", icon: "qr_code_scanner", path: "/qr-scanner" },
      { label: "Timetable", icon: "calendar_month", path: "/timetable" },
      { label: "Results", icon: "account_balance", path: "/results" }
    ]
  },
  {
    title: "University",
    items: [
      { label: "Payments", icon: "receipt_long", path: "/payments" },
      { label: "Community", icon: "forum", path: "/community" },
      { label: "Helpdesk", icon: "support_agent", path: "/helpdesk" }
    ]
  },
  {
    title: "Productivity",
    items: [
      { label: "Tasks", icon: "checklist", path: "/tasks" },
      { label: "Notes", icon: "edit_note", path: "/notes" },
      { label: "Alerts", icon: "notifications", path: "/notifications" },
      { label: "Queue Manager", icon: "sync", path: "/queue-manager" },
      { label: "Focus Mode", icon: "timer", path: "/focus-mode" },
      { label: "Quick Recap", icon: "quickreply", path: "/quick-recap" },
      { label: "AI Tutor", icon: "smart_toy", path: "/ai-tutor" },
      { label: "Resources", icon: "folder_open", path: "/resources" },
      { label: "Study Groups", icon: "group", path: "/study-groups" }
    ]
  },
  {
    title: "Gamification",
    items: [
      { label: "Leaderboard", icon: "leaderboard", path: "/leaderboard" },
      { label: "Badges", icon: "stars", path: "/badges" },
      { label: "Avatar", icon: "face", path: "/avatar" }
    ]
  }
];

export function useSidebarItems() {
  const roleCodes = useAuthStore(selectEffectiveRoleCodes);
  const permissions = useAuthStore(selectEffectivePermissions);

  const visibleSections = useMemo(() => {
    const allowedPaths = new Set(buildStudentFeaturePaths(roleCodes, permissions));
    
    return SIDEBAR_SECTIONS
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => allowedPaths.has(item.path))
      }))
      .filter((section) => section.items.length > 0);
  }, [permissions, roleCodes]);

  const allItems = useMemo(() => {
    return visibleSections.flatMap(section => section.items);
  }, [visibleSections]);

  const findItemByPath = (path: string): SidebarItem | undefined => {
    return allItems.find(item => item.path === path);
  };

  return {
    sections: visibleSections,
    allItems,
    findItemByPath,
    hasItems: allItems.length > 0
  };
}