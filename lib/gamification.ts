// Gamification System - Achievements, Points, and Levels

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: "beginner" | "grower" | "expert" | "community" | "special";
  requirement: {
    type: "diagnoses" | "plants" | "harvests" | "journal" | "streak" | "community" | "yield";
    count: number;
  };
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt?: Date;
}

export interface UserStats {
  totalDiagnoses: number;
  totalPlants: number;
  totalHarvests: number;
  totalYield: number; // in grams
  journalEntries: number;
  loginStreak: number;
  longestStreak: number;
  communityPosts: number;
  helpfulAnswers: number;
  contestsWon: number;
}

export interface UserLevel {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  badge: string;
}

export const LEVELS: UserLevel[] = [
  { level: 1, title: "Keimling", minPoints: 0, maxPoints: 99, badge: "🌱" },
  { level: 2, title: "Setzling", minPoints: 100, maxPoints: 299, badge: "🌿" },
  { level: 3, title: "Jungpflanze", minPoints: 300, maxPoints: 599, badge: "🪴" },
  { level: 4, title: "Grower", minPoints: 600, maxPoints: 999, badge: "🌳" },
  { level: 5, title: "Experte", minPoints: 1000, maxPoints: 1999, badge: "🌲" },
  { level: 6, title: "Meister", minPoints: 2000, maxPoints: 3499, badge: "🏆" },
  { level: 7, title: "Großmeister", minPoints: 3500, maxPoints: 5499, badge: "👑" },
  { level: 8, title: "Legende", minPoints: 5500, maxPoints: 9999, badge: "⭐" },
  { level: 9, title: "Mythisch", minPoints: 10000, maxPoints: 19999, badge: "💎" },
  { level: 10, title: "Unsterblich", minPoints: 20000, maxPoints: Infinity, badge: "🔥" },
];

export const ACHIEVEMENTS: Achievement[] = [
  // Beginner Achievements
  {
    id: "first_diagnosis",
    title: "Erste Diagnose",
    description: "Führe deine erste Pflanzendiagnose durch",
    icon: "🔍",
    points: 10,
    category: "beginner",
    requirement: { type: "diagnoses", count: 1 },
    rarity: "common",
  },
  {
    id: "first_plant",
    title: "Grüner Daumen",
    description: "Füge deine erste Pflanze hinzu",
    icon: "🌱",
    points: 10,
    category: "beginner",
    requirement: { type: "plants", count: 1 },
    rarity: "common",
  },
  {
    id: "first_journal",
    title: "Tagebuch-Starter",
    description: "Erstelle deinen ersten Journal-Eintrag",
    icon: "📝",
    points: 10,
    category: "beginner",
    requirement: { type: "journal", count: 1 },
    rarity: "common",
  },
  
  // Grower Achievements
  {
    id: "diagnose_10",
    title: "Pflanzen-Doktor",
    description: "Führe 10 Diagnosen durch",
    icon: "🩺",
    points: 25,
    category: "grower",
    requirement: { type: "diagnoses", count: 10 },
    rarity: "common",
  },
  {
    id: "diagnose_50",
    title: "Diagnose-Experte",
    description: "Führe 50 Diagnosen durch",
    icon: "🔬",
    points: 75,
    category: "grower",
    requirement: { type: "diagnoses", count: 50 },
    rarity: "rare",
  },
  {
    id: "diagnose_100",
    title: "Diagnose-Meister",
    description: "Führe 100 Diagnosen durch",
    icon: "🧬",
    points: 150,
    category: "grower",
    requirement: { type: "diagnoses", count: 100 },
    rarity: "epic",
  },
  {
    id: "plants_5",
    title: "Kleiner Garten",
    description: "Verwalte 5 Pflanzen gleichzeitig",
    icon: "🌿",
    points: 30,
    category: "grower",
    requirement: { type: "plants", count: 5 },
    rarity: "common",
  },
  {
    id: "plants_20",
    title: "Plantage",
    description: "Verwalte 20 Pflanzen gleichzeitig",
    icon: "🌳",
    points: 100,
    category: "grower",
    requirement: { type: "plants", count: 20 },
    rarity: "rare",
  },
  {
    id: "first_harvest",
    title: "Erste Ernte",
    description: "Ernte deine erste Pflanze",
    icon: "🌾",
    points: 50,
    category: "grower",
    requirement: { type: "harvests", count: 1 },
    rarity: "common",
  },
  {
    id: "harvests_10",
    title: "Ernte-König",
    description: "Ernte 10 Pflanzen",
    icon: "👨‍🌾",
    points: 150,
    category: "grower",
    requirement: { type: "harvests", count: 10 },
    rarity: "rare",
  },
  
  // Expert Achievements
  {
    id: "yield_100g",
    title: "100g Club",
    description: "Erreiche einen Gesamtertrag von 100g",
    icon: "⚖️",
    points: 100,
    category: "expert",
    requirement: { type: "yield", count: 100 },
    rarity: "rare",
  },
  {
    id: "yield_500g",
    title: "500g Club",
    description: "Erreiche einen Gesamtertrag von 500g",
    icon: "🏅",
    points: 250,
    category: "expert",
    requirement: { type: "yield", count: 500 },
    rarity: "epic",
  },
  {
    id: "yield_1kg",
    title: "Kilo-Club",
    description: "Erreiche einen Gesamtertrag von 1kg",
    icon: "🏆",
    points: 500,
    category: "expert",
    requirement: { type: "yield", count: 1000 },
    rarity: "legendary",
  },
  {
    id: "streak_7",
    title: "Wöchentliche Routine",
    description: "Logge dich 7 Tage in Folge ein",
    icon: "📅",
    points: 30,
    category: "expert",
    requirement: { type: "streak", count: 7 },
    rarity: "common",
  },
  {
    id: "streak_30",
    title: "Monatliche Hingabe",
    description: "Logge dich 30 Tage in Folge ein",
    icon: "🗓️",
    points: 100,
    category: "expert",
    requirement: { type: "streak", count: 30 },
    rarity: "rare",
  },
  {
    id: "streak_100",
    title: "Unaufhaltsam",
    description: "Logge dich 100 Tage in Folge ein",
    icon: "🔥",
    points: 300,
    category: "expert",
    requirement: { type: "streak", count: 100 },
    rarity: "epic",
  },
  
  // Community Achievements
  {
    id: "community_first_post",
    title: "Community-Mitglied",
    description: "Erstelle deinen ersten Community-Beitrag",
    icon: "💬",
    points: 15,
    category: "community",
    requirement: { type: "community", count: 1 },
    rarity: "common",
  },
  {
    id: "community_10_posts",
    title: "Aktives Mitglied",
    description: "Erstelle 10 Community-Beiträge",
    icon: "🗣️",
    points: 50,
    category: "community",
    requirement: { type: "community", count: 10 },
    rarity: "common",
  },
  {
    id: "community_50_posts",
    title: "Community-Star",
    description: "Erstelle 50 Community-Beiträge",
    icon: "⭐",
    points: 150,
    category: "community",
    requirement: { type: "community", count: 50 },
    rarity: "rare",
  },
  
  // Special Achievements
  {
    id: "early_adopter",
    title: "Early Adopter",
    description: "Sei einer der ersten 1000 Nutzer",
    icon: "🚀",
    points: 200,
    category: "special",
    requirement: { type: "community", count: 0 },
    rarity: "legendary",
  },
  {
    id: "contest_winner",
    title: "Gewinnspiel-Sieger",
    description: "Gewinne ein Community-Gewinnspiel",
    icon: "🎉",
    points: 300,
    category: "special",
    requirement: { type: "community", count: 0 },
    rarity: "legendary",
  },
];

