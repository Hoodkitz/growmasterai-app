import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/auth-context";
import {
  VENDOR_SUBSCRIPTIONS,
  AD_PRICING,
  LEAD_PACKAGES,
  MOCK_VENDOR_ANALYTICS,
  MOCK_MARKETPLACE_PRODUCTS,
  VendorTier,
} from "@/lib/marketplace";

type TabType = "dashboard" | "products" | "campaigns" | "leads" | "analytics" | "settings";

export default function VendorPortalScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAppAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [vendorTier, setVendorTier] = useState<VendorTier>("pro");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const subscription = VENDOR_SUBSCRIPTIONS[vendorTier];
  const analytics = MOCK_VENDOR_ANALYTICS;

  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: "chart.bar.fill" },
    { id: "products" as TabType, label: "Produkte", icon: "bag.fill" },
    { id: "campaigns" as TabType, label: "Werbung", icon: "megaphone.fill" },
    { id: "leads" as TabType, label: "Leads", icon: "person.2.fill" },
    { id: "analytics" as TabType, label: "Analytics", icon: "chart.pie.fill" },
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
            <Text className="text-2xl">🏪</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">Mein Shop</Text>
            <View className="flex-row items-center gap-2">
              <View className={`px-2 py-0.5 rounded-full ${
                vendorTier === "enterprise" ? "bg-warning/20" : 
                vendorTier === "pro" ? "bg-primary/20" : "bg-muted/20"
              }`}>
                <Text className={`text-xs font-medium ${
                  vendorTier === "enterprise" ? "text-warning" : 
                  vendorTier === "pro" ? "text-primary" : "text-muted"
                }`}>
                  {subscription.name}
                </Text>
              </View>
              <IconSymbol name="checkmark.seal.fill" size={14} color={colors.success} />
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
              className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full ${
                activeTab === tab.id ? 'bg-primary' : 'bg-surface'
              }`}
              onPress={() => setActiveTab(tab.id)}
            >
              <IconSymbol 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.id ? "#fff" : colors.muted} 
              />
              <Text className={`text-sm font-medium ${
                activeTab === tab.id ? 'text-white' : 'text-muted'
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
            {/* Revenue Overview */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">💰 Umsatz diesen Monat</Text>
              <Text className="text-3xl font-bold text-primary mb-2">€{analytics.revenue.total.toLocaleString()}</Text>
              <View className="flex-row items-center gap-2">
                <IconSymbol name="arrow.up.right" size={14} color={colors.success} />
                <Text className="text-sm text-success">+23% vs. letzter Monat</Text>
              </View>
              
              <View className="flex-row gap-3 mt-4">
                <View className="flex-1 bg-background rounded-lg p-3">
                  <Text className="text-xs text-muted">Produkte</Text>
                  <Text className="text-lg font-bold text-foreground">€{analytics.revenue.products}</Text>
                </View>
                <View className="flex-1 bg-background rounded-lg p-3">
                  <Text className="text-xs text-muted">Auktionen</Text>
                  <Text className="text-lg font-bold text-foreground">€{analytics.revenue.auctions}</Text>
                </View>
                <View className="flex-1 bg-background rounded-lg p-3">
                  <Text className="text-xs text-muted">Verlosungen</Text>
                  <Text className="text-lg font-bold text-foreground">€{analytics.revenue.raffles}</Text>
                </View>
              </View>
            </View>

            {/* Fees Overview */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">📊 Gebühren & Netto</Text>
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">Transaktionsgebühren ({subscription.transactionFee}%)</Text>
                  <Text className="text-sm text-foreground">-€{analytics.fees.transactionFees}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">Abo-Gebühr</Text>
                  <Text className="text-sm text-foreground">-€{analytics.fees.subscriptionFee}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">Werbeausgaben</Text>
                  <Text className="text-sm text-foreground">-€{analytics.fees.adSpend}</Text>
                </View>
                <View className="h-px bg-border my-2" />
                <View className="flex-row justify-between">
                  <Text className="text-base font-semibold text-foreground">Netto-Umsatz</Text>
                  <Text className="text-base font-bold text-success">€{analytics.netRevenue.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Quick Stats */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                <IconSymbol name="eye.fill" size={24} color={colors.primary} />
                <Text className="text-2xl font-bold text-foreground mt-2">{(analytics.metrics.impressions / 1000).toFixed(1)}K</Text>
                <Text className="text-xs text-muted">Impressionen</Text>
              </View>
              <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                <IconSymbol name="hand.tap.fill" size={24} color={colors.warning} />
                <Text className="text-2xl font-bold text-foreground mt-2">{analytics.metrics.clicks}</Text>
                <Text className="text-xs text-muted">Klicks</Text>
              </View>
              <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
                <IconSymbol name="cart.fill" size={24} color={colors.success} />
                <Text className="text-2xl font-bold text-foreground mt-2">{analytics.metrics.conversions}</Text>
                <Text className="text-xs text-muted">Verkäufe</Text>
              </View>
            </View>

            {/* Top Products */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">🏆 Top Produkte</Text>
              {analytics.topProducts.map((product, index) => (
                <View key={product.productId} className="flex-row items-center gap-3 py-2 border-b border-border last:border-0">
                  <Text className="text-lg font-bold text-muted w-6">#{index + 1}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{product.name}</Text>
                    <Text className="text-xs text-muted">{product.units} verkauft</Text>
                  </View>
                  <Text className="text-sm font-bold text-primary">€{product.revenue}</Text>
                </View>
              ))}
            </View>

            {/* Quick Actions */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">⚡ Schnellaktionen</Text>
              <View className="gap-2">
                <TouchableOpacity className="flex-row items-center gap-3 p-3 bg-primary/10 rounded-lg">
                  <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
                  <Text className="text-base font-medium text-primary">Neues Produkt hinzufügen</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center gap-3 p-3 bg-warning/10 rounded-lg">
                  <IconSymbol name="gavel.fill" size={24} color={colors.warning} />
                  <Text className="text-base font-medium text-warning">Auktion erstellen</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center gap-3 p-3 bg-success/10 rounded-lg">
                  <IconSymbol name="gift.fill" size={24} color={colors.success} />
                  <Text className="text-base font-medium text-success">Verlosung starten</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center gap-3 p-3 bg-error/10 rounded-lg">
                  <IconSymbol name="megaphone.fill" size={24} color={colors.error} />
                  <Text className="text-base font-medium text-error">Werbekampagne starten</Text>
                </TouchableOpacity>
              </View>
            </View>
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

            {/* Product Stats */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-xl p-3 border border-border items-center">
                <Text className="text-2xl font-bold text-foreground">24</Text>
                <Text className="text-xs text-muted">Aktiv</Text>
              </View>
              <View className="flex-1 bg-surface rounded-xl p-3 border border-border items-center">
                <Text className="text-2xl font-bold text-foreground">3</Text>
                <Text className="text-xs text-muted">Featured</Text>
              </View>
              <View className="flex-1 bg-surface rounded-xl p-3 border border-border items-center">
                <Text className="text-2xl font-bold text-warning">2</Text>
                <Text className="text-xs text-muted">Niedrig</Text>
              </View>
            </View>

            {/* Product List */}
            {MOCK_MARKETPLACE_PRODUCTS.map(product => (
              <TouchableOpacity key={product.id} className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row items-start gap-3">
                  <View className="w-16 h-16 rounded-lg bg-background items-center justify-center">
                    <Text className="text-2xl">🌱</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>
                        {product.name}
                      </Text>
                      {product.featured && (
                        <View className="bg-primary/20 px-2 py-0.5 rounded">
                          <Text className="text-xs text-primary">Featured</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-muted">{product.category}</Text>
                    <View className="flex-row items-center gap-4 mt-2">
                      <Text className="text-base font-bold text-primary">€{product.price}</Text>
                      <Text className="text-xs text-muted">Stock: {product.stock}</Text>
                      <Text className="text-xs text-success">{product.sold} verkauft</Text>
                    </View>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </View>
              </TouchableOpacity>
            ))}
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

            {/* Ad Placements */}
            <Text className="text-base font-medium text-foreground">Verfügbare Platzierungen</Text>
            {Object.entries(AD_PRICING).map(([placement, pricing]) => (
              <TouchableOpacity key={placement} className="bg-surface rounded-xl p-4 border border-border">
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
              </TouchableOpacity>
            ))}

            {/* Active Campaigns */}
            <Text className="text-base font-medium text-foreground mt-4">Aktive Kampagnen</Text>
            <View className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-base font-semibold text-foreground">Frühlings-Sale Banner</Text>
                  <Text className="text-xs text-muted">Home Banner • CPC</Text>
                </View>
                <View className="bg-success/20 px-2 py-1 rounded-full">
                  <Text className="text-xs font-medium text-success">Aktiv</Text>
                </View>
              </View>
              <View className="flex-row gap-4">
                <View>
                  <Text className="text-xs text-muted">Budget</Text>
                  <Text className="text-sm font-medium text-foreground">€500</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted">Ausgegeben</Text>
                  <Text className="text-sm font-medium text-warning">€234</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted">Klicks</Text>
                  <Text className="text-sm font-medium text-foreground">468</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted">Conversions</Text>
                  <Text className="text-sm font-medium text-success">23</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">Lead-Generierung</Text>
            
            {/* Lead Packages */}
            <Text className="text-base font-medium text-foreground">Lead-Pakete</Text>
            {LEAD_PACKAGES.map(pkg => (
              <View key={pkg.id} className="bg-surface rounded-xl p-4 border border-border">
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

            {/* Recent Leads */}
            <Text className="text-base font-medium text-foreground mt-4">Neueste Leads</Text>
            {[
              { name: "Max M.", type: "Produktanfrage", value: "€150", time: "vor 2h", status: "new" },
              { name: "Lisa K.", type: "Großbestellung", value: "€2.500", time: "vor 5h", status: "contacted" },
              { name: "Tom S.", type: "Beratung", value: "€300", time: "gestern", status: "qualified" },
            ].map((lead, i) => (
              <TouchableOpacity key={i} className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                    <Text className="text-lg">👤</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">{lead.name}</Text>
                    <Text className="text-xs text-muted">{lead.type} • {lead.time}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-bold text-primary">{lead.value}</Text>
                    <View className={`px-2 py-0.5 rounded-full ${
                      lead.status === "new" ? "bg-primary/20" :
                      lead.status === "contacted" ? "bg-warning/20" : "bg-success/20"
                    }`}>
                      <Text className={`text-xs ${
                        lead.status === "new" ? "text-primary" :
                        lead.status === "contacted" ? "text-warning" : "text-success"
                      }`}>
                        {lead.status === "new" ? "Neu" : lead.status === "contacted" ? "Kontaktiert" : "Qualifiziert"}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">Detaillierte Analytics</Text>
            
            {/* Conversion Funnel */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-base font-semibold text-foreground mb-3">📊 Conversion Funnel</Text>
              {[
                { label: "Impressionen", value: analytics.metrics.impressions, percent: 100 },
                { label: "Klicks", value: analytics.metrics.clicks, percent: (analytics.metrics.clicks / analytics.metrics.impressions * 100) },
                { label: "Conversions", value: analytics.metrics.conversions, percent: analytics.metrics.conversionRate },
              ].map((step, i) => (
                <View key={i} className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm text-muted">{step.label}</Text>
                    <Text className="text-sm font-medium text-foreground">{step.value.toLocaleString()}</Text>
                  </View>
                  <View className="h-2 bg-background rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, step.percent)}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Customer Demographics */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-base font-semibold text-foreground mb-3">👥 Kundendemografie</Text>
              
              <Text className="text-sm text-muted mb-2">Erfahrungslevel</Text>
              <View className="flex-row gap-2 mb-4">
                {Object.entries(analytics.customerDemographics.experienceLevel).map(([level, percent]) => (
                  <View key={level} className="flex-1 bg-background rounded-lg p-2 items-center">
                    <Text className="text-lg font-bold text-foreground">{percent}%</Text>
                    <Text className="text-xs text-muted capitalize">{level === "beginner" ? "Anfänger" : level === "intermediate" ? "Mittel" : "Profi"}</Text>
                  </View>
                ))}
              </View>

              <Text className="text-sm text-muted mb-2">Abo-Stufe</Text>
              <View className="flex-row gap-2">
                {Object.entries(analytics.customerDemographics.subscriptionTier).map(([tier, percent]) => (
                  <View key={tier} className="flex-1 bg-background rounded-lg p-2 items-center">
                    <Text className="text-lg font-bold text-foreground">{percent}%</Text>
                    <Text className="text-xs text-muted capitalize">{tier}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Key Metrics */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-base font-semibold text-foreground mb-3">📈 Wichtige Kennzahlen</Text>
              <View className="gap-3">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">Conversion Rate</Text>
                  <Text className="text-sm font-bold text-success">{analytics.metrics.conversionRate}%</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">Durchschn. Bestellwert</Text>
                  <Text className="text-sm font-bold text-foreground">€{analytics.metrics.averageOrderValue}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">Customer Lifetime Value</Text>
                  <Text className="text-sm font-bold text-primary">€{analytics.metrics.customerLifetimeValue}</Text>
                </View>
              </View>
            </View>
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
                <View className={`px-3 py-1 rounded-full ${
                  vendorTier === "enterprise" ? "bg-warning/20" : 
                  vendorTier === "pro" ? "bg-primary/20" : "bg-muted/20"
                }`}>
                  <Text className={`text-sm font-medium ${
                    vendorTier === "enterprise" ? "text-warning" : 
                    vendorTier === "pro" ? "text-primary" : "text-muted"
                  }`}>
                    {subscription.name}
                  </Text>
                </View>
              </View>
              <Text className="text-2xl font-bold text-foreground mb-2">€{subscription.monthlyPrice}/Monat</Text>
              <Text className="text-sm text-muted mb-3">oder €{subscription.yearlyPrice}/Jahr (2 Monate gratis)</Text>
              
              <View className="gap-2 mb-4">
                {subscription.features.slice(0, 4).map((feature, i) => (
                  <View key={i} className="flex-row items-center gap-2">
                    <IconSymbol name="checkmark.circle.fill" size={14} color={colors.success} />
                    <Text className="text-sm text-foreground">{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                className="bg-primary py-3 rounded-lg"
                onPress={() => setShowUpgrade(true)}
              >
                <Text className="text-center text-base font-semibold text-white">Plan upgraden</Text>
              </TouchableOpacity>
            </View>

            {/* Shop Settings */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-base font-semibold text-foreground mb-3">Shop-Einstellungen</Text>
              <View className="gap-3">
                <TouchableOpacity className="flex-row items-center justify-between py-2">
                  <Text className="text-sm text-foreground">Shop-Profil bearbeiten</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-between py-2">
                  <Text className="text-sm text-foreground">Zahlungsmethoden</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-between py-2">
                  <Text className="text-sm text-foreground">Versandeinstellungen</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-between py-2">
                  <Text className="text-sm text-foreground">API-Zugang</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Support */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-base font-semibold text-foreground mb-3">Support</Text>
              <TouchableOpacity className="flex-row items-center gap-3 py-2">
                <IconSymbol name="envelope.fill" size={20} color={colors.primary} />
                <Text className="text-sm text-foreground">vendor-support@growmaster.app</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center gap-3 py-2">
                <IconSymbol name="doc.text.fill" size={20} color={colors.primary} />
                <Text className="text-sm text-foreground">Vendor-Dokumentation</Text>
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
                  className={`rounded-xl p-4 mb-3 border-2 ${
                    vendorTier === tier ? 'border-primary bg-primary/10' : 'border-border bg-surface'
                  }`}
                  onPress={() => {
                    setVendorTier(tier);
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
