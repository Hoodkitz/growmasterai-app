import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useGamification } from "@/lib/gamification-context";
import { Achievement, getRarityColor, getCategoryLabel, LEVELS } from "@/lib/gamification";

type TabType = "achievements" | "levels";

export default function AchievementsScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { 
    stats, 
    points, 
    level, 
    levelProgress, 
    unlockedAchievements, 
    lockedAchievements 
  } = useGamification();
  
  const [activeTab, setActiveTab] = useState<TabType>("achievements");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ["beginner", "grower", "expert", "community", "special"];
  
  const filteredUnlocked = selectedCategory 
    ? unlockedAchievements.filter(a => a.category === selectedCategory)
    : unlockedAchievements;
    
  const filteredLocked = selectedCategory
    ? lockedAchievements.filter(a => a.category === selectedCategory)
    : lockedAchievements;

  const renderAchievement = (achievement: Achievement, isLocked: boolean) => (
    <View 
      key={achievement.id}
      className={`bg-surface rounded-2xl p-4 border ${isLocked ? 'opacity-50 border-border' : 'border-primary/30'}`}
    >
      <View className="flex-row items-start gap-3">
        <View 
          className="w-14 h-14 rounded-xl items-center justify-center"
          style={{ backgroundColor: isLocked ? colors.muted + "30" : getRarityColor(achievement.rarity) + "30" }}
        >
          <Text className="text-2xl">{isLocked ? "🔒" : achievement.icon}</Text>
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className={`text-base font-semibold ${isLocked ? 'text-muted' : 'text-foreground'}`}>
              {achievement.title}
            </Text>
            <View 
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: getRarityColor(achievement.rarity) + "30" }}
            >
              <Text 
                className="text-xs font-medium"
                style={{ color: getRarityColor(achievement.rarity) }}
              >
                {achievement.rarity.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text className={`text-sm ${isLocked ? 'text-muted' : 'text-muted'} mb-2`}>
            {achievement.description}
          </Text>
          
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-muted">
              {getCategoryLabel(achievement.category)}
            </Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-sm font-bold text-primary">+{achievement.points}</Text>
              <Text className="text-xs text-muted">Punkte</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pb-4 border-b border-border">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Erfolge</Text>
        </View>

        {/* Level Card */}
        <View className="bg-primary/10 rounded-2xl p-4 border border-primary/30">
          <View className="flex-row items-center gap-4 mb-3">
            <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center">
              <Text className="text-3xl">{level.badge}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">{level.title}</Text>
              <Text className="text-sm text-muted">Level {level.level}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xl font-bold text-primary">{points}</Text>
              <Text className="text-xs text-muted">Punkte</Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          <View className="h-2 bg-background rounded-full overflow-hidden">
            <View 
              className="h-full bg-primary rounded-full"
              style={{ width: `${levelProgress}%` }}
            />
          </View>
          <Text className="text-xs text-muted text-center mt-2">
            {levelProgress}% zum nächsten Level
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2 mt-4">
          <TouchableOpacity 
            className={`flex-1 py-2 rounded-full ${activeTab === 'achievements' ? 'bg-primary' : 'bg-surface'}`}
            onPress={() => setActiveTab("achievements")}
          >
            <Text className={`text-center font-medium ${activeTab === 'achievements' ? 'text-white' : 'text-muted'}`}>
              Erfolge ({unlockedAchievements.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 py-2 rounded-full ${activeTab === 'levels' ? 'bg-primary' : 'bg-surface'}`}
            onPress={() => setActiveTab("levels")}
          >
            <Text className={`text-center font-medium ${activeTab === 'levels' ? 'text-white' : 'text-muted'}`}>
              Level
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === "achievements" ? (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="px-4 py-3"
          >
            <TouchableOpacity 
              className={`px-4 py-2 rounded-full mr-2 ${!selectedCategory ? 'bg-primary' : 'bg-surface'}`}
              onPress={() => setSelectedCategory(null)}
            >
              <Text className={`text-sm font-medium ${!selectedCategory ? 'text-white' : 'text-muted'}`}>
                Alle
              </Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity 
                key={cat}
                className={`px-4 py-2 rounded-full mr-2 ${selectedCategory === cat ? 'bg-primary' : 'bg-surface'}`}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text className={`text-sm font-medium ${selectedCategory === cat ? 'text-white' : 'text-muted'}`}>
                  {getCategoryLabel(cat as any)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="px-4 pb-8 gap-3">
            {/* Unlocked */}
            {filteredUnlocked.length > 0 && (
              <>
                <Text className="text-lg font-semibold text-foreground mt-2">
                  Freigeschaltet ({filteredUnlocked.length})
                </Text>
                {filteredUnlocked.map(a => renderAchievement(a, false))}
              </>
            )}

            {/* Locked */}
            {filteredLocked.length > 0 && (
              <>
                <Text className="text-lg font-semibold text-foreground mt-4">
                  Noch zu erreichen ({filteredLocked.length})
                </Text>
                {filteredLocked.map(a => renderAchievement(a, true))}
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          <View className="gap-3">
            {LEVELS.map((lvl, index) => {
              const isCurrentLevel = lvl.level === level.level;
              const isUnlocked = points >= lvl.minPoints;
              
              return (
                <View 
                  key={lvl.level}
                  className={`bg-surface rounded-2xl p-4 border ${isCurrentLevel ? 'border-primary' : 'border-border'} ${!isUnlocked && 'opacity-50'}`}
                >
                  <View className="flex-row items-center gap-4">
                    <View 
                      className={`w-14 h-14 rounded-full items-center justify-center ${isCurrentLevel ? 'bg-primary/20' : 'bg-muted/20'}`}
                    >
                      <Text className="text-2xl">{lvl.badge}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base font-semibold text-foreground">
                          Level {lvl.level}: {lvl.title}
                        </Text>
                        {isCurrentLevel && (
                          <View className="bg-primary px-2 py-0.5 rounded-full">
                            <Text className="text-xs font-medium text-white">AKTUELL</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm text-muted">
                        {lvl.minPoints.toLocaleString()} - {lvl.maxPoints === Infinity ? "∞" : lvl.maxPoints.toLocaleString()} Punkte
                      </Text>
                    </View>
                    {isUnlocked && (
                      <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
