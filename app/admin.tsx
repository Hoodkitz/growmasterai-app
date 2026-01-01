import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/auth-context";
import { MOCK_VENDORS, Vendor } from "@/lib/community";

type TabType = "dashboard" | "vendors" | "contests" | "ads" | "requests";

interface VendorRequest {
  id: string;
  companyName: string;
  email: string;
  website: string;
  type: "auction" | "raffle" | "deal" | "ad";
  description: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
}

const MOCK_REQUESTS: VendorRequest[] = [
  {
    id: "req1",
    companyName: "GrowLights Pro",
    email: "contact@growlightspro.com",
    website: "https://growlightspro.com",
    type: "deal",
    description: "Möchten 20% Rabatt auf LED-Panels anbieten",
    status: "pending",
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "req2",
    companyName: "Rare Seeds Co",
    email: "info@rareseeds.co",
    website: "https://rareseeds.co",
    type: "auction",
    description: "Limitierte Genetik versteigern",
    status: "pending",
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  proUsers: number;
  totalDiagnoses: number;
  totalPosts: number;
  activeContests: number;
  pendingRequests: number;
  revenue: number;
}

const MOCK_STATS: DashboardStats = {
  totalUsers: 12543,
  activeUsers: 3421,
  premiumUsers: 892,
  proUsers: 234,
  totalDiagnoses: 45678,
  totalPosts: 8934,
  activeContests: 3,
  pendingRequests: 5,
  revenue: 8945,
};

export default function AdminScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isAdmin } = useAppAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [vendors, setVendors] = useState(MOCK_VENDORS);
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [emailTemplate, setEmailTemplate] = useState("");

  // Check admin access
  if (!isAdmin) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-error/20 items-center justify-center mb-4">
            <IconSymbol name="lock.fill" size={40} color={colors.error} />
          </View>
          <Text className="text-xl font-bold text-foreground mb-2">Zugriff verweigert</Text>
          <Text className="text-base text-muted text-center mb-6">
            Du hast keine Berechtigung, auf das Admin-Panel zuzugreifen.
          </Text>
          <TouchableOpacity 
            className="bg-primary px-6 py-3 rounded-full"
            onPress={() => router.back()}
          >
            <Text className="text-base font-semibold text-white">Zurück</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const handleApproveRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: "approved" as const } : req
    ));
    Alert.alert("Erfolg", "Anfrage wurde genehmigt!");
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: "rejected" as const } : req
    ));
    Alert.alert("Erfolg", "Anfrage wurde abgelehnt.");
  };

  const handleSendVendorInvite = () => {
    if (!emailTemplate.trim()) {
      Alert.alert("Fehler", "Bitte gib eine E-Mail-Adresse ein.");
      return;
    }
    Alert.alert(
      "Einladung gesendet",
      `Eine Einladung wurde an ${emailTemplate} gesendet.`,
      [{ text: "OK", onPress: () => setEmailTemplate("") }]
    );
  };

  const renderStatCard = (label: string, value: string | number, icon: string, color: string) => (
    <View className="bg-surface rounded-xl p-4 border border-border flex-1">
      <View className="flex-row items-center gap-2 mb-2">
        <IconSymbol name={icon as any} size={18} color={color} />
        <Text className="text-xs text-muted">{label}</Text>
      </View>
      <Text className="text-xl font-bold text-foreground">{value}</Text>
    </View>
  );

  const renderVendorRequest = (request: VendorRequest) => (
    <View key={request.id} className="bg-surface rounded-xl p-4 border border-border mb-3">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">{request.companyName}</Text>
          <Text className="text-sm text-muted">{request.email}</Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${
          request.status === "pending" ? "bg-warning/20" :
          request.status === "approved" ? "bg-success/20" : "bg-error/20"
        }`}>
          <Text className={`text-xs font-medium ${
            request.status === "pending" ? "text-warning" :
            request.status === "approved" ? "text-success" : "text-error"
          }`}>
            {request.status === "pending" ? "Ausstehend" :
             request.status === "approved" ? "Genehmigt" : "Abgelehnt"}
          </Text>
        </View>
      </View>
      
      <View className="bg-background rounded-lg p-3 mb-3">
        <Text className="text-xs text-muted mb-1">
          Typ: {request.type === "auction" ? "Auktion" :
                request.type === "raffle" ? "Verlosung" :
                request.type === "deal" ? "Angebot" : "Werbung"}
        </Text>
        <Text className="text-sm text-foreground">{request.description}</Text>
      </View>
      
      {request.status === "pending" && (
        <View className="flex-row gap-2">
          <TouchableOpacity 
            className="flex-1 bg-success py-2 rounded-lg"
            onPress={() => handleApproveRequest(request.id)}
          >
            <Text className="text-center text-sm font-semibold text-white">Genehmigen</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 bg-error py-2 rounded-lg"
            onPress={() => handleRejectRequest(request.id)}
          >
            <Text className="text-center text-sm font-semibold text-white">Ablehnen</Text>
          </TouchableOpacity>
        </View>
      )}
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
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">Admin Panel</Text>
            <Text className="text-sm text-muted">support@growmaster.app</Text>
          </View>
          <View className="bg-error/20 px-3 py-1 rounded-full">
            <Text className="text-xs font-medium text-error">ADMIN</Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
          <View className="flex-row gap-2">
            {[
              { id: "dashboard" as TabType, label: "Dashboard", icon: "chart.bar.fill" },
              { id: "vendors" as TabType, label: "Anbieter", icon: "building.2.fill" },
              { id: "requests" as TabType, label: "Anfragen", icon: "envelope.fill" },
              { id: "contests" as TabType, label: "Gewinnspiele", icon: "trophy.fill" },
              { id: "ads" as TabType, label: "Werbung", icon: "megaphone.fill" },
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

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {activeTab === "dashboard" && (
          <>
            {/* Stats Grid */}
            <Text className="text-lg font-semibold text-foreground mb-3">Übersicht</Text>
            <View className="flex-row gap-3 mb-3">
              {renderStatCard("Nutzer", MOCK_STATS.totalUsers.toLocaleString(), "person.2.fill", colors.primary)}
              {renderStatCard("Aktiv", MOCK_STATS.activeUsers.toLocaleString(), "person.fill", colors.success)}
            </View>
            <View className="flex-row gap-3 mb-3">
              {renderStatCard("Premium", MOCK_STATS.premiumUsers, "star.fill", colors.primary)}
              {renderStatCard("Pro", MOCK_STATS.proUsers, "crown.fill", colors.warning)}
            </View>
            <View className="flex-row gap-3 mb-3">
              {renderStatCard("Diagnosen", MOCK_STATS.totalDiagnoses.toLocaleString(), "viewfinder", colors.success)}
              {renderStatCard("Posts", MOCK_STATS.totalPosts.toLocaleString(), "bubble.left.fill", colors.primary)}
            </View>
            
            {/* Revenue */}
            <View className="bg-success/10 rounded-xl p-4 border border-success/30 mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <IconSymbol name="dollarsign.circle.fill" size={24} color={colors.success} />
                <Text className="text-base font-semibold text-foreground">Monatlicher Umsatz</Text>
              </View>
              <Text className="text-3xl font-bold text-success">€{MOCK_STATS.revenue.toLocaleString()}</Text>
            </View>

            {/* Quick Actions */}
            <Text className="text-lg font-semibold text-foreground mb-3">Schnellaktionen</Text>
            <View className="gap-2 mb-4">
              <TouchableOpacity className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3">
                <IconSymbol name="bell.fill" size={20} color={colors.primary} />
                <Text className="text-base text-foreground flex-1">Push-Benachrichtigung senden</Text>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3">
                <IconSymbol name="trophy.fill" size={20} color={colors.warning} />
                <Text className="text-base text-foreground flex-1">Neues Gewinnspiel erstellen</Text>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3">
                <IconSymbol name="doc.text.fill" size={20} color={colors.success} />
                <Text className="text-base text-foreground flex-1">Bericht exportieren</Text>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === "vendors" && (
          <>
            {/* Invite Vendor */}
            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <Text className="text-base font-semibold text-foreground mb-3">Anbieter einladen</Text>
              <TextInput
                className="bg-background rounded-lg px-4 py-3 text-foreground border border-border mb-3"
                placeholder="E-Mail-Adresse des Anbieters"
                placeholderTextColor={colors.muted}
                value={emailTemplate}
                onChangeText={setEmailTemplate}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity 
                className="bg-primary py-3 rounded-lg"
                onPress={handleSendVendorInvite}
              >
                <Text className="text-center text-base font-semibold text-white">Einladung senden</Text>
              </TouchableOpacity>
            </View>

            {/* Vendor List */}
            <Text className="text-lg font-semibold text-foreground mb-3">Verifizierte Anbieter</Text>
            {vendors.map(vendor => (
              <View key={vendor.id} className="bg-surface rounded-xl p-4 border border-border mb-3">
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center">
                    <Text className="text-2xl">{vendor.logo}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold text-foreground">{vendor.name}</Text>
                      {vendor.isVerified && (
                        <IconSymbol name="checkmark.seal.fill" size={16} color={colors.primary} />
                      )}
                    </View>
                    <Text className="text-sm text-muted">{vendor.products} Produkte</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <IconSymbol name="star.fill" size={14} color={colors.warning} />
                    <Text className="text-sm font-medium text-foreground">{vendor.rating}</Text>
                  </View>
                </View>
                <Text className="text-sm text-muted">{vendor.description}</Text>
              </View>
            ))}
          </>
        )}

        {activeTab === "requests" && (
          <>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-foreground">Anbieter-Anfragen</Text>
              <View className="bg-warning/20 px-2 py-1 rounded-full">
                <Text className="text-xs font-medium text-warning">
                  {requests.filter(r => r.status === "pending").length} ausstehend
                </Text>
              </View>
            </View>
            
            {requests.map(renderVendorRequest)}
            
            {requests.length === 0 && (
              <View className="items-center py-8">
                <IconSymbol name="envelope.fill" size={48} color={colors.muted} />
                <Text className="text-base text-muted mt-4">Keine Anfragen vorhanden</Text>
              </View>
            )}
          </>
        )}

        {activeTab === "contests" && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">Gewinnspiel-Verwaltung</Text>
            
            <TouchableOpacity className="bg-primary rounded-xl p-4 mb-4 flex-row items-center gap-3">
              <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
              <Text className="text-base font-semibold text-white">Neues Gewinnspiel erstellen</Text>
            </TouchableOpacity>
            
            <View className="bg-surface rounded-xl p-4 border border-border mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-semibold text-foreground">Ernte des Monats</Text>
                <View className="bg-success/20 px-2 py-1 rounded-full">
                  <Text className="text-xs font-medium text-success">Aktiv</Text>
                </View>
              </View>
              <Text className="text-sm text-muted mb-2">156 Teilnehmer • Endet in 15 Tagen</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity className="flex-1 bg-background py-2 rounded-lg border border-border">
                  <Text className="text-center text-sm font-medium text-foreground">Bearbeiten</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-error/20 py-2 rounded-lg">
                  <Text className="text-center text-sm font-medium text-error">Beenden</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {activeTab === "ads" && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">Werbeverwaltung</Text>
            
            {/* Ad Stats */}
            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <Text className="text-base font-semibold text-foreground mb-3">Aktive Kampagnen</Text>
              <View className="flex-row gap-3">
                <View className="flex-1 bg-background rounded-lg p-3">
                  <Text className="text-2xl font-bold text-primary">5</Text>
                  <Text className="text-xs text-muted">Aktive Ads</Text>
                </View>
                <View className="flex-1 bg-background rounded-lg p-3">
                  <Text className="text-2xl font-bold text-success">12.4k</Text>
                  <Text className="text-xs text-muted">Impressionen</Text>
                </View>
                <View className="flex-1 bg-background rounded-lg p-3">
                  <Text className="text-2xl font-bold text-warning">€890</Text>
                  <Text className="text-xs text-muted">Einnahmen</Text>
                </View>
              </View>
            </View>
            
            {/* Ad Pricing */}
            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <Text className="text-base font-semibold text-foreground mb-3">Preisliste</Text>
              <View className="gap-2">
                <View className="flex-row items-center justify-between py-2 border-b border-border">
                  <Text className="text-sm text-foreground">Home Banner (klein)</Text>
                  <Text className="text-sm font-semibold text-primary">€50/Woche</Text>
                </View>
                <View className="flex-row items-center justify-between py-2 border-b border-border">
                  <Text className="text-sm text-foreground">Community Banner</Text>
                  <Text className="text-sm font-semibold text-primary">€75/Woche</Text>
                </View>
                <View className="flex-row items-center justify-between py-2">
                  <Text className="text-sm text-foreground">Marktplatz Feature</Text>
                  <Text className="text-sm font-semibold text-primary">€100/Woche</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