export function getLevelFromPoints(points: number): UserLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getProgressToNextLevel(points: number): number {
  const currentLevel = getLevelFromPoints(points);
  const nextLevelIndex = LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
  
  if (nextLevelIndex >= LEVELS.length) return 100;
  
  const nextLevel = LEVELS[nextLevelIndex];
  const pointsInCurrentLevel = points - currentLevel.minPoints;
  const pointsNeededForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
  
  return Math.min(100, Math.round((pointsInCurrentLevel / pointsNeededForNextLevel) * 100));
}

export function checkAchievements(stats: UserStats, unlockedIds: string[]): Achievement[] {
  const newlyUnlocked: Achievement[] = [];
  
  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.includes(achievement.id)) continue;
    
    let isUnlocked = false;
    
    switch (achievement.requirement.type) {
      case "diagnoses":
        isUnlocked = stats.totalDiagnoses >= achievement.requirement.count;
        break;
      case "plants":
        isUnlocked = stats.totalPlants >= achievement.requirement.count;
        break;
      case "harvests":
        isUnlocked = stats.totalHarvests >= achievement.requirement.count;
        break;
      case "yield":
        isUnlocked = stats.totalYield >= achievement.requirement.count;
        break;
      case "journal":
        isUnlocked = stats.journalEntries >= achievement.requirement.count;
        break;
      case "streak":
        isUnlocked = stats.loginStreak >= achievement.requirement.count || 
                     stats.longestStreak >= achievement.requirement.count;
        break;
      case "community":
        isUnlocked = stats.communityPosts >= achievement.requirement.count;
        break;
    }
    
    if (isUnlocked) {
      newlyUnlocked.push({ ...achievement, unlockedAt: new Date() });
    }
  }
  
  return newlyUnlocked;
}

export function getRarityColor(rarity: Achievement["rarity"]): string {
  switch (rarity) {
    case "common": return "#9CA3AF";
    case "rare": return "#3B82F6";
    case "epic": return "#8B5CF6";
    case "legendary": return "#F59E0B";
  }
}

export function getCategoryLabel(category: Achievement["category"]): string {
  switch (category) {
    case "beginner": return "Anfänger";
    case "grower": return "Grower";
    case "expert": return "Experte";
    case "community": return "Community";
    case "special": return "Spezial";
  }
}
