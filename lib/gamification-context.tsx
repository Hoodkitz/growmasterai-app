import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/lib/auth-context";
import {
  Achievement,
  UserStats,
  UserLevel,
  ACHIEVEMENTS,
  getLevelFromPoints,
  getProgressToNextLevel,
  checkAchievements,
} from "./gamification";

interface GamificationContextType {
  // User stats
  stats: UserStats;
  points: number;
  level: UserLevel;
  levelProgress: number;

  // Achievements
  unlockedAchievements: Achievement[];
  lockedAchievements: Achievement[];
  recentAchievement: Achievement | null;

  // Actions
  incrementStat: (stat: keyof UserStats, amount?: number) => Promise<void>;
  checkForNewAchievements: () => Promise<Achievement[]>;
  dismissRecentAchievement: () => void;

  // Leaderboard
  updateLoginStreak: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

const STATS_STORAGE_KEY = "@growmaster_stats";
const ACHIEVEMENTS_STORAGE_KEY = "@growmaster_achievements";
const LAST_LOGIN_KEY = "@growmaster_last_login";

const DEFAULT_STATS: UserStats = {
  totalDiagnoses: 0,
  totalPlants: 0,
  totalHarvests: 0,
  totalYield: 0,
  journalEntries: 0,
  loginStreak: 0,
  longestStreak: 0,
  communityPosts: 0,
  helpfulAnswers: 0,
  contestsWon: 0,
  xp: 0,
  level: 1,
};

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAppAuth();
  const utils = trpc.useContext();

  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);

  const statsQuery = trpc.achievements.getStats.useQuery(undefined, {
    enabled: !!user,
  });

  const unlockMutation = trpc.achievements.unlock.useMutation({
    onSuccess: (data) => {
      if (data.new) {
        utils.achievements.getStats.invalidate();
      }
    },
  });

  const streakMutation = trpc.achievements.updateStreak.useMutation({
    onSuccess: () => {
      utils.achievements.getStats.invalidate();
    },
  });

  // Derived state
  const stats = statsQuery.data?.stats || DEFAULT_STATS;
  const unlockedAchievementsList = statsQuery.data?.unlockedAchievements || [];
  const unlockedIds = unlockedAchievementsList.map((a: { achievementId: string }) => a.achievementId);
  const points = stats.xp;

  // Initial load
  useEffect(() => {
    if (user) {
      streakMutation.mutate();
    }
  }, [user]);

  const checkForNewAchievements = useCallback(async (): Promise<Achievement[]> => {
    if (!user || !statsQuery.data) return [];

    const newAchievements = checkAchievements(stats, unlockedIds);

    if (newAchievements.length > 0) {
      // Unlock first one on server (limit 1 per check to avoid spam?) or loop
      // For simplicity, just unlock first
      const first = newAchievements[0];
      unlockMutation.mutate({ achievementId: first.id });
      setRecentAchievement(first);
    }

    return newAchievements;
  }, [stats, unlockedIds, user]);

  // Compatibility shim for incrementStat (most stats are server managed now)
  const incrementStat = useCallback(async (stat: keyof UserStats, amount: number = 1) => {
    // If we were offline-first, we'd update local state.
    // For now, assume server tracks actions (createPost, createDiagnosis)
    // We could invalidate queries here if we knew what changed.
    utils.achievements.getStats.invalidate();
    checkForNewAchievements();
  }, [utils, checkForNewAchievements]);

  const updateLoginStreak = useCallback(async () => {
    streakMutation.mutate();
  }, [streakMutation]);

  const dismissRecentAchievement = useCallback(() => {
    setRecentAchievement(null);
  }, []);

  const level = getLevelFromPoints(points);
  const levelProgress = getProgressToNextLevel(points);

  const unlockedAchievements = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id)).map(a => ({
    ...a,
    unlockedAt: new Date(),
  }));

  const lockedAchievements = ACHIEVEMENTS.filter(a => !unlockedIds.includes(a.id));

  return (
    <GamificationContext.Provider
      value={{
        stats,
        points,
        level,
        levelProgress,
        unlockedAchievements,
        lockedAchievements,
        recentAchievement,
        incrementStat,
        checkForNewAchievements,
        dismissRecentAchievement,
        updateLoginStreak,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
}
