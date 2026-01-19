import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, TextInput, Linking, Dimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { useGamification } from "@/lib/gamification-context";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { AdBanner } from "@/components/ad-banner";
import {
  MOCK_POSTS,
  MOCK_CONTESTS,
  MOCK_LEADERBOARD,
  MOCK_AUCTIONS,
  MOCK_RAFFLES,
  MOCK_DEALS,
  formatRelativeTime,
  formatTimeRemaining,
} from "@/lib/community";
import {
  NEWS_ARTICLES,
  LEGAL_INFO,
  FAQ_DATA,
  getCategoryLabel,
  getCategoryColor,
  formatNewsDate,
} from "@/lib/news-data";
import {
  MOCK_SHOPS,
  MOCK_CLUBS,
  MOCK_NEARBY_MEMBERS,
  TUTORIAL_VIDEOS,
  formatViews,
  getCategoryLabel as getTutorialCategory,
} from "@/lib/locations-data";
import {
  STRAINS_DATABASE,
  getDifficultyLabel,
  getDifficultyColor,
  getTypeLabel,
  getTypeColor,
} from "@/lib/strains-data";

const { width } = Dimensions.get("window");

type TabType = "feed" | "news" | "radar" | "tutorials" | "strains" | "contests";

export default function CommunityScreen() {
  const router = useRouter();
  const colors = useColors();
  const { tier } = useSubscription();
  const { level, points } = useGamification();

  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [newsCategory, setNewsCategory] = useState<"all" | "law" | "tips">("all");

  const postsQuery = trpc.community.listPosts.useQuery({ limit: 20 });
  const posts = postsQuery.data?.items || [];

  const onRefresh = async () => {
    await postsQuery.refetch();
  };

  const likeMutation = trpc.community.createComment.useMutation(); // TODO: Implement real like mutation

  const toggleLike = (postId: number) => {
    // Optimistic update or real mutation
    // For now just placeholder
  };
  const [radarTab, setRadarTab] = useState<"members" | "shops" | "clubs">("shops");
  const [tutorialCategory, setTutorialCategory] = useState<string>("all");
  const [strainFilter, setStrainFilter] = useState<"all" | "beginner" | "indica" | "sativa">("all");
  const [searchQuery, setSearchQuery] = useState("");



  const tabs = [
    { id: "feed" as TabType, label: "Feed", icon: "bubble.left.fill" },
    { id: "news" as TabType, label: "News", icon: "newspaper.fill" },
    { id: "radar" as TabType, label: "Radar", icon: "location.fill" },
    { id: "tutorials" as TabType, label: "Tutorials", icon: "play.circle.fill" },
    { id: "strains" as TabType, label: "Sorten", icon: "leaf.fill" },
    { id: "contests" as TabType, label: "Events", icon: "trophy.fill" },
  ];

  const filteredNews = NEWS_ARTICLES.filter(article =>
    newsCategory === "all" || article.category === newsCategory
  );

  const filteredStrains = STRAINS_DATABASE.filter(strain => {
    if (strainFilter === "beginner") return strain.difficulty === "beginner";
    if (strainFilter === "indica") return strain.type === "indica";
    if (strainFilter === "sativa") return strain.type === "sativa";
    return true;
  }).filter(strain =>
    searchQuery === "" || strain.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTutorials = TUTORIAL_VIDEOS.filter(video =>
    tutorialCategory === "all" || video.category === tutorialCategory
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pb-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-foreground">Community</Text>
            <Text className="text-sm text-muted">Entdecken, Lernen, Vernetzen</Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center"
            onPress={() => router.push("/achievements")}
          >
            <Text className="text-lg">{level.badge}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-4"
        contentContainerStyle={{ gap: 8 }}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full ${activeTab === tab.id ? 'bg-primary' : 'bg-surface'
              }`}
            onPress={() => setActiveTab(tab.id)}
          >
            <IconSymbol
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.id ? "#fff" : colors.muted}
            />
            <Text className={`text-sm font-medium ${activeTab === tab.id ? 'text-white' : 'text-muted'
              }`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={postsQuery.isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Feed Tab */}
        {activeTab === "feed" && (
          <View className="px-4 gap-4">
            {/* Create Post */}
            <TouchableOpacity className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                <Text className="text-lg">{level.badge}</Text>
              </View>
              <Text className="text-muted flex-1">Teile deinen Grow...</Text>
              <IconSymbol name="camera.fill" size={20} color={colors.primary} />
            </TouchableOpacity>

            {/* Posts */}
            {postsQuery.isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              posts.map(({ post, user }) => (
                <View key={post.id} className="bg-surface rounded-xl border border-border overflow-hidden">
                  <View className="p-4">
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                        {/* Placeholder for badge/avatar */}
                        <Text className="text-lg">{(user?.name || "?").charAt(0).toUpperCase()}</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-base font-semibold text-foreground">{user?.name || "Unknown"}</Text>
                          <Text className="text-xs text-muted">Lv.{user?.level || 1}</Text>
                        </View>
                        <Text className="text-xs text-muted">{formatRelativeTime(new Date(post.createdAt))}</Text>
                      </View>
                    </View>
                    <Text className="text-base text-foreground mb-3">{post.content}</Text>
                    {/* Images handled here if present */}

                    <View className="flex-row items-center gap-4 pt-3 border-t border-border">
                      <TouchableOpacity className="flex-row items-center gap-1" onPress={() => toggleLike(post.id)}>
                        <IconSymbol name={"heart"} size={18} color={colors.muted} />
                        <Text className={`text-sm text-muted`}>{post.likes}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="flex-row items-center gap-1">
                        <IconSymbol name="bubble.left.fill" size={18} color={colors.muted} />
                        <Text className="text-sm text-muted">{post.comments}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="flex-row items-center gap-1">
                        <IconSymbol name="paperplane.fill" size={18} color={colors.muted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )))}

            {/* Leaderboard Preview */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-foreground">🏆 Top Grower</Text>
                <TouchableOpacity onPress={() => setActiveTab("contests")}>
                  <Text className="text-sm text-primary">Alle anzeigen</Text>
                </TouchableOpacity>
              </View>
              {MOCK_LEADERBOARD.slice(0, 3).map((entry, index) => (
                <View key={entry.rank} className="flex-row items-center gap-3 py-2">
                  <Text className="text-lg font-bold w-6" style={{
                    color: index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32"
                  }}>
                    {entry.rank}
                  </Text>
                  <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                    <Text>{entry.userBadge || "🌱"}</Text>
                  </View>
                  <Text className="text-base text-foreground flex-1">{entry.userName}</Text>
                  <Text className="text-sm text-primary font-medium">{entry.totalYield}g</Text>
                </View>
              ))}
            </View>

            <AdBanner position="community" variant="medium" />
          </View>
        )}

        {/* News Tab */}
        {activeTab === "news" && (
          <View className="px-4 gap-4">
            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
              <View className="flex-row gap-2">
                {[
                  { id: "all", label: "Alle" },
                  { id: "law", label: "Gesetzgebung" },
                  { id: "tips", label: "Tipps" },
                ].map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    className={`px-4 py-2 rounded-full ${newsCategory === cat.id ? 'bg-primary' : 'bg-surface'}`}
                    onPress={() => setNewsCategory(cat.id as any)}
                  >
                    <Text className={newsCategory === cat.id ? 'text-white' : 'text-muted'}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Legal Info Card */}
            <View className="bg-error/10 rounded-xl p-4 border border-error/30">
              <View className="flex-row items-center gap-2 mb-3">
                <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} />
                <Text className="text-lg font-semibold text-foreground">Aktuelle Rechtslage DE</Text>
              </View>
              <View className="gap-2">
                {LEGAL_INFO.slice(0, 4).map(info => (
                  <TouchableOpacity key={info.id} className="flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-error" />
                    <Text className="text-sm text-foreground flex-1">{info.title}: {info.details[0]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* News Articles */}
            {filteredNews.map(article => (
              <TouchableOpacity key={article.id} className="bg-surface rounded-xl border border-border overflow-hidden">
                {article.isPinned && (
                  <View className="bg-primary px-3 py-1">
                    <Text className="text-xs font-medium text-white">📌 Wichtig</Text>
                  </View>
                )}
                <View className="p-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: getCategoryColor(article.category) + "20" }}>
                      <Text className="text-xs font-medium" style={{ color: getCategoryColor(article.category) }}>{getCategoryLabel(article.category)}</Text>
                    </View>
                    <Text className="text-xs text-muted">{formatNewsDate(article.publishedAt)}</Text>
                  </View>
                  <Text className="text-base font-semibold text-foreground mb-1">{article.title}</Text>
                  <Text className="text-sm text-muted mb-2">{article.summary}</Text>
                  <Text className="text-xs text-primary">Quelle: {article.source}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* FAQ Section */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">❓ Häufige Fragen</Text>
              {FAQ_DATA.slice(0, 4).map(faq => (
                <TouchableOpacity key={faq.id} className="py-3 border-b border-border last:border-0">
                  <Text className="text-sm font-medium text-foreground mb-1">{faq.question}</Text>
                  <Text className="text-xs text-muted" numberOfLines={2}>{faq.answer}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Radar Tab */}
        {activeTab === "radar" && (
          <View className="px-4 gap-4">
            {/* Radar Sub-Tabs */}
            <View className="flex-row gap-2">
              {[
                { id: "shops", label: "Shops", icon: "cart.fill" },
                { id: "clubs", label: "Clubs", icon: "person.3.fill" },
                { id: "members", label: "Grower", icon: "person.fill" },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  className={`flex-1 flex-row items-center justify-center gap-1 py-3 rounded-xl ${radarTab === tab.id ? 'bg-primary' : 'bg-surface'}`}
                  onPress={() => setRadarTab(tab.id as any)}
                >
                  <IconSymbol name={tab.icon as any} size={16} color={radarTab === tab.id ? "#fff" : colors.muted} />
                  <Text className={radarTab === tab.id ? 'text-white font-medium' : 'text-muted'}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Map Placeholder */}
            <View className="h-48 bg-surface rounded-xl border border-border items-center justify-center">
              <IconSymbol name="map.fill" size={48} color={colors.muted} />
              <Text className="text-sm text-muted mt-2">Karte wird geladen...</Text>
              <Text className="text-xs text-muted">Standortfreigabe erforderlich</Text>
            </View>

            {/* Shops List */}
            {radarTab === "shops" && MOCK_SHOPS.map(shop => (
              <TouchableOpacity key={shop.id} className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row items-start gap-3">
                  <View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center">
                    <IconSymbol name={shop.type === "headshop" ? "bag.fill" : "leaf.fill"} size={24} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold text-foreground">{shop.name}</Text>
                      {shop.isVerified && <IconSymbol name="checkmark.seal.fill" size={14} color={colors.primary} />}
                    </View>
                    <Text className="text-xs text-muted">{shop.address}, {shop.city}</Text>
                    <View className="flex-row items-center gap-1 mt-1">
                      <IconSymbol name="star.fill" size={12} color={colors.warning} />
                      <Text className="text-xs text-foreground">{shop.rating}</Text>
                      <Text className="text-xs text-muted">({shop.reviewCount})</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-primary font-medium">{shop.type === "headshop" ? "Headshop" : "Growshop"}</Text>
                </View>
                {shop.features && (
                  <View className="flex-row flex-wrap gap-1 mt-3">
                    {shop.features.slice(0, 4).map(feature => (
                      <View key={feature} className="bg-background px-2 py-0.5 rounded-full">
                        <Text className="text-xs text-muted">{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Clubs List */}
            {radarTab === "clubs" && MOCK_CLUBS.map(club => (
              <TouchableOpacity key={club.id} className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row items-start gap-3">
                  <View className="w-12 h-12 rounded-xl bg-success/20 items-center justify-center">
                    <IconSymbol name="person.3.fill" size={24} color={colors.success} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold text-foreground">{club.name}</Text>
                      {club.isVerified && <IconSymbol name="checkmark.seal.fill" size={14} color={colors.success} />}
                    </View>
                    <Text className="text-xs text-muted">{club.city}</Text>
                    <View className="flex-row items-center gap-1 mt-1">
                      <IconSymbol name="star.fill" size={12} color={colors.warning} />
                      <Text className="text-xs text-foreground">{club.rating}</Text>
                    </View>
                  </View>
                  <TouchableOpacity className="bg-success/20 px-3 py-1 rounded-full">
                    <Text className="text-xs font-medium text-success">Anfragen</Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-sm text-muted mt-2">{club.description}</Text>
              </TouchableOpacity>
            ))}

            {/* Members List */}
            {radarTab === "members" && (
              <>
                {tier === "free" ? (
                  <UpgradePrompt feature="Member Radar" />
                ) : (
                  MOCK_NEARBY_MEMBERS.map(member => (
                    <TouchableOpacity key={member.id} className="bg-surface rounded-xl p-4 border border-border">
                      <View className="flex-row items-center gap-3">
                        <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center">
                          <Text className="text-2xl">{member.badge}</Text>
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-base font-semibold text-foreground">{member.userName}</Text>
                            {member.isOnline && <View className="w-2 h-2 rounded-full bg-success" />}
                          </View>
                          <Text className="text-xs text-muted">Level {member.level} • {member.experienceYears} Jahre Erfahrung</Text>
                        </View>
                        <Text className="text-sm text-primary font-medium">{member.distance} km</Text>
                      </View>
                      <View className="flex-row flex-wrap gap-1 mt-2">
                        {member.specialties.map(spec => (
                          <View key={spec} className="bg-primary/10 px-2 py-0.5 rounded-full">
                            <Text className="text-xs text-primary">{spec}</Text>
                          </View>
                        ))}
                      </View>
                      {member.bio && <Text className="text-sm text-muted mt-2">{member.bio}</Text>}
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </View>
        )}

        {/* Tutorials Tab */}
        {activeTab === "tutorials" && (
          <View className="px-4 gap-4">
            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
              <View className="flex-row gap-2">
                {[
                  { id: "all", label: "Alle" },
                  { id: "basics", label: "Grundlagen" },
                  { id: "problems", label: "Probleme" },
                  { id: "harvest", label: "Ernte" },
                  { id: "equipment", label: "Equipment" },
                ].map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    className={`px-4 py-2 rounded-full ${tutorialCategory === cat.id ? 'bg-primary' : 'bg-surface'}`}
                    onPress={() => setTutorialCategory(cat.id)}
                  >
                    <Text className={tutorialCategory === cat.id ? 'text-white' : 'text-muted'}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Video List */}
            {filteredTutorials.map(video => (
              <TouchableOpacity key={video.id} className="bg-surface rounded-xl border border-border overflow-hidden">
                <View className="h-40 bg-background items-center justify-center relative">
                  <IconSymbol name="play.circle.fill" size={48} color={colors.primary} />
                  <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded">
                    <Text className="text-xs text-white">{video.duration}</Text>
                  </View>
                  {video.isPremium && tier === "free" && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <IconSymbol name="lock.fill" size={32} color="#fff" />
                      <Text className="text-white text-sm mt-1">Premium</Text>
                    </View>
                  )}
                </View>
                <View className="p-3">
                  <Text className="text-base font-semibold text-foreground mb-1" numberOfLines={2}>{video.title}</Text>
                  <Text className="text-xs text-muted mb-2">{video.channel}</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-muted">{formatViews(video.views)} Aufrufe</Text>
                    <View className={`px-2 py-0.5 rounded-full ${video.difficulty === "beginner" ? "bg-success/20" :
                      video.difficulty === "intermediate" ? "bg-warning/20" : "bg-error/20"
                      }`}>
                      <Text className={`text-xs ${video.difficulty === "beginner" ? "text-success" :
                        video.difficulty === "intermediate" ? "text-warning" : "text-error"
                        }`}>
                        {video.difficulty === "beginner" ? "Anfänger" : video.difficulty === "intermediate" ? "Mittel" : "Fortgeschritten"}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Strains Tab */}
        {activeTab === "strains" && (
          <View className="px-4 gap-4">
            {/* Search */}
            <View className="bg-surface rounded-xl px-4 py-3 flex-row items-center gap-2 border border-border">
              <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
              <TextInput
                className="flex-1 text-foreground"
                placeholder="Sorte suchen..."
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
              <View className="flex-row gap-2">
                {[
                  { id: "all", label: "Alle" },
                  { id: "beginner", label: "Anfänger" },
                  { id: "indica", label: "Indica" },
                  { id: "sativa", label: "Sativa" },
                ].map(filter => (
                  <TouchableOpacity
                    key={filter.id}
                    className={`px-4 py-2 rounded-full ${strainFilter === filter.id ? 'bg-primary' : 'bg-surface'}`}
                    onPress={() => setStrainFilter(filter.id as any)}
                  >
                    <Text className={strainFilter === filter.id ? 'text-white' : 'text-muted'}>{filter.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Strain List */}
            {filteredStrains.map(strain => (
              <TouchableOpacity key={strain.id} className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row items-start gap-3">
                  <View className="w-14 h-14 rounded-xl items-center justify-center" style={{ backgroundColor: getTypeColor(strain.type) + "20" }}>
                    <Text className="text-2xl">🌿</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold text-foreground">{strain.name}</Text>
                      {strain.isPremium && (
                        <View className="bg-warning/20 px-1.5 py-0.5 rounded">
                          <Text className="text-xs text-warning">⭐</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: getTypeColor(strain.type) + "20" }}>
                        <Text className="text-xs" style={{ color: getTypeColor(strain.type) }}>{getTypeLabel(strain.type)}</Text>
                      </View>
                      <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: getDifficultyColor(strain.difficulty) + "20" }}>
                        <Text className="text-xs" style={{ color: getDifficultyColor(strain.difficulty) }}>{getDifficultyLabel(strain.difficulty)}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="items-end">
                    <View className="flex-row items-center gap-1">
                      <IconSymbol name="star.fill" size={14} color={colors.warning} />
                      <Text className="text-sm font-medium text-foreground">{strain.rating}</Text>
                    </View>
                    <Text className="text-xs text-muted">{strain.reviewCount} Reviews</Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-border">
                  <View>
                    <Text className="text-xs text-muted">THC</Text>
                    <Text className="text-sm font-medium text-foreground">{strain.thcMin}-{strain.thcMax}%</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted">Blüte</Text>
                    <Text className="text-sm font-medium text-foreground">{strain.floweringWeeks} Wo.</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted">Ertrag</Text>
                    <Text className="text-sm font-medium text-foreground">{strain.yieldIndoor}g/m²</Text>
                  </View>
                </View>

                {/* Affiliate Links */}
                {strain.affiliateLinks.length > 0 && (
                  <View className="mt-3 pt-3 border-t border-border">
                    <Text className="text-xs text-muted mb-2">🛒 Samen kaufen:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row gap-2">
                        {strain.affiliateLinks.map((link, index) => (
                          <TouchableOpacity
                            key={index}
                            className="bg-primary/10 px-3 py-2 rounded-lg flex-row items-center gap-2"
                            onPress={() => Linking.openURL(link.url)}
                          >
                            <Text className="text-sm font-medium text-primary">{link.shop}</Text>
                            <Text className="text-xs text-muted">€{link.price}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Contests Tab */}
        {activeTab === "contests" && (
          <View className="px-4 gap-4">
            {/* Active Contests */}
            <Text className="text-lg font-semibold text-foreground">🏆 Aktive Gewinnspiele</Text>
            {MOCK_CONTESTS.map(contest => (
              <TouchableOpacity key={contest.id} className="bg-surface rounded-xl border border-border overflow-hidden">
                <View className="h-32 bg-gradient-to-br from-primary/20 to-success/20 items-center justify-center">
                  <Text className="text-4xl">{contest.type === "yield" ? "🌿" : contest.type === "photo" ? "📸" : "🎰"}</Text>
                </View>
                <View className="p-4">
                  <Text className="text-base font-semibold text-foreground">{contest.title}</Text>
                  <Text className="text-sm text-muted mt-1">{contest.description}</Text>
                  <View className="flex-row items-center justify-between mt-3">
                    <View>
                      <Text className="text-xs text-muted">Preis</Text>
                      <Text className="text-sm font-medium text-primary">{contest.prize}</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-muted">Teilnehmer</Text>
                      <Text className="text-sm font-medium text-foreground">{contest.participants}</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-muted">Endet in</Text>
                      <Text className="text-sm font-medium text-warning">{formatTimeRemaining(contest.endDate)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity className={`mt-3 py-2 rounded-lg ${contest.isJoined ? 'bg-success/20' : 'bg-primary'}`}>
                    <Text className={`text-center text-sm font-semibold ${contest.isJoined ? 'text-success' : 'text-white'}`}>
                      {contest.isJoined ? "✓ Teilgenommen" : "Teilnehmen"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            {/* Leaderboard */}
            <Text className="text-lg font-semibold text-foreground mt-4">📊 Rangliste</Text>
            {MOCK_LEADERBOARD.map((entry, index) => (
              <View key={entry.rank} className={`flex-row items-center p-3 rounded-xl ${index < 3 ? 'bg-primary/10 border border-primary/30' : 'bg-surface border border-border'}`}>
                <View className="w-10 items-center">
                  {index === 0 ? <Text className="text-2xl">🥇</Text> :
                    index === 1 ? <Text className="text-2xl">🥈</Text> :
                      index === 2 ? <Text className="text-2xl">🥉</Text> :
                        <Text className="text-lg font-bold text-muted">#{entry.rank}</Text>}
                </View>
                <View className="flex-row items-center gap-3 flex-1 ml-2">
                  <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                    <Text className="text-lg">{entry.userBadge}</Text>
                  </View>
                  <View>
                    <Text className="text-base font-semibold text-foreground">{entry.userName}</Text>
                    <Text className="text-xs text-muted">Level {entry.userLevel}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-base font-bold text-primary">{entry.totalYield.toLocaleString()}g</Text>
                  <Text className="text-xs text-muted">{entry.points.toLocaleString()} Punkte</Text>
                </View>
              </View>
            ))}

            {/* Auctions */}
            <Text className="text-lg font-semibold text-foreground mt-4">🔨 Auktionen</Text>
            {MOCK_AUCTIONS.slice(0, 2).map(auction => (
              <TouchableOpacity key={auction.id} className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row items-center gap-3">
                  <View className="w-16 h-16 rounded-xl bg-warning/20 items-center justify-center">
                    <Text className="text-2xl">{auction.vendorLogo}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">{auction.title}</Text>
                    <Text className="text-xs text-muted">{auction.vendorName}</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <Text className="text-sm font-bold text-warning">€{auction.currentBid}</Text>
                      <Text className="text-xs text-muted">{auction.bids} Gebote</Text>
                    </View>
                  </View>
                  <TouchableOpacity className="bg-warning/20 px-3 py-2 rounded-lg">
                    <Text className="text-sm font-medium text-warning">Bieten</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            {/* Raffles */}
            <Text className="text-lg font-semibold text-foreground mt-4">🎰 Verlosungen</Text>
            {MOCK_RAFFLES.slice(0, 2).map(raffle => (
              <TouchableOpacity key={raffle.id} className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row items-center gap-3">
                  <View className="w-16 h-16 rounded-xl bg-success/20 items-center justify-center">
                    <Text className="text-2xl">{raffle.vendorLogo}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">{raffle.title}</Text>
                    <Text className="text-xs text-muted">{raffle.vendorName}</Text>
                    <Text className="text-sm text-muted mt-1">{raffle.soldTickets}/{raffle.totalTickets} Tickets</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-lg font-bold text-success">€{raffle.ticketPrice}</Text>
                    <Text className="text-xs text-muted">pro Los</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {/* Deals */}
            <Text className="text-lg font-semibold text-foreground mt-4">💰 Equipment Deals</Text>
            {MOCK_DEALS.slice(0, 2).map(deal => (
              <TouchableOpacity key={deal.id} className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row items-center gap-3">
                  <View className="w-16 h-16 rounded-xl bg-primary/20 items-center justify-center">
                    <Text className="text-2xl">{deal.vendorLogo}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">{deal.title}</Text>
                    <Text className="text-xs text-muted">{deal.vendorName}</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <Text className="text-sm font-bold text-success">€{deal.salePrice}</Text>
                      <Text className="text-xs text-muted line-through">€{deal.originalPrice}</Text>
                      <View className="bg-error/20 px-1.5 py-0.5 rounded">
                        <Text className="text-xs font-bold text-error">-{deal.discount}%</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity className="bg-success px-3 py-2 rounded-lg">
                    <Text className="text-sm font-medium text-white">Kaufen</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="h-24" />
      </ScrollView>
    </ScreenContainer>
  );
}
