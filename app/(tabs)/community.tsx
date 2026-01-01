import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { useGamification } from "@/lib/gamification-context";
import { 
  MOCK_POSTS, 
  MOCK_CONTESTS, 
  MOCK_LEADERBOARD,
  MOCK_AUCTIONS,
  MOCK_RAFFLES,
  MOCK_DEALS,
  CommunityPost,
  Contest,
  LeaderboardEntry,
  Auction,
  Raffle,
  EquipmentDeal,
  formatRelativeTime,
  formatTimeRemaining,
} from "@/lib/community";

type TabType = "feed" | "contests" | "leaderboard" | "marketplace";

export default function CommunityScreen() {
  const router = useRouter();
  const colors = useColors();
  const { tier } = useSubscription();
  const { level, points } = useGamification();
  
  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [contests, setContests] = useState(MOCK_CONTESTS);
  const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  const joinContest = (contestId: string) => {
    setContests(prev => prev.map(contest => {
      if (contest.id === contestId) {
        return {
          ...contest,
          isJoined: true,
          participants: contest.participants + 1,
        };
      }
      return contest;
    }));
  };

  const renderPost = (post: CommunityPost) => (
    <View key={post.id} className="bg-surface rounded-2xl p-4 border border-border mb-3">
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
          <Text className="text-lg">{post.userBadge}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-foreground">{post.userName}</Text>
            <Text className="text-xs text-muted">Lv.{post.userLevel}</Text>
          </View>
          <Text className="text-xs text-muted">{formatRelativeTime(post.createdAt)}</Text>
        </View>
      </View>

      <Text className="text-base text-foreground mb-3 leading-6">{post.content}</Text>

      {post.tags && post.tags.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-3">
          {post.tags.map(tag => (
            <View key={tag} className="bg-primary/10 px-2 py-1 rounded-full">
              <Text className="text-xs text-primary">#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center gap-6 pt-2 border-t border-border">
        <TouchableOpacity 
          className="flex-row items-center gap-2"
          onPress={() => toggleLike(post.id)}
        >
          <IconSymbol 
            name={post.isLiked ? "heart.fill" : "heart"} 
            size={20} 
            color={post.isLiked ? colors.error : colors.muted} 
          />
          <Text className={`text-sm ${post.isLiked ? 'text-error' : 'text-muted'}`}>{post.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="flex-row items-center gap-2">
          <IconSymbol name="bubble.left" size={20} color={colors.muted} />
          <Text className="text-sm text-muted">{post.comments}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="flex-row items-center gap-2">
          <IconSymbol name="paperplane.fill" size={18} color={colors.muted} />
          <Text className="text-sm text-muted">Teilen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContest = (contest: Contest) => (
    <View key={contest.id} className="bg-surface rounded-2xl p-4 border border-border mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className={`px-3 py-1 rounded-full ${
          contest.type === "yield" ? "bg-success/20" :
          contest.type === "photo" ? "bg-primary/20" :
          contest.type === "raffle" ? "bg-warning/20" : "bg-muted/20"
        }`}>
          <Text className={`text-xs font-medium ${
            contest.type === "yield" ? "text-success" :
            contest.type === "photo" ? "text-primary" :
            contest.type === "raffle" ? "text-warning" : "text-muted"
          }`}>
            {contest.type === "yield" ? "🏆 Ernte" :
             contest.type === "photo" ? "📸 Foto" :
             contest.type === "raffle" ? "🎟️ Verlosung" : "Wettbewerb"}
          </Text>
        </View>
        <Text className="text-xs text-muted">
          Endet in {formatTimeRemaining(contest.endDate)}
        </Text>
      </View>

      <Text className="text-lg font-bold text-foreground mb-1">{contest.title}</Text>
      <Text className="text-sm text-muted mb-3">{contest.description}</Text>

      <View className="bg-primary/10 rounded-xl p-3 mb-3">
        <Text className="text-xs text-muted mb-1">Preis</Text>
        <Text className="text-base font-semibold text-primary">{contest.prize}</Text>
        {contest.sponsor && (
          <Text className="text-xs text-muted mt-1">Gesponsert von {contest.sponsor}</Text>
        )}
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-muted">{contest.participants} Teilnehmer</Text>
        
        <TouchableOpacity 
          className={`px-4 py-2 rounded-full ${contest.isJoined ? 'bg-success/20' : 'bg-primary'}`}
          onPress={() => !contest.isJoined && joinContest(contest.id)}
          disabled={contest.isJoined}
        >
          <Text className={`text-sm font-medium ${contest.isJoined ? 'text-success' : 'text-white'}`}>
            {contest.isJoined ? "✓ Teilgenommen" : "Teilnehmen"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => (
    <View 
      key={entry.userId}
      className={`flex-row items-center p-3 rounded-xl mb-2 ${
        index < 3 ? 'bg-primary/10 border border-primary/30' : 'bg-surface border border-border'
      }`}
    >
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
  );

  const renderAuction = (auction: Auction) => (
    <View key={auction.id} className="bg-surface rounded-2xl p-4 border border-border mb-3">
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-14 h-14 rounded-xl bg-warning/20 items-center justify-center">
          <Text className="text-2xl">{auction.vendorLogo}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">{auction.title}</Text>
          <Text className="text-xs text-muted">von {auction.vendorName}</Text>
        </View>
      </View>
      <Text className="text-sm text-muted mb-3">{auction.description}</Text>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xs text-muted">Aktuelles Gebot</Text>
          <Text className="text-xl font-bold text-warning">€{auction.currentBid}</Text>
          <Text className="text-xs text-muted">{auction.bids} Gebote</Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-muted">Endet in</Text>
          <Text className="text-base font-semibold text-foreground">{formatTimeRemaining(auction.endDate)}</Text>
          <TouchableOpacity className="bg-warning px-4 py-2 rounded-full mt-2">
            <Text className="text-sm font-semibold text-white">Bieten</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderRaffle = (raffle: Raffle) => (
    <View key={raffle.id} className="bg-surface rounded-2xl p-4 border border-border mb-3">
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-14 h-14 rounded-xl bg-primary/20 items-center justify-center">
          <Text className="text-2xl">{raffle.vendorLogo}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">{raffle.title}</Text>
          <Text className="text-xs text-muted">von {raffle.vendorName}</Text>
        </View>
      </View>
      <Text className="text-sm text-muted mb-3">{raffle.description}</Text>
      
      <View className="bg-primary/10 rounded-xl p-3 mb-3">
        <Text className="text-xs text-muted">Preis</Text>
        <Text className="text-base font-semibold text-primary">{raffle.prize}</Text>
      </View>
      
      <View className="h-2 bg-background rounded-full overflow-hidden mb-2">
        <View 
          className="h-full bg-primary rounded-full"
          style={{ width: `${(raffle.soldTickets / raffle.totalTickets) * 100}%` }}
        />
      </View>
      <Text className="text-xs text-muted text-center mb-3">
        {raffle.soldTickets} / {raffle.totalTickets} Tickets verkauft
      </Text>
      
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xs text-muted">Ticket-Preis</Text>
          <Text className="text-lg font-bold text-primary">€{raffle.ticketPrice}</Text>
        </View>
        <TouchableOpacity className="bg-primary px-4 py-2 rounded-full">
          <Text className="text-sm font-semibold text-white">
            {raffle.userTickets > 0 ? `${raffle.userTickets} Tickets` : "Ticket kaufen"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDeal = (deal: EquipmentDeal) => (
    <View key={deal.id} className="bg-surface rounded-2xl p-4 border border-border mb-3">
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-14 h-14 rounded-xl bg-success/20 items-center justify-center">
          <Text className="text-2xl">{deal.vendorLogo}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">{deal.title}</Text>
          <Text className="text-xs text-muted">von {deal.vendorName}</Text>
        </View>
        <View className="bg-error/20 px-2 py-1 rounded-full">
          <Text className="text-xs font-bold text-error">-{deal.discount}%</Text>
        </View>
      </View>
      <Text className="text-sm text-muted mb-3">{deal.description}</Text>
      <View className="flex-row items-center justify-between">
        <View>
          <View className="flex-row items-center gap-2">
            <Text className="text-xl font-bold text-success">€{deal.salePrice}</Text>
            <Text className="text-sm text-muted line-through">€{deal.originalPrice}</Text>
          </View>
          <Text className="text-xs text-muted">Noch {deal.stock} verfügbar</Text>
        </View>
        <TouchableOpacity className="bg-success px-4 py-2 rounded-full">
          <Text className="text-sm font-semibold text-white">Kaufen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <View className="px-4 pb-4 border-b border-border">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground">Community</Text>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center"
            onPress={() => router.push("/achievements")}
          >
            <Text className="text-lg">{level.badge}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
          <View className="flex-row gap-2">
            {[
              { id: "feed" as TabType, label: "Feed", icon: "bubble.left.and.bubble.right.fill" },
              { id: "contests" as TabType, label: "Gewinnspiele", icon: "trophy.fill" },
              { id: "leaderboard" as TabType, label: "Rangliste", icon: "chart.bar.fill" },
              { id: "marketplace" as TabType, label: "Marktplatz", icon: "bag.fill" },
            ].map(tab => (
              <TouchableOpacity 
                key={tab.id}
                className={`flex-row items-center gap-1 px-3 py-2 rounded-full ${
                  activeTab === tab.id ? 'bg-primary' : 'bg-surface'
                }`}
                onPress={() => setActiveTab(tab.id)}
              >
                <IconSymbol 
                  name={tab.icon as any} 
                  size={16} 
                  color={activeTab === tab.id ? "#fff" : colors.muted} 
                />
                <Text className={`text-sm font-medium ${activeTab === tab.id ? 'text-white' : 'text-muted'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView 
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {activeTab === "feed" && (
          <>
            <TouchableOpacity className="bg-surface rounded-2xl p-4 border border-border mb-4 flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                <Text className="text-lg">{level.badge}</Text>
              </View>
              <Text className="text-base text-muted flex-1">Was gibt es Neues bei dir?</Text>
              <IconSymbol name="camera.fill" size={20} color={colors.primary} />
            </TouchableOpacity>
            {posts.map(renderPost)}
          </>
        )}

        {activeTab === "contests" && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">Aktive Gewinnspiele</Text>
            {contests.map(renderContest)}
            
            {tier === "free" && (
              <View className="bg-warning/10 rounded-2xl p-4 border border-warning/30 mt-2 mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <IconSymbol name="star.fill" size={20} color={colors.warning} />
                  <Text className="text-base font-semibold text-foreground">Premium Vorteile</Text>
                </View>
                <Text className="text-sm text-muted">
                  Mit Premium oder Pro hast du Zugang zu exklusiven Gewinnspielen!
                </Text>
                <TouchableOpacity 
                  className="bg-warning mt-3 py-2 rounded-full"
                  onPress={() => router.push("/paywall")}
                >
                  <Text className="text-center text-sm font-semibold text-white">Jetzt upgraden</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {activeTab === "leaderboard" && (
          <>
            <View className="bg-primary/10 rounded-2xl p-4 border border-primary/30 mb-4">
              <Text className="text-sm text-muted mb-1">Deine Position</Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl font-bold text-primary">#42</Text>
                  <View>
                    <Text className="text-base font-semibold text-foreground">Du</Text>
                    <Text className="text-xs text-muted">Level {level.level}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-base font-bold text-primary">{points} Punkte</Text>
                  <Text className="text-xs text-muted">0g Ertrag</Text>
                </View>
              </View>
            </View>

            <Text className="text-lg font-semibold text-foreground mb-3">Top Grower</Text>
            {leaderboard.map((entry, index) => renderLeaderboardEntry(entry, index))}
          </>
        )}

        {activeTab === "marketplace" && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">🔨 Auktionen</Text>
            {MOCK_AUCTIONS.map(renderAuction)}
            
            <Text className="text-lg font-semibold text-foreground mb-3 mt-4">🎟️ Verlosungen</Text>
            {MOCK_RAFFLES.map(renderRaffle)}
            
            <Text className="text-lg font-semibold text-foreground mb-3 mt-4">💰 Equipment Deals</Text>
            {MOCK_DEALS.map(renderDeal)}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
