import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Image, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";
import {
  VENDOR_SUBSCRIPTIONS,
  AD_PRICING,
  LEAD_PACKAGES,
  VendorTier,
} from "@/lib/marketplace";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

type TabType = "dashboard" | "products" | "campaigns" | "leads" | "settings";

export default function VendorPortalScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAppAuth();

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Queries
  const { data: vendorProfile, isLoading: isLoadingProfile } = trpc.vendor.getProfile.useQuery();
  const { data: dashboardStats, isLoading: isLoadingStats } = trpc.vendor.getDashboard.useQuery(undefined, {
    enabled: !!vendorProfile,
  });
  const { data: products, isLoading: isLoadingProducts } = trpc.vendor.getProducts.useQuery({ limit: 50 }, {
    enabled: activeTab === "products" && !!vendorProfile,
  });
  const { data: campaigns, isLoading: isLoadingCampaigns } = trpc.vendor.getCampaigns.useQuery(undefined, {
    enabled: activeTab === "campaigns" && !!vendorProfile,
  });
  const { data: leads, isLoading: isLoadingLeads } = trpc.vendor.getLeads.useQuery(undefined, {
    enabled: activeTab === "leads" && !!vendorProfile,
  });

  const updateSettingsMutation = trpc.vendor.updateSettings.useMutation();

  if (isLoadingProfile) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!vendorProfile) {
    return (
      <ScreenContainer>
        <View className="flex-1 px-6 items-center justify-center">
          <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-6">
            <IconSymbol name="storefront.fill" size={40} color={colors.primary} />
          </View>
          <Text className="text-2xl font-bold text-foreground text-center mb-2">
            Werde Partner
          </Text>
          <Text className="text-base text-muted text-center mb-8">
            Verkaufe deine Produkte, schalte Werbung und generiere Leads mit dem GrowMaster Vendor Portal.
          </Text>
          <TouchableOpacity
            className="bg-primary px-8 py-4 rounded-xl w-full"
            onPress={() => Linking.openURL("mailto:partners@growmaster.app")}
          >
            <Text className="text-white text-center font-bold text-lg">Partner werden</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const vendorTier = (vendorProfile.plan as VendorTier) || "basic";
  const subscription = VENDOR_SUBSCRIPTIONS[vendorTier];
  const stats = dashboardStats || { revenue: 0, sales: 0, activeListings: 0, rating: 0, recentLeads: [] };

  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: "chart.bar.fill" },
    { id: "products" as TabType, label: "Produkte", icon: "bag.fill" },
    { id: "campaigns" as TabType, label: "Werbung", icon: "megaphone.fill" },
    { id: "leads" as TabType, label: "Leads", icon: "person.2.fill" },
    { id: "settings" as TabType, label: "Einstellungen", icon: "gearshape.fill" },
  ];

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pb-4 border-b border-border">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Vendor Portal</Text>
          <View className="w-6" />
        </View>

        {/* Vendor Info */}
        <View className="flex-row items-center gap-3 mt-3">
          <View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center">
            {vendorProfile.logoUrl ? (
              <Image source={{ uri: vendorProfile.logoUrl }} className="w-full h-full rounded-xl" />
            ) : (
              <Text className="text-2xl">🏪</Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">{vendorProfile.name}</Text>
            <View className="flex-row items-center gap-2">
              <View className={`px-2 py-0.5 rounded-full ${vendorTier === "enterprise" ? "bg-warning/20" :
                vendorTier === "pro" ? "bg-primary/20" : "bg-muted/20"
                }`}>
                <Text className={`text-xs font-medium ${vendorTier === "enterprise" ? "text-warning" :
                  vendorTier === "pro" ? "text-primary" : "text-muted"
                  }`}>
                  {subscription.name}
                </Text>
              </View>
              {vendorProfile.isVerified && (
                <IconSymbol name="checkmark.seal.fill" size={14} color={colors.success} />
              )}
            </View>
          </View>
          <TouchableOpacity
            className="bg-primary px-3 py-1.5 rounded-full"
            onPress={() => setShowUpgrade(true)}
          >
            <Text className="text-sm font-medium text-white">Upgrade</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3 border-b border-border"
      >
        <View className="flex-row gap-2">
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
        </View>
      </ScrollView>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <View className="gap-4">
            {isLoadingStats ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                {/* Revenue Overview */}
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-lg font-semibold text-foreground mb-3">💰 Gesamtumsatz</Text>
                  <Text className="text-3xl font-bold text-primary mb-2">€{stats.sales.toLocaleString()}</Text>
                  <Text className="text-sm text-muted">Aus {stats.sales} Verkäufen</Text>
                </View>

                {/* Quick Stats */}
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                    <IconSymbol name="tag.fill" size={24} color={colors.primary} />
                    <Text className="text-2xl font-bold text-foreground mt-2">{stats.activeListings}</Text>
                    <Text className="text-xs text-muted">Produkte</Text>
                  </View>
                  <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                    <IconSymbol name="star.fill" size={24} color={colors.warning} />
                    <Text className="text-2xl font-bold text-foreground mt-2">{stats.rating.toFixed(1)}</Text>
                    <Text className="text-xs text-muted">Bewertung</Text>
                  </View>
                  <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                    <IconSymbol name="person.2.fill" size={24} color={colors.success} />
                    <Text className="text-2xl font-bold text-foreground mt-2">{stats.recentLeads.length}</Text>
                    <Text className="text-xs text-muted">Neue Leads</Text>
                  </View>
                </View>

                {/* Quick Actions */}
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <Text className="text-lg font-semibold text-foreground mb-3">⚡ Schnellaktionen</Text>
                  <View className="gap-2">
                    <TouchableOpacity className="flex-row items-center gap-3 p-3 bg-primary/10 rounded-lg" onPress={() => setActiveTab("products")}>
                      <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
                      <Text className="text-base font-medium text-primary">Neues Produkt hinzufügen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center gap-3 p-3 bg-error/10 rounded-lg" onPress={() => setActiveTab("campaigns")}>
                      <IconSymbol name="megaphone.fill" size={24} color={colors.error} />
                      <Text className="text-base font-medium text-error">Werbekampagne starten</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">Meine Produkte</Text>
              <TouchableOpacity className="bg-primary px-3 py-2 rounded-lg flex-row items-center gap-1">
                <IconSymbol name="plus" size={16} color="#fff" />
                <Text className="text-sm font-medium text-white">Hinzufügen</Text>
              </TouchableOpacity>
            </View>

            {isLoadingProducts ? (
              <ActivityIndicator color={colors.primary} />
            ) : products?.length === 0 ? (
              <Text className="text-muted text-center py-8">Keine Produkte gefunden.</Text>
            ) : (
              products?.map((product: any) => (
                <TouchableOpacity key={product.id} className="bg-surface rounded-xl p-4 border border-border">
                  <View className="flex-row items-start gap-3">
                    <View className="w-16 h-16 rounded-lg bg-background items-center justify-center">
                      {product.imageUrl ? (
                        <Image source={{ uri: product.imageUrl }} className="w-full h-full rounded-lg" />
                      ) : (
                        <Text className="text-2xl">🌱</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>
                          {product.name}
                        </Text>
                        {product.isFeatured && (
                          <View className="bg-primary/20 px-2 py-0.5 rounded">
                            <Text className="text-xs text-primary">Featured</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm text-muted">{product.category}</Text>
                      <View className="flex-row items-center gap-4 mt-2">
                        <Text className="text-base font-bold text-primary">€{product.price}</Text>
                      </View>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Campaigns Tab */}
        {activeTab === "campaigns" && (
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">Werbekampagnen</Text>
              <TouchableOpacity className="bg-primary px-3 py-2 rounded-lg flex-row items-center gap-1">
                <IconSymbol name="plus" size={16} color="#fff" />
                <Text className="text-sm font-medium text-white">Neue Kampagne</Text>
              </TouchableOpacity>
            </View>

            {/* Active Campaigns */}
            <Text className="text-base font-medium text-foreground mt-4">Aktive Kampagnen</Text>
            {isLoadingCampaigns ? (
              <ActivityIndicator color={colors.primary} />
            ) : campaigns?.length === 0 ? (
              <Text className="text-muted text-center py-4">Keine aktiven Kampagnen.</Text>
            ) : (
              campaigns?.map((campaign: any) => (
                <View key={campaign.id} className="bg-surface rounded-xl p-4 border border-border mb-3">
                  <View className="flex-row items-center justify-between mb-3">
                    <View>
                      <Text className="text-base font-semibold text-foreground">{campaign.title}</Text>
                      <Text className="text-xs text-muted">{campaign.placement}</Text>
                    </View>
                    <View className="bg-success/20 px-2 py-1 rounded-full">
                      <Text className="text-xs font-medium text-success">Aktiv</Text>
                    </View>
                  </View>
                  <View className="flex-row gap-4">
                    <View>
                      <Text className="text-xs text-muted">Ausgegeben</Text>
                      <Text className="text-sm font-medium text-warning">€{campaign.totalSpent || 0}</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-muted">Klicks</Text>
                      <Text className="text-sm font-medium text-foreground">{campaign.clicks || 0}</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-muted">Impressions</Text>
                      <Text className="text-sm font-medium text-foreground">{campaign.impressions || 0}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}

            {/* Ad Placements Info */}
            <Text className="text-base font-medium text-foreground mt-8">Verfügbare Platzierungen</Text>
            {Object.entries(AD_PRICING).map(([placement, pricing]) => (
              <View key={placement} className="bg-surface rounded-xl p-4 border border-border mb-2">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-semibold text-foreground">
                    {placement === "home_banner" ? "🏠 Home Banner" :
                      placement === "feed_native" ? "📱 Feed Native" :
                        placement === "search_top" ? "🔍 Suche Top" :
                          placement === "category_featured" ? "📂 Kategorie Featured" :
                            placement === "checkout_upsell" ? "🛒 Checkout Upsell" :
                              "🔔 Push Notification"}
                  </Text>
                  <View className="bg-primary/20 px-2 py-1 rounded">
                    <Text className="text-xs font-medium text-primary">Ab €{pricing.minBudget}</Text>
                  </View>
                </View>
                <View className="flex-row gap-4">
                  <View>
                    <Text className="text-xs text-muted">CPM</Text>
                    <Text className="text-sm font-medium text-foreground">€{pricing.cpm}</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted">CPC</Text>
                    <Text className="text-sm font-medium text-foreground">€{pricing.cpc}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">Lead-Generierung</Text>

            {/* Recent Leads */}
            <Text className="text-base font-medium text-foreground mt-4">Meine Leads</Text>
            {isLoadingLeads ? (
              <ActivityIndicator color={colors.primary} />
            ) : leads?.length === 0 ? (
              <Text className="text-muted text-center py-4">Keine Leads vorhanden.</Text>
            ) : (
              leads?.map((lead: any) => (
                <TouchableOpacity key={lead.id} className="bg-surface rounded-xl p-4 border border-border mb-3">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                      <Text className="text-lg">👤</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">{lead.customerName}</Text>
                      <Text className="text-xs text-muted">{lead.type} • {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: de })}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-sm font-bold text-primary">€{lead.value || 0}</Text>
                      <View className={`px-2 py-0.5 rounded-full ${lead.status === "new" ? "bg-primary/20" :
                        lead.status === "contacted" ? "bg-warning/20" : "bg-success/20"
                        }`}>
                        <Text className={`text-xs ${lead.status === "new" ? "text-primary" :
                          lead.status === "contacted" ? "text-warning" : "text-success"
                          }`}>
                          {lead.status === "new" ? "Neu" : lead.status === "contacted" ? "Kontaktiert" : "Qualifiziert"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Lead Packages Info */}
            <Text className="text-base font-medium text-foreground mt-8">Lead-Pakete kaufen</Text>
            {LEAD_PACKAGES.map(pkg => (
              <View key={pkg.id} className="bg-surface rounded-xl p-4 border border-border mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-lg font-bold text-foreground">{pkg.name}</Text>
                  <Text className="text-xl font-bold text-primary">€{pkg.totalPrice}/Mo</Text>
                </View>
                <Text className="text-sm text-muted mb-3">{pkg.leadsPerMonth} Leads • €{pkg.pricePerLead}/Lead</Text>
                <View className="gap-1 mb-3">
                  {pkg.features.map((feature, i) => (
                    <View key={i} className="flex-row items-center gap-2">
                      <IconSymbol name="checkmark.circle.fill" size={14} color={colors.success} />
                      <Text className="text-sm text-foreground">{feature}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity className="bg-primary py-2 rounded-lg">
                  <Text className="text-center text-sm font-semibold text-white">Paket buchen</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">Einstellungen</Text>

            {/* Current Plan */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-semibold text-foreground">Aktueller Plan</Text>
                <View className={`px-3 py-1 rounded-full ${vendorTier === "enterprise" ? "bg-warning/20" :
                  vendorTier === "pro" ? "bg-primary/20" : "bg-muted/20"
                  }`}>
                  <Text className={`text-sm font-medium ${vendorTier === "enterprise" ? "text-warning" :
                    vendorTier === "pro" ? "text-primary" : "text-muted"
                    }`}>
                    {subscription.name}
                  </Text>
                </View>
              </View>
              <Text className="text-2xl font-bold text-foreground mb-2">€{subscription.monthlyPrice}/Monat</Text>

              <TouchableOpacity
                className="bg-primary py-3 rounded-lg mt-4"
                onPress={() => setShowUpgrade(true)}
              >
                <Text className="text-center text-base font-semibold text-white">Plan upgraden</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center p-4">
          <View className="bg-background rounded-2xl p-4 w-full max-w-md max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">Plan wählen</Text>
              <TouchableOpacity onPress={() => setShowUpgrade(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(Object.entries(VENDOR_SUBSCRIPTIONS) as [VendorTier, typeof VENDOR_SUBSCRIPTIONS.basic][]).map(([tier, sub]) => (
                <TouchableOpacity
                  key={tier}
                  className={`rounded-xl p-4 mb-3 border-2 ${vendorTier === tier ? 'border-primary bg-primary/10' : 'border-border bg-surface'
                    }`}
                  onPress={() => {
                    // Start upgrade flow
                    setShowUpgrade(false);
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-lg font-bold text-foreground">{sub.name}</Text>
                    <Text className="text-xl font-bold text-primary">€{sub.monthlyPrice}/Mo</Text>
                  </View>
                  <Text className="text-xs text-muted mb-3">{sub.transactionFee}% Transaktionsgebühr</Text>
                  <View className="gap-1">
                    {sub.features.slice(0, 4).map((feature, i) => (
                      <View key={i} className="flex-row items-center gap-2">
                        <IconSymbol name="checkmark" size={12} color={colors.success} />
                        <Text className="text-xs text-foreground">{feature}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
