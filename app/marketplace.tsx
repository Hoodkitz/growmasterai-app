import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Linking, ActivityIndicator } from "react-native";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-context";
import { STRAINS_DATABASE } from "@/lib/strains-data";

type TabType = "shop" | "auctions" | "raffles" | "deals" | "strains";
type CategoryType = "all" | "seeds" | "equipment" | "nutrients" | "accessories" | "other";



const MOCK_DEALS = [
  {
    id: "d1",
    title: "Starter Bundle",
    description: "Alles für deinen ersten Grow",
    items: ["60x60 Zelt", "100W LED", "Lüfter-Set", "Basis-Nährstoffe"],
    originalPrice: 399.00,
    dealPrice: 279.00,
    savings: 30,
    vendor: "Growland",
    stock: 12,
    image: "📦",
  },
  {
    id: "d2",
    title: "Pro Lighting Upgrade",
    description: "Upgrade deine Beleuchtung",
    items: ["Spider Farmer SF4000", "Timer", "Aufhängung"],
    originalPrice: 599.00,
    dealPrice: 449.00,
    savings: 25,
    vendor: "LED Grow Shop",
    stock: 5,
    image: "⚡",
  },
];

const CATEGORIES = [
  { id: "all", label: "Alle", icon: "square.grid.2x2.fill" },
  { id: "seeds", label: "Samen", icon: "leaf.fill" },
  { id: "equipment", label: "Equipment", icon: "wrench.fill" },
  { id: "nutrients", label: "Nährstoffe", icon: "drop.fill" },
  { id: "accessories", label: "Zubehör", icon: "bag.fill" },
  { id: "other", label: "Sonstiges", icon: "tag.fill" },
];

