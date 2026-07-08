import { apiClient } from "@/services/api/client";

export interface StreakItem {
  id: string;
  streak_type?: string;
  current_count?: number;
  longest_count?: number;
}

export interface BadgeItem {
  id: string;
  badge_id?: string;
  awarded_at?: string;
}

export interface SkillItem {
  id: string;
  skill_id?: string;
  level?: number;
}

export interface RiskScore {
  id: string;
  score?: number;
  band?: string;
  computed_at?: string;
}

export interface SuccessDashboard {
  user_id: string;
  risk: RiskScore | null;
  streaks: StreakItem[];
  badges: BadgeItem[];
  skills: SkillItem[];
}

export interface SuccessDashboardResult {
  dashboard: SuccessDashboard | null;
  source: "network" | "unavailable";
}

/**
 * Loads the student-success aggregate (streaks, badges, skills, risk).
 * Returns source "unavailable" instead of throwing so the dashboard can
 * render honestly without this data (offline or endpoint down).
 */
export async function fetchSuccessDashboard(): Promise<SuccessDashboardResult> {
  try {
    const response = await apiClient.get<SuccessDashboard>("/student/dashboard");
    return { dashboard: response.data, source: "network" };
  } catch {
    return { dashboard: null, source: "unavailable" };
  }
}
