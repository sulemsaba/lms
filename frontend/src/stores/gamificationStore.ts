import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'achievement' | 'social' | 'learning' | 'special';
  unlockedAt: string | null;
  progress: number; // 0-100
  requirement: number;
}

export interface AvatarAccessory {
  id: string;
  name: string;
  type: 'hat' | 'glasses' | 'outfit' | 'pet' | 'effect';
  icon: string;
  xpRequired: number;
  unlocked: boolean;
  equipped: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  level: number;
  rank: number;
}

export interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  badges: Badge[];
  accessories: AvatarAccessory[];
  equippedAccessories: string[];
  leaderboardHidden: boolean;
  leaderboard: LeaderboardEntry[];
  
  // Actions
  addXp: (amount: number) => void;
  updateStreak: () => void;
  unlockBadge: (badgeId: string) => void;
  updateBadgeProgress: (badgeId: string, progress: number) => void;
  unlockAccessory: (accessoryId: string) => void;
  equipAccessory: (accessoryId: string) => void;
  unequipAccessory: (accessoryId: string) => void;
  setLeaderboardHidden: (hidden: boolean) => void;
  updateLeaderboard: (entries: LeaderboardEntry[]) => void;
  resetGamification: () => void;
}

const XP_PER_LEVEL = 1000;

function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

