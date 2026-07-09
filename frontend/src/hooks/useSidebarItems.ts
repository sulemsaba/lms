import { useMemo } from 'react';
import { buildStudentFeaturePaths } from '@/features/auth/roleAccess';
import { selectEffectivePermissions, selectEffectiveRoleCodes, useAuthStore } from '@/stores/authStore';
import { SidebarItem, SidebarSection } from '@/components/layout/types';

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: "",
    items: [
      { label: "Home", icon: "home", path: "/" },
      { label: "Search", icon: "search", path: "/search" },
      { label: "Alerts", icon: "notifications", path: "/notifications" }
    ]
  },
  {
    title: "Learn",
    items: [
      { label: "Courses", icon: "menu_book", path: "/courses" },
      { label: "Assignments", icon: "assignment", path: "/assignments" },
      { label: "Assessments", icon: "quiz", path: "/assessments" },
      { label: "Resources", icon: "folder_open", path: "/resources" },
      { label: "Notes", icon: "edit_note", path: "/notes" },
      { label: "Quick Recap", icon: "style", path: "/quick-recap" },
      { label: "AI Tutor", icon: "smart_toy", path: "/ai-tutor" }
    ]
  },
  {
    title: "Plan",
    items: [
      { label: "Timetable", icon: "calendar_month", path: "/timetable" },
      { label: "Tasks", icon: "checklist", path: "/tasks" },
      { label: "Focus Mode", icon: "timer", path: "/focus-mode" },
      { label: "Results", icon: "school", path: "/results" },
      { label: "Payments", icon: "receipt_long", path: "/payments" }
    ]
  },
  {
    title: "Progress",
    items: [
      { label: "Badges", icon: "military_tech", path: "/badges" },
      { label: "Leaderboard", icon: "leaderboard", path: "/leaderboard" },
      { label: "Avatar", icon: "face", path: "/avatar" }
    ]
  },
  {
    title: "Campus",
    items: [
      { label: "Map", icon: "map", path: "/map" },
      { label: "Study Groups", icon: "group", path: "/study-groups" },
      { label: "Community", icon: "forum", path: "/community" },
      { label: "QR Scanner", icon: "qr_code_scanner", path: "/qr-scanner" },
      { label: "Helpdesk", icon: "support_agent", path: "/helpdesk" }
    ]
  },
  {
    title: "System",
    items: [
      { label: "Sync Queue", icon: "sync", path: "/queue-manager" },
      { label: "Profile", icon: "person", path: "/profile" }
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