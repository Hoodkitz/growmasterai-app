import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
};

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [points, setPoints] = useState(0);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);

  // Load saved data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, achievementsData] = await Promise.all([
        AsyncStorage.getItem(STATS_STORAGE_KEY),
        AsyncStorage.getItem(ACHIEVEMENTS_STORAGE_KEY),
      ]);

      if (statsData) {
        setStats(JSON.parse(statsData));
      }

      if (achievementsData) {
        const parsed = JSON.parse(achievementsData);
        setUnlockedIds(parsed.ids || []);
        setPoints(parsed.points || 0);
      }
    } catch (error) {
      console.error("Error loading gamification data:", error);
    }
  };

  const saveData = async (newStats: UserStats, newUnlockedIds: string[], newPoints: number) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats)),
        AsyncStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify({ 
          ids: newUnlockedIds, 
          points: newPoints 
        })),
      ]);
    } catch (error) {
      console.error("Error saving gamification data:", error);
    }
  };

  const incrementStat = useCallback(async (stat: keyof UserStats, amount: number = 1) => {
    const newStats = {
      ...stats,
      [stat]: (stats[stat] as number) + amount,
    };
    setStats(newStats);
    
    // Check for new achievements
    const newAchievements = checkAchievements(newStats, unlockedIds);
    
    if (newAchievements.length > 0) {
      const newIds = [...unlockedIds, ...newAchievements.map(a => a.id)];
      const earnedPoints = newAchievements.reduce((sum, a) => sum + a.points, 0);
      const newPoints = points + earnedPoints;
      
      setUnlockedIds(newIds);
      setPoints(newPoints);
      setRecentAchievement(newAchievements[0]);
      
      await saveData(newStats, newIds, newPoints);
    } else {
      await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
    }
  }, [stats, unlockedIds, points]);

  const checkForNewAchievements = useCallback(async (): Promise<Achievement[]> => {
    const newAchievements = checkAchievements(stats, unlockedIds);
    
    if (newAchievements.length > 0) {
      const newIds = [...unlockedIds, ...newAchievements.map(a => a.id)];
      const earnedPoints = newAchievements.reduce((sum, a) => sum + a.points, 0);
      const newPoints = points + earnedPoints;
      
      setUnlockedIds(newIds);
      setPoints(newPoints);
      setRecentAchievement(newAchievements[0]);
      
      await saveData(stats, newIds, newPoints);
    }
    
    return newAchievements;
  }, [stats, unlockedIds, points]);

  const updateLoginStreak = useCallback(async () => {
    try {
      const lastLogin = await AsyncStorage.getItem(LAST_LOGIN_KEY);
      const today = new Date().toDateString();
      
      if (lastLogin === today) return;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      let newStreak = 1;
      if (lastLogin === yesterday.toDateString()) {
        newStreak = stats.loginStreak + 1;
      }
      
      const newStats = {
        ...stats,
        loginStreak: newStreak,
        longestStreak: Math.max(stats.longestStreak, newStreak),
      };
      
      setStats(newStats);
      await AsyncStorage.setItem(LAST_LOGIN_KEY, today);
      
      // Check for streak achievements
      const newAchievements = checkAchievements(newStats, unlockedIds);
      if (newAchievements.length > 0) {
        const newIds = [...unlockedIds, ...newAchievements.map(a => a.id)];
        const earnedPoints = newAchievements.reduce((sum, a) => sum + a.points, 0);
        const newPoints = points + earnedPoints;
        
        setUnlockedIds(newIds);
        setPoints(newPoints);
        setRecentAchievement(newAchievements[0]);
        
        await saveData(newStats, newIds, newPoints);
      } else {
        await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
      }
    } catch (error) {
      console.error("Error updating login streak:", error);
    }
  }, [stats, unlockedIds, points]);

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
