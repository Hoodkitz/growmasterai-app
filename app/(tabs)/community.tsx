import { useState } from "react";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, TextInput, Linking, Dimensions, ActivityIndicator, Alert } from "react-native";
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
  TUTORIAL_VIDEOS,
  getTutorialUrl,
  getCategoryLabel as getTutorialCategory,
  fetchNearbyShops,
  type NearbyShopsResult,
} from "@/lib/locations-data";
import { minimumNextBid } from "@/lib/auction-rules";
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

  const utils = trpc.useUtils();
  const LIKED_KEY = "community_liked_posts";
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(LIKED_KEY)
      .then(raw => raw && setLikedPosts(JSON.parse(raw)))
      .catch(() => { });
  }, []);

  const likeMutation = trpc.community.likePost.useMutation({
    onSuccess: () => utils.community.listPosts.invalidate(),
  });

  const createPostMutation = trpc.community.createPost.useMutation({
    onSuccess: () => {
      setComposerText("");
      setComposerOpen(false);
      utils.community.listPosts.invalidate();
    },
    onError: () => Alert.alert("Fehler", "Beitrag konnte nicht gespeichert werden. Bist du angemeldet?"),
  });

  const toggleLike = (postId: number) => {
    const liked = likedPosts.includes(postId);
    const next = liked ? likedPosts.filter(id => id !== postId) : [...likedPosts, postId];
    setLikedPosts(next);
    AsyncStorage.setItem(LIKED_KEY, JSON.stringify(next)).catch(() => { });
    likeMutation.mutate({ postId, like: !liked });
  };

  const submitPost = () => {
    const content = composerText.trim();
    if (!content) return;
    createPostMutation.mutate({ type: "post", content });
  };

  const leaderboardQuery = trpc.community.leaderboard.useQuery({ limit: 10 });
  const leaderboard = leaderboardQuery.data || [];
  const auctionsQuery = trpc.marketplace.listAuctions.useQuery(undefined, { enabled: activeTab === "contests" });
  const rafflesQuery = trpc.marketplace.listRaffles.useQuery(undefined, { enabled: activeTab === "contests" });
  const dealsQuery = trpc.marketplace.listProducts.useQuery({ featuredOnly: true, limit: 5 }, { enabled: activeTab === "contests" });
  const auctionsList = (auctionsQuery.data || []).slice(0, 5);
  const rafflesList = (rafflesQuery.data || []).slice(0, 5);
  const dealsList = dealsQuery.data || [];
  const [radarTab, setRadarTab] = useState<"members" | "shops" | "clubs">("shops");
  const [shopsResult, setShopsResult] = useState<NearbyShopsResult | null>(null);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [bidInputs, setBidInputs] = useState<Record<number, string>>({});
  const myRafflesQuery = trpc.marketplace.myRaffleEntries.useQuery(undefined, { enabled: activeTab === "contests", retry: false });
  const enteredRaffles = myRafflesQuery.data ?? [];
  const placeBidMutation = trpc.marketplace.placeBid.useMutation({
    onSuccess: (_d, vars) => {
      setBidInputs(prev => ({ ...prev, [vars.auctionId]: "" }));
      utils.marketplace.listAuctions.invalidate();
      Alert.alert("Gebot abgegeben", `Dein Gebot über €${vars.amount.toFixed(2)} wurde gespeichert.`);
    },
    onError: (e) => Alert.alert("Gebot nicht möglich", e.message),
  });
  const enterRaffleMutation = trpc.marketplace.enterRaffle.useMutation({
    onSuccess: () => {
      utils.marketplace.listRaffles.invalidate();
      utils.marketplace.myRaffleEntries.invalidate();
      Alert.alert("Dabei!", "Du nimmst an der Verlosung teil.");
    },
    onError: (e) => Alert.alert("Teilnahme nicht möglich", e.message),
  });

  const loadShops = async (forceRefresh = false) => {
    setShopsLoading(true);
    try {
      setShopsResult(await fetchNearbyShops({ forceRefresh }));
    } finally {
      setShopsLoading(false);
    }
  };

  const submitBid = (auctionId: number) => {
    const amount = Number((bidInputs[auctionId] ?? "").replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("Ungültiger Betrag", "Bitte gib einen gültigen Betrag ein.");
      return;
    }
    placeBidMutation.mutate({ auctionId, amount });
  };
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
            <TouchableOpacity
              className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3"
              onPress={() => setComposerOpen(o => !o)}
            >
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                <Text className="text-lg">{level.badge}</Text>
              </View>
              <Text className="text-muted flex-1">Teile deinen Grow...</Text>
              <IconSymbol name="camera.fill" size={20} color={colors.primary} />
            </TouchableOpacity>

            {composerOpen && (
              <View className="bg-surface rounded-xl p-4 border border-border gap-3">
                <TextInput
                  className="text-base text-foreground min-h-[80px]"
                  placeholder="Was gibt's Neues in deinem Grow?"
                  placeholderTextColor={colors.muted}
                  multiline
                  maxLength={2000}
                  value={composerText}
                  onChangeText={setComposerText}
                  style={{ textAlignVertical: "top" }}
                />
                <View className="flex-row justify-end gap-2">
                  <TouchableOpacity className="px-4 py-2" onPress={() => setComposerOpen(false)}>
                    <Text className="text-muted">Abbrechen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`px-4 py-2 rounded-lg ${composerText.trim() ? "bg-primary" : "bg-primary/40"}`}
                    disabled={!composerText.trim() || createPostMutation.isPending}
                    onPress={submitPost}
                  >
                    <Text className="text-white font-semibold">{createPostMutation.isPending ? "..." : "Posten"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Posts */}
            {postsQuery.isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              posts.length === 0 ? (
                <Text className="text-center text-muted py-8">Noch keine Beiträge – sei der Erste!</Text>
              ) : posts.map(({ post, user }) => (
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
                        <IconSymbol name={"heart"} size={18} color={likedPosts.includes(post.id) ? colors.error : colors.muted} />
                        <Text className={`text-sm ${likedPosts.includes(post.id) ? "text-error" : "text-muted"}`}>{post.likes}</Text>
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
              {leaderboard.length === 0 && (
                <Text className="text-sm text-muted py-2">Noch keine Platzierungen.</Text>
              )}
              {leaderboard.slice(0, 3).map((entry, index) => (
                <View key={entry.id} className="flex-row items-center gap-3 py-2">
                  <Text className="text-lg font-bold w-6" style={{
                    color: index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32"
                  }}>
                    {entry.rank}
                  </Text>
                  <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                    <Text>🌱</Text>
                  </View>
                  <Text className="text-base text-foreground flex-1">{entry.name || "Grower"}</Text>
                  <Text className="text-sm text-primary font-medium">{entry.xp.toLocaleString()} XP</Text>
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

            {radarTab === "members" && tier === "free" ? (
              <UpgradePrompt feature="Member Radar" />
            ) : radarTab === "shops" ? (
              <View className="gap-3">
                {!shopsResult && !shopsLoading && (
                  <View className="bg-surface rounded-xl border border-border p-6 items-center">
                    <IconSymbol name="map.fill" size={40} color={colors.muted} />
                    <Text className="text-base font-semibold text-foreground mt-3">Shops in deiner Nähe finden</Text>
                    <Text className="text-xs text-muted text-center mt-1">
                      Wir nutzen deinen Standort einmalig für eine Umkreissuche (25 km) in OpenStreetMap-Daten. Dein Standort wird nicht gespeichert.
                    </Text>
                    <TouchableOpacity onPress={() => loadShops()} className="mt-4 bg-primary px-4 py-2 rounded-full">
                      <Text className="text-white text-sm font-semibold">Shops suchen</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {shopsLoading && <ActivityIndicator size="large" color={colors.primary} />}
                {shopsResult && !shopsLoading && shopsResult.shops.length === 0 && (
                  <View className="bg-surface rounded-xl border border-border p-6 items-center">
                    <IconSymbol name="map.fill" size={40} color={colors.muted} />
                    <Text className="text-base font-semibold text-foreground mt-3 text-center">
                      {shopsResult.status === "permission_denied" ? "Standortzugriff verweigert"
                        : shopsResult.status === "location_unavailable" ? "Standort nicht verfügbar"
                        : shopsResult.status === "offline" ? "Keine Verbindung"
                        : shopsResult.status === "api_error" ? "Kartendienst nicht erreichbar"
                        : "Keine Shops in deiner Nähe gefunden"}
                    </Text>
                    <Text className="text-xs text-muted text-center mt-1">
                      {shopsResult.status === "permission_denied" ? "Erlaube den Standortzugriff in den Einstellungen, um Shops in deiner Nähe zu sehen."
                        : shopsResult.status === "location_unavailable" ? "Dein Standort konnte nicht bestimmt werden."
                        : shopsResult.status === "offline" ? "Du bist offline und es gibt keine zwischengespeicherten Ergebnisse."
                        : shopsResult.status === "api_error" ? "Die Daten konnten gerade nicht geladen werden. Versuche es später erneut."
                        : "Im Umkreis von 25 km sind in OpenStreetMap keine passenden Shops eingetragen."}
                    </Text>
                    <TouchableOpacity onPress={() => loadShops(true)} className="mt-4 bg-primary px-4 py-2 rounded-full">
                      <Text className="text-white text-sm font-semibold">Erneut versuchen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(`https://www.google.com/maps/search/${encodeURIComponent("Growshop")}`).catch(() =>
                          Alert.alert("Fehler", "Karte konnte nicht geöffnet werden.")
                        )
                      }
                      className="mt-3"
                    >
                      <Text className="text-primary text-sm">Growshops in Karten-App suchen</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {shopsResult && !shopsLoading && shopsResult.shops.length > 0 && (
                  <>
                    {shopsResult.stale && (
                      <Text className="text-xs text-warning">Offline – zeige zuletzt gespeicherte Ergebnisse.</Text>
                    )}
                    {shopsResult.shops.map(shop => (
                      <View key={shop.id} className="bg-surface rounded-xl p-4 border border-border">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={2}>{shop.name}</Text>
                          {shop.distance !== undefined && <Text className="text-sm text-primary ml-2">{shop.distance} km</Text>}
                        </View>
                        <Text className="text-xs text-muted mt-0.5">{shop.type === "growshop" ? "Growshop / Gartencenter" : "Headshop / Cannabis-Fachgeschäft"}</Text>
                        {(shop.address || shop.city) ? (
                          <Text className="text-sm text-foreground mt-1">
                            {[shop.address, [shop.postalCode, shop.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                          </Text>
                        ) : null}
                        {shop.openingHours ? <Text className="text-xs text-muted mt-1">Öffnungszeiten: {shop.openingHours}</Text> : null}
                        <View className="flex-row gap-4 mt-3">
                          <TouchableOpacity
                            onPress={() =>
                              Linking.openURL(`https://www.openstreetmap.org/?mlat=${shop.latitude}&mlon=${shop.longitude}#map=17/${shop.latitude}/${shop.longitude}`).catch(() =>
                                Alert.alert("Fehler", "Karte konnte nicht geöffnet werden.")
                              )
                            }
                          >
                            <Text className="text-sm font-medium text-primary">Karte</Text>
                          </TouchableOpacity>
                          {shop.website ? (
                            <TouchableOpacity onPress={() => Linking.openURL(shop.website!).catch(() => Alert.alert("Fehler", "Link konnte nicht geöffnet werden."))}>
                              <Text className="text-sm font-medium text-primary">Website</Text>
                            </TouchableOpacity>
                          ) : null}
                          {shop.phone ? (
                            <TouchableOpacity onPress={() => Linking.openURL(`tel:${shop.phone}`).catch(() => { })}>
                              <Text className="text-sm font-medium text-primary">Anrufen</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    ))}
                    <Text className="text-xs text-muted text-center">Daten: © OpenStreetMap-Mitwirkende (ODbL)</Text>
                  </>
                )}
              </View>
            ) : (
              <View className="bg-surface rounded-xl border border-border p-6 items-center">
                <IconSymbol name="map.fill" size={40} color={colors.muted} />
                <Text className="text-base font-semibold text-foreground mt-3">
                  {radarTab === "clubs" ? "Keine Clubs in deiner Nähe" : "Keine Mitglieder in deiner Nähe"}
                </Text>
                <Text className="text-xs text-muted text-center mt-1">
                  {radarTab === "clubs"
                    ? "Für Clubs gibt es derzeit keine verlässliche Datenquelle, daher zeigen wir hier nichts an."
                    : "Es werden keine Standorte von Mitgliedern geteilt, daher zeigen wir hier nichts an."}
                </Text>
              </View>
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
              <TouchableOpacity
                key={video.id}
                onPress={() => Linking.openURL(getTutorialUrl(video)).catch(() => Alert.alert("Fehler", "Link konnte nicht geöffnet werden."))}
                className="bg-surface rounded-xl border border-border overflow-hidden"
              >
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
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-muted">Auf YouTube suchen</Text>
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
            {/* Leaderboard */}
            <Text className="text-lg font-semibold text-foreground">📊 Rangliste</Text>
            {leaderboardQuery.isLoading && <ActivityIndicator color={colors.primary} />}
            {!leaderboardQuery.isLoading && leaderboard.length === 0 && (
              <Text className="text-sm text-muted">Noch keine Platzierungen.</Text>
            )}
            {leaderboard.map((entry, index) => (
              <View key={entry.id} className={`flex-row items-center p-3 rounded-xl ${index < 3 ? 'bg-primary/10 border border-primary/30' : 'bg-surface border border-border'}`}>
                <View className="w-10 items-center">
                  {index === 0 ? <Text className="text-2xl">🥇</Text> :
                    index === 1 ? <Text className="text-2xl">🥈</Text> :
                      index === 2 ? <Text className="text-2xl">🥉</Text> :
                        <Text className="text-lg font-bold text-muted">#{entry.rank}</Text>}
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-base font-semibold text-foreground">{entry.name || "Grower"}</Text>
                  <Text className="text-xs text-muted">Level {entry.level}</Text>
                </View>
                <Text className="text-base font-bold text-primary">{entry.xp.toLocaleString()} XP</Text>
              </View>
            ))}

            {/* Auctions */}
            <Text className="text-lg font-semibold text-foreground mt-4">🔨 Auktionen</Text>
            {auctionsList.length === 0 && <Text className="text-sm text-muted">Aktuell keine aktiven Auktionen.</Text>}
            {auctionsList.map(auction => (
              <View key={auction.id} className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-base font-semibold text-foreground">{auction.title}</Text>
                {auction.description ? <Text className="text-xs text-muted mt-0.5">{auction.description}</Text> : null}
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-sm font-bold text-warning">€{auction.currentPrice} · {auction.totalBids ?? 0} Gebote</Text>
                  <Text className="text-xs text-muted">Endet in {formatTimeRemaining(new Date(auction.endsAt))}</Text>
                </View>
                <View className="flex-row items-center gap-2 mt-3">
                  <TextInput
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    placeholder={`Mind. €${minimumNextBid({ currentPrice: Number(auction.currentPrice), startPrice: Number(auction.startPrice), totalBids: auction.totalBids ?? 0 }).toFixed(2)}`}
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    value={bidInputs[auction.id] ?? ""}
                    onChangeText={v => setBidInputs(prev => ({ ...prev, [auction.id]: v }))}
                  />
                  <TouchableOpacity
                    className="bg-primary px-4 py-2 rounded-lg"
                    disabled={placeBidMutation.isPending}
                    onPress={() => submitBid(auction.id)}
                  >
                    <Text className="text-white font-semibold">{placeBidMutation.isPending && placeBidMutation.variables?.auctionId === auction.id ? "..." : "Bieten"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Giveaways */}
            <Text className="text-lg font-semibold text-foreground mt-4">🎰 Gewinnspiele & Verlosungen</Text>
            {rafflesList.length === 0 && <Text className="text-sm text-muted">Aktuell keine aktiven Gewinnspiele.</Text>}
            {rafflesList.map(raffle => (
              <View key={raffle.id} className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-base font-semibold text-foreground">{raffle.title}</Text>
                <Text className="text-xs text-muted mt-0.5">Preis: {raffle.prize}</Text>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-sm text-muted">
                    {raffle.totalEntries ?? 0}{raffle.maxEntries ? `/${raffle.maxEntries}` : ""} Teilnehmer
                  </Text>
                  <Text className="text-xs text-muted">Endet in {formatTimeRemaining(new Date(raffle.endsAt))}</Text>
                </View>
                {enteredRaffles.includes(raffle.id) ? (
                  <View className="mt-3 py-2 rounded-lg bg-success/20 items-center">
                    <Text className="text-success font-semibold">✓ Du bist dabei</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    className="mt-3 py-2 rounded-lg bg-primary items-center"
                    disabled={enterRaffleMutation.isPending}
                    onPress={() => enterRaffleMutation.mutate({ raffleId: raffle.id })}
                  >
                    <Text className="text-white font-semibold">Teilnehmen</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Featured products */}
            <Text className="text-lg font-semibold text-foreground mt-4">💰 Empfohlene Produkte</Text>
            {dealsList.length === 0 && <Text className="text-sm text-muted">Aktuell keine empfohlenen Produkte.</Text>}
            {dealsList.map(deal => (
              <TouchableOpacity
                key={deal.id}
                className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3"
                disabled={!deal.externalUrl}
                onPress={() => deal.externalUrl && Linking.openURL(deal.externalUrl)}
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">{deal.name}</Text>
                  <Text className="text-sm font-bold text-success mt-1">€{deal.price}</Text>
                </View>
                {deal.externalUrl ? <Text className="text-sm font-medium text-primary">Ansehen</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="h-24" />
      </ScrollView>
    </ScreenContainer>
  );
}