export default function MarketplaceScreen() {
  const router = useRouter();
  const colors = useColors();
  const { tier } = useSubscription();

  const [activeTab, setActiveTab] = useState<TabType>("shop");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const productsQuery = trpc.marketplace.listProducts.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    limit: 20
  });
  const auctionsQuery = trpc.marketplace.listAuctions.useQuery(undefined, { enabled: activeTab === "auctions" });
  const rafflesQuery = trpc.marketplace.listRaffles.useQuery(undefined, { enabled: activeTab === "raffles" });

  const products = productsQuery.data || [];
  const auctions = auctionsQuery.data || [];
  const raffles = rafflesQuery.data || [];

  const filteredProducts = products.filter(p =>
    (searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );



  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Marketplace</Text>
          <TouchableOpacity onPress={() => router.push("/vendor-portal" as any)}>
            <IconSymbol name="storefront.fill" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-surface rounded-xl px-3 py-2 border border-border">
          <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
          <TextInput
            className="flex-1 ml-2 text-base text-foreground"
            placeholder="Produkte suchen..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3 border-b border-border"
      >
        <View className="flex-row gap-2">
          {[
            { id: "shop" as TabType, label: "Shop", icon: "bag.fill" },
            { id: "auctions" as TabType, label: "Auktionen", icon: "gavel.fill" },
            { id: "raffles" as TabType, label: "Verlosungen", icon: "gift.fill" },
            { id: "deals" as TabType, label: "Deals", icon: "tag.fill" },
            { id: "strains" as TabType, label: "Sorten", icon: "leaf.fill" },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full ${activeTab === tab.id ? 'bg-primary' : 'bg-surface'
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
        </View>
      </ScrollView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Shop Tab */}
        {activeTab === "shop" && (
          <View className="px-4 pt-4">
            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    className={`px-3 py-2 rounded-lg ${selectedCategory === cat.id ? 'bg-primary/20' : 'bg-surface'
                      }`}
                    onPress={() => setSelectedCategory(cat.id as CategoryType)}
                  >
                    <Text className={`text-sm font-medium ${selectedCategory === cat.id ? 'text-primary' : 'text-muted'
                      }`}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Featured Banner */}
            <TouchableOpacity className="bg-gradient-to-r from-primary to-success rounded-xl p-4 mb-4 bg-primary">
              <Text className="text-lg font-bold text-white mb-1">🌱 Frühlings-Sale</Text>
              <Text className="text-sm text-white/80">Bis zu 30% auf ausgewählte Samen</Text>
            </TouchableOpacity>

            {/* Products Grid */}
            <View className="gap-3">
              {productsQuery.isLoading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                filteredProducts.map(product => (
                  <TouchableOpacity
                    key={product.id}
                    className="bg-surface rounded-xl p-4 border border-border"
                    onPress={() => product.externalUrl && Linking.openURL(product.externalUrl)}
                  >
                    <View className="flex-row gap-3">
                      <View className="w-20 h-20 rounded-lg bg-background items-center justify-center">
                        <Text className="text-3xl">{(product.imageUrl || "📦")}</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 pr-2">
                            <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
                              {product.name}
                            </Text>
                            <View className="flex-row items-center gap-1 mt-1">
                              <Text className="text-xs text-muted">Vendor #{product.vendorId}</Text>
                            </View>
                          </View>
                          {product.isFeatured && (
                            <View className="bg-warning/20 px-2 py-0.5 rounded">
                              <Text className="text-xs text-warning">Featured</Text>
                            </View>
                          )}
                        </View>

                        <View className="flex-row items-center gap-2 mt-2">
                          <Text className="text-lg font-bold text-primary">€{Number(product.price).toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                )))}
            </View>

            {/* Affiliate Disclosure */}
            <View className="mt-4 p-3 bg-surface/50 rounded-lg">
              <Text className="text-xs text-muted text-center">
                * Affiliate-Links: Bei Kauf über diese Links erhalten wir eine kleine Provision.
              </Text>
            </View>
          </View>
        )}

        {/* Auctions Tab */}
        {activeTab === "auctions" && (
          <View className="px-4 pt-4 gap-4">
            <Text className="text-lg font-semibold text-foreground">🔨 Aktive Auktionen</Text>

            {auctionsQuery.isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              auctions.map(auction => (
                <TouchableOpacity
                  key={auction.id}
                  className="bg-surface rounded-xl p-4 border border-border"
                >
                  <View className="flex-row gap-3">
                    <View className="w-16 h-16 rounded-lg bg-background items-center justify-center">
                      <Text className="text-2xl">{auction.imageUrl || "🏆"}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
                        {auction.title}
                      </Text>
                      <Text className="text-xs text-muted">Vendor #{auction.vendorId}</Text>

                      <View className="flex-row items-center justify-between mt-2">
                        <View>
                          <Text className="text-xs text-muted">Aktuelles Gebot</Text>
                          <Text className="text-lg font-bold text-primary">€{Number(auction.currentPrice).toFixed(2)}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-xs text-muted">{auction.totalBids} Gebote</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity className="bg-primary mt-3 py-2 rounded-lg">
                    <Text className="text-center text-sm font-semibold text-white">Gebot abgeben</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )))}
          </View>
        )}

        {/* Raffles Tab */}
        {activeTab === "raffles" && (
          <View className="px-4 pt-4 gap-4">
            <Text className="text-lg font-semibold text-foreground">🎁 Aktive Verlosungen</Text>

            {rafflesQuery.isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              raffles.map(raffle => (
                <View
                  key={raffle.id}
                  className="bg-surface rounded-xl p-4 border border-border"
                >
                  <View className="flex-row gap-3 mb-3">
                    <View className="w-16 h-16 rounded-lg bg-primary/20 items-center justify-center">
                      <Text className="text-2xl">{raffle.imageUrl || "🎁"}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
                        {raffle.title}
                      </Text>
                      <Text className="text-xs text-muted">Vendor #{raffle.vendorId}</Text>
                      <Text className="text-xs text-primary mt-1">{raffle.prize}</Text>
                    </View>
                  </View>

                  {/* Progress */}
                  <View className="mb-3">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs text-muted">Verkaufte Lose</Text>
                      <Text className="text-xs text-foreground">{raffle.totalEntries}/{raffle.maxEntries}</Text>
                    </View>
                    <View className="h-2 bg-background rounded-full overflow-hidden">
                      <View
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(Number(raffle.totalEntries) / Number(raffle.maxEntries)) * 100}%` }}
                      />
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-xs text-muted">Lospreis</Text>
                      <Text className="text-lg font-bold text-primary">€{Number(raffle.entryFee).toFixed(2)}</Text>
                    </View>
                    <View className="items-end">
                      {/* Ends in logic simplified */}
                    </View>
                  </View>

                  <View className="flex-row gap-2 mt-3">
                    <TouchableOpacity className="flex-1 bg-surface border border-primary py-2 rounded-lg">
                      <Text className="text-center text-sm font-semibold text-primary">1 Los</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 bg-primary py-2 rounded-lg">
                      <Text className="text-center text-sm font-semibold text-white">5 Lose</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 bg-warning py-2 rounded-lg">
                      <Text className="text-center text-sm font-semibold text-white">10 Lose</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )))}
          </View>
        )}

        {/* Deals Tab */}
        {activeTab === "deals" && (
          <View className="px-4 pt-4 gap-4">
            <Text className="text-lg font-semibold text-foreground">🔥 Exklusive Deals</Text>

            {MOCK_DEALS.map(deal => (
              <View
                key={deal.id}
                className="bg-surface rounded-xl overflow-hidden border border-border"
              >
                {/* Deal Header */}
                <View className="bg-error/20 px-4 py-2 flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-error">-{deal.savings}% RABATT</Text>
                  <Text className="text-xs text-error">Nur noch {deal.stock} verfügbar!</Text>
                </View>

                <View className="p-4">
                  <View className="flex-row gap-3 mb-3">
                    <View className="w-16 h-16 rounded-lg bg-background items-center justify-center">
                      <Text className="text-2xl">{deal.image}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground">{deal.title}</Text>
                      <Text className="text-sm text-muted">{deal.description}</Text>
                      <Text className="text-xs text-primary mt-1">{deal.vendor}</Text>
                    </View>
                  </View>

                  {/* Items included */}
                  <View className="bg-background rounded-lg p-3 mb-3">
                    <Text className="text-xs text-muted mb-2">Enthält:</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {deal.items.map((item, i) => (
                        <View key={i} className="flex-row items-center gap-1">
                          <IconSymbol name="checkmark.circle.fill" size={12} color={colors.success} />
                          <Text className="text-xs text-foreground">{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Price */}
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-sm text-muted line-through">€{deal.originalPrice.toFixed(2)}</Text>
                      <Text className="text-2xl font-bold text-primary">€{deal.dealPrice.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity className="bg-primary px-6 py-3 rounded-xl">
                      <Text className="text-base font-semibold text-white">Jetzt kaufen</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Strains Tab */}
        {activeTab === "strains" && (
          <View className="px-4 pt-4 gap-4">
            <Text className="text-lg font-semibold text-foreground">🌿 Sorten-Datenbank</Text>
            <Text className="text-sm text-muted">Die besten Sorten mit Bewertungen und Kauflinks</Text>

            {STRAINS_DATABASE.slice(0, 6).map(strain => (
              <TouchableOpacity
                key={strain.id}
                className="bg-surface rounded-xl p-4 border border-border"
              >
                <View className="flex-row items-start gap-3">
                  <View className="w-14 h-14 rounded-lg bg-primary/20 items-center justify-center">
                    <Text className="text-2xl">🌿</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold text-foreground">{strain.name}</Text>
                      <View className={`px-2 py-0.5 rounded ${strain.type === "indica" ? "bg-purple-500/20" :
                        strain.type === "sativa" ? "bg-orange-500/20" : "bg-green-500/20"
                        }`}>
                        <Text className={`text-xs capitalize ${strain.type === "indica" ? "text-purple-400" :
                          strain.type === "sativa" ? "text-orange-400" : "text-green-400"
                          }`}>
                          {strain.type}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-muted">{strain.breeder}</Text>

                    <View className="flex-row items-center gap-4 mt-2">
                      <View className="flex-row items-center gap-1">
                        <Text className="text-xs text-muted">THC:</Text>
                        <Text className="text-xs font-medium text-foreground">{strain.thcMin}-{strain.thcMax}%</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-xs text-muted">CBD:</Text>
                        <Text className="text-xs font-medium text-foreground">{strain.cbdMin}-{strain.cbdMax}%</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <IconSymbol name="star.fill" size={12} color={colors.warning} />
                        <Text className="text-xs font-medium text-foreground">{strain.rating}</Text>
                      </View>
                    </View>

                    {/* Difficulty */}
                    <View className="flex-row items-center gap-2 mt-2">
                      <Text className="text-xs text-muted">Schwierigkeit:</Text>
                      <View className="flex-row gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <View
                            key={i}
                            className={`w-3 h-3 rounded-full ${i <= (strain.difficulty === 'beginner' ? 1 : strain.difficulty === 'intermediate' ? 2 : strain.difficulty === 'advanced' ? 3 : 4) ? 'bg-primary' : 'bg-border'
                              }`}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </View>

                {/* Buy Links */}
                {strain.affiliateLinks && strain.affiliateLinks.length > 0 && (
                  <View className="flex-row gap-2 mt-3 pt-3 border-t border-border">
                    <Text className="text-xs text-muted">Kaufen bei:</Text>
                    {strain.affiliateLinks.slice(0, 2).map((link, i) => (
                      <TouchableOpacity
                        key={i}
                        className="bg-primary/20 px-2 py-1 rounded"
                        onPress={() => Linking.openURL(link.url)}
                      >
                        <Text className="text-xs text-primary">{link.shop}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity className="bg-surface rounded-xl p-4 border border-border items-center">
              <Text className="text-base font-semibold text-primary">Alle Sorten anzeigen →</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="h-24" />
      </ScrollView>
    </ScreenContainer>
  );
}