const DEFAULT_BADGES: Badge[] = [
  { id: 'first-login', name: 'First Steps', description: 'Log in for the first time', icon: 'login', category: 'achievement', unlockedAt: null, progress: 0, requirement: 1 },
  { id: 'streak-3', name: 'Hat Trick', description: 'Maintain a 3-day streak', icon: 'local_fire_department', category: 'streak', unlockedAt: null, progress: 0, requirement: 3 },
  { id: 'streak-7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'whatshot', category: 'streak', unlockedAt: null, progress: 0, requirement: 7 },
  { id: 'streak-21', name: 'Habit Master', description: 'Maintain a 21-day streak', icon: 'auto_awesome', category: 'streak', unlockedAt: null, progress: 0, requirement: 21 },
  { id: 'xp-1000', name: 'Century', description: 'Earn 1,000 total XP', icon: 'star', category: 'learning', unlockedAt: null, progress: 0, requirement: 1000 },
  { id: 'xp-5000', name: 'Rising Star', description: 'Earn 5,000 total XP', icon: 'stars', category: 'learning', unlockedAt: null, progress: 0, requirement: 5000 },
  { id: 'xp-10000', name: 'Legend', description: 'Earn 10,000 total XP', icon: 'emoji_events', category: 'learning', unlockedAt: null, progress: 0, requirement: 10000 },
  { id: 'social-butterfly', name: 'Social Butterfly', description: 'Join 5 study groups', icon: 'groups', category: 'social', unlockedAt: null, progress: 0, requirement: 5 },
  { id: 'helper', name: 'Helping Hand', description: 'Answer 10 peer questions', icon: 'handshake', category: 'social', unlockedAt: null, progress: 0, requirement: 10 },
  { id: 'focus-5', name: 'Deep Focus', description: 'Complete 5 focus sessions', icon: 'trip_origin', category: 'special', unlockedAt: null, progress: 0, requirement: 5 },
  { id: 'focus-20', name: 'Zen Master', description: 'Complete 20 focus sessions', icon: 'self_improvement', category: 'special', unlockedAt: null, progress: 0, requirement: 20 },
  { id: 'perfect-week', name: 'Perfect Week', description: 'Complete all tasks for a week', icon: 'checklist', category: 'achievement', unlockedAt: null, progress: 0, requirement: 7 },
];

const DEFAULT_ACCESSORIES: AvatarAccessory[] = [
  { id: 'cap-basic', name: 'Basic Cap', type: 'hat', icon: 'hat', xpRequired: 0, unlocked: true, equipped: false },
  { id: 'glasses-classic', name: 'Classic Glasses', type: 'glasses', icon: 'glasses', xpRequired: 500, unlocked: false, equipped: false },
  { id: 'outfit-casual', name: 'Casual Hoodie', type: 'outfit', icon: 'checkroom', xpRequired: 1000, unlocked: false, equipped: false },
  { id: 'pet-cat', name: 'Study Cat', type: 'pet', icon: 'pets', xpRequired: 2000, unlocked: false, equipped: false },
  { id: 'hat-grad', name: 'Graduate Cap', type: 'hat', icon: 'school', xpRequired: 3000, unlocked: false, equipped: false },
  { id: 'effect-sparkle', name: 'Sparkle Aura', type: 'effect', icon: 'auto_awesome', xpRequired: 5000, unlocked: false, equipped: false },
  { id: 'glasses-sun', name: 'Cool Shades', type: 'glasses', icon: 'sunglasses', xpRequired: 1500, unlocked: false, equipped: false },
  { id: 'outfit-smart', name: 'Smart Blazer', type: 'outfit', icon: 'business_center', xpRequired: 2500, unlocked: false, equipped: false },
  { id: 'pet-owl', name: 'Wise Owl', type: 'pet', icon: 'raven', xpRequired: 4000, unlocked: false, equipped: false },
  { id: 'hat-crown', name: 'Crown', type: 'hat', icon: 'workspace_premium', xpRequired: 8000, unlocked: false, equipped: false },
];

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'Alex M.', avatar: 'code', xp: 8450, streak: 21, level: 8, rank: 1 },
  { id: '2', name: 'Sarah K.', avatar: 'school', xp: 7200, streak: 15, level: 7, rank: 2 },
  { id: '3', name: 'David R.', avatar: 'menu_book', xp: 6100, streak: 12, level: 6, rank: 3 },
  { id: '4', name: 'Maria G.', avatar: 'science', xp: 5400, streak: 8, level: 5, rank: 4 },
  { id: '5', name: 'James L.', avatar: 'palette', xp: 4800, streak: 10, level: 4, rank: 5 },
  { id: '6', name: 'You', avatar: 'star', xp: 3200, streak: 7, level: 3, rank: 6 },
  { id: '7', name: 'Emma W.', avatar: 'work', xp: 2800, streak: 5, level: 2, rank: 7 },
  { id: '8', name: 'Lucas T.', avatar: 'handyman', xp: 2100, streak: 3, level: 2, rank: 8 },
];

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      xp: 3200,
      level: calculateLevel(3200),
      streak: 7,
      longestStreak: 14,
      lastActiveDate: new Date().toISOString().split('T')[0],
      badges: DEFAULT_BADGES,
      accessories: DEFAULT_ACCESSORIES,
      equippedAccessories: ['cap-basic'],
      leaderboardHidden: false,
      leaderboard: DEMO_LEADERBOARD,

      addXp: (amount) => {
        const current = get();
        const newXp = current.xp + amount;
        const newLevel = calculateLevel(newXp);
        set({ xp: newXp, level: newLevel });

        // Update badge progress for XP-based badges
        const updatedBadges = current.badges.map(badge => {
          if (badge.id.startsWith('xp-')) {
            const newProgress = Math.min(newXp, badge.requirement);
            const shouldUnlock = newProgress >= badge.requirement && !badge.unlockedAt;
            return {
              ...badge,
              progress: newProgress,
              unlockedAt: shouldUnlock ? new Date().toISOString() : badge.unlockedAt,
            };
          }
          return badge;
        });
        set({ badges: updatedBadges });
      },

      updateStreak: () => {
        const current = get();
        const today = new Date().toISOString().split('T')[0];
        const lastDate = current.lastActiveDate;
        
        if (lastDate === today) return; // Already counted today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const newStreak = lastDate === yesterdayStr ? current.streak + 1 : 1;
        const newLongestStreak = Math.max(current.longestStreak, newStreak);

        set({
          streak: newStreak,
          longestStreak: newLongestStreak,
          lastActiveDate: today,
        });

        // Update streak badge progress
        const updatedBadges = get().badges.map(badge => {
          if (badge.id.startsWith('streak-')) {
            const newProgress = Math.min(newStreak, badge.requirement);
            const shouldUnlock = newProgress >= badge.requirement && !badge.unlockedAt;
            return {
              ...badge,
              progress: newProgress,
              unlockedAt: shouldUnlock ? new Date().toISOString() : badge.unlockedAt,
            };
          }
          return badge;
        });
        set({ badges: updatedBadges });
      },

      unlockBadge: (badgeId) => {
        const updatedBadges = get().badges.map(badge =>
          badge.id === badgeId && !badge.unlockedAt
            ? { ...badge, unlockedAt: new Date().toISOString(), progress: badge.requirement }
            : badge
        );
        set({ badges: updatedBadges });
      },

      updateBadgeProgress: (badgeId, progress) => {
        const updatedBadges = get().badges.map(badge =>
          badge.id === badgeId
            ? {
                ...badge,
                progress: Math.min(progress, badge.requirement),
                unlockedAt: progress >= badge.requirement && !badge.unlockedAt
                  ? new Date().toISOString()
                  : badge.unlockedAt,
              }
            : badge
        );
        set({ badges: updatedBadges });
      },

      unlockAccessory: (accessoryId) => {
        const updatedAccessories = get().accessories.map(a =>
          a.id === accessoryId ? { ...a, unlocked: true } : a
        );
        set({ accessories: updatedAccessories });
      },

      equipAccessory: (accessoryId) => {
        const current = get();
        const accessory = current.accessories.find(a => a.id === accessoryId);
        if (!accessory?.unlocked) return;

        // Unequip same type
        const filteredEquipped = current.equippedAccessories.filter(id => {
          const acc = current.accessories.find(a => a.id === id);
          return acc?.type !== accessory.type;
        });

        set({ equippedAccessories: [...filteredEquipped, accessoryId] });
      },

      unequipAccessory: (accessoryId) => {
        set({
          equippedAccessories: get().equippedAccessories.filter(id => id !== accessoryId)
        });
      },

      setLeaderboardHidden: (hidden) => set({ leaderboardHidden: hidden }),

      updateLeaderboard: (entries) => set({ leaderboard: entries }),

      resetGamification: () => {
        set({
          xp: 0,
          level: 1,
          streak: 0,
          longestStreak: 0,
          lastActiveDate: null,
          badges: DEFAULT_BADGES.map(b => ({ ...b, unlockedAt: null, progress: 0 })),
          accessories: DEFAULT_ACCESSORIES.map(a => ({ ...a, unlocked: a.xpRequired === 0, equipped: a.id === 'cap-basic' })),
          equippedAccessories: ['cap-basic'],
          leaderboardHidden: false,
          leaderboard: DEMO_LEADERBOARD,
        });
      },
    }),
    {
      name: "gamification-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
