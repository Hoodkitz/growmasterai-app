import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

type TabType = "dashboard" | "vendors" | "contests" | "ads" | "requests";

const isPending = (status: string) =>
  status === "new" || status === "contacted" || status === "negotiating";
const BUSINESS_LABELS: Record<string, string> = {
  seedbank: "Seedbank",
  growshop: "Growshop",
  headshop: "Headshop",
  nutrient: "Dünger",
  equipment: "Equipment",
  other: "Sonstiges",
};

export default function AdminScreen() {
  const router = useRouter();
  const colors = useColors();
  useSafeAreaInsets();
  const { user, isAdmin } = useAppAuth();

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [emailTemplate, setEmailTemplate] = useState("");
  const [showGiveawayForm, setShowGiveawayForm] = useState(false);
  const [gwTitle, setGwTitle] = useState("");
  const [gwPrize, setGwPrize] = useState("");
  const [gwDays, setGwDays] = useState("14");

  const utils = trpc.useUtils();
  const statsQuery = trpc.admin.stats.useQuery(undefined, { enabled: isAdmin });
  const vendorsQuery = trpc.admin.vendors.useQuery(undefined, {
    enabled: isAdmin && activeTab === "vendors",
  });
  const inquiriesQuery = trpc.admin.inquiries.useQuery(undefined, {
    enabled: isAdmin && activeTab === "requests",
  });
  const giveawaysQuery = trpc.admin.giveaways.useQuery(undefined, {
    enabled: isAdmin && activeTab === "contests",
  });
  const updateInquiry = trpc.admin.updateInquiry.useMutation({
    onSuccess: () => {
      utils.admin.inquiries.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (e) => Alert.alert("Fehler", e.message),
  });
  const endGiveaway = trpc.admin.endGiveaway.useMutation({
    onSuccess: () => {
      utils.admin.giveaways.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (e) => Alert.alert("Fehler", e.message),
  });
  const createGiveaway = trpc.admin.createGiveaway.useMutation({
    onSuccess: () => {
      setShowGiveawayForm(false);
      setGwTitle("");
      setGwPrize("");
      setGwDays("14");
      utils.admin.giveaways.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (e) => Alert.alert("Fehler", e.message),
  });
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const pushCountQuery = trpc.push.tokenCount.useQuery(undefined, {
    enabled: isAdmin && activeTab === "dashboard",
  });
  const broadcastPush = trpc.push.broadcast.useMutation({
    onSuccess: (r) => {
      setPushTitle("");
      setPushBody("");
      pushCountQuery.refetch();
      Alert.alert(
        "Push gesendet",
        `Versucht: ${r.attempted}, zugestellt an Expo: ${r.accepted}, fehlgeschlagen: ${r.failed}${r.removed ? `, ungültige Tokens entfernt: ${r.removed}` : ""}`,
      );
    },
    onError: (e) => Alert.alert("Fehler", e.message),
  });
  const handleBroadcast = () => {
    if (!pushTitle.trim() || !pushBody.trim()) {
      Alert.alert("Fehler", "Titel und Nachricht sind erforderlich.");
      return;
    }
    Alert.alert(
      "Push an alle senden?",
      `Die Nachricht geht an alle registrierten Geräte (${pushCountQuery.data?.count ?? "?"}).`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Senden",
          style: "destructive",
          onPress: () =>
            broadcastPush.mutate({
              title: pushTitle.trim(),
              body: pushBody.trim(),
            }),
        },
      ],
    );
  };
  const stats = statsQuery.data;
  const vendors = vendorsQuery.data ?? [];
  const requests = inquiriesQuery.data ?? [];
  const giveawayList = giveawaysQuery.data ?? [];

  // Check admin access
  if (!isAdmin) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-error/20 items-center justify-center mb-4">
            <IconSymbol name="lock.fill" size={40} color={colors.error} />
          </View>
          <Text className="text-xl font-bold text-foreground mb-2">
            Zugriff verweigert
          </Text>
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

  const handleApproveRequest = (id: number) =>
    updateInquiry.mutate({ id, status: "approved" });
  const handleRejectRequest = (id: number) =>
    updateInquiry.mutate({ id, status: "rejected" });

  const handleSendVendorInvite = async () => {
    const email = emailTemplate.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert("Fehler", "Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }
    const subject = encodeURIComponent("Einladung: Anbieter bei GrowMaster AI");
    const body = encodeURIComponent(
      "Hallo,\n\nwir laden Sie ein, Ihr Unternehmen als Anbieter bei GrowMaster AI zu präsentieren.\n\nViele Grüße\nGrowMaster Team",
    );
    try {
      await Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
      setEmailTemplate("");
    } catch {
      Alert.alert("Fehler", "Es konnte keine E-Mail-App geöffnet werden.");
    }
  };

  const handleExportReport = async () => {
    if (!stats) {
      Alert.alert("Fehler", "Statistiken sind noch nicht geladen.");
      return;
    }
    const report = [
      `GrowMaster AI – Admin-Bericht (${new Date().toLocaleDateString("de-DE")})`,
      `Nutzer gesamt: ${stats.totalUsers}`,
      `Aktiv (30 Tage): ${stats.activeUsers}`,
      `Premium: ${stats.premiumUsers}`,
      `Pro: ${stats.proUsers}`,
      `Diagnosen: ${stats.totalDiagnoses}`,
      `Posts: ${stats.totalPosts}`,
      `Aktive Gewinnspiele: ${stats.activeContests}`,
      `Offene Anfragen: ${stats.pendingRequests}`,
      `Aktive Ads: ${stats.activeAds}`,
      `Ad-Impressionen: ${stats.adImpressions}`,
      `Werbeeinnahmen: €${stats.adRevenue.toFixed(2)}`,
    ].join("\n");
    try {
      await Share.share({ message: report, title: "Admin-Bericht" });
    } catch {}
  };

  const handleCreateGiveaway = () => {
    const days = parseInt(gwDays, 10);
    if (
      !gwTitle.trim() ||
      !gwPrize.trim() ||
      !Number.isFinite(days) ||
      days < 1
    ) {
      Alert.alert(
        "Fehler",
        "Titel, Preis und eine gültige Laufzeit (Tage) sind erforderlich.",
      );
      return;
    }
    createGiveaway.mutate({
      title: gwTitle.trim(),
      prize: gwPrize.trim(),
      days,
    });
  };

  const loadingView = (
    <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
  );

  const renderStatCard = (
    label: string,
    value: string | number,
    icon: string,
    color: string,
  ) => (
    <View className="bg-surface rounded-xl p-4 border border-border flex-1">
      <View className="flex-row items-center gap-2 mb-2">
        <IconSymbol name={icon as any} size={18} color={color} />
        <Text className="text-xs text-muted">{label}</Text>
      </View>
      <Text className="text-xl font-bold text-foreground">{value}</Text>
    </View>
  );

  const renderVendorRequest = (request: (typeof requests)[number]) => (
    <View
      key={request.id}
      className="bg-surface rounded-xl p-4 border border-border mb-3"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">
            {request.companyName}
          </Text>
          <Text className="text-sm text-muted">{request.email}</Text>
        </View>
        <View
          className={`px-2 py-1 rounded-full ${
            isPending(request.status)
              ? "bg-warning/20"
              : request.status === "approved"
                ? "bg-success/20"
                : "bg-error/20"
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              isPending(request.status)
                ? "text-warning"
                : request.status === "approved"
                  ? "text-success"
                  : "text-error"
            }`}
          >
            {request.status === "new"
              ? "Neu"
              : request.status === "contacted"
                ? "Kontaktiert"
                : request.status === "negotiating"
                  ? "Verhandlung"
                  : request.status === "approved"
                    ? "Genehmigt"
                    : "Abgelehnt"}
          </Text>
        </View>
      </View>

      <View className="bg-background rounded-lg p-3 mb-3">
        <Text className="text-xs text-muted mb-1">
          Typ: {BUSINESS_LABELS[request.businessType] ?? request.businessType} •{" "}
          {request.contactName}
        </Text>
        <Text className="text-sm text-foreground">
          {request.message || request.website || "—"}
        </Text>
      </View>

      {isPending(request.status) && (
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="flex-1 bg-success py-2 rounded-lg"
            onPress={() => handleApproveRequest(request.id)}
          >
            <Text className="text-center text-sm font-semibold text-white">
              Genehmigen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-error py-2 rounded-lg"
            onPress={() => handleRejectRequest(request.id)}
          >
            <Text className="text-center text-sm font-semibold text-white">
              Ablehnen
            </Text>
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
            <IconSymbol
              name="chevron.left"
              size={24}
              color={colors.foreground}
            />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">
              Admin Panel
            </Text>
            <Text className="text-sm text-muted">{user?.email ?? ""}</Text>
          </View>
          <View className="bg-error/20 px-3 py-1 rounded-full">
            <Text className="text-xs font-medium text-error">ADMIN</Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4 px-4"
        >
          <View className="flex-row gap-2">
            {[
              {
                id: "dashboard" as TabType,
                label: "Dashboard",
                icon: "chart.bar.fill",
              },
              {
                id: "vendors" as TabType,
                label: "Anbieter",
                icon: "building.2.fill",
              },
              {
                id: "requests" as TabType,
                label: "Anfragen",
                icon: "envelope.fill",
              },
              {
                id: "contests" as TabType,
                label: "Gewinnspiele",
                icon: "trophy.fill",
              },
              {
                id: "ads" as TabType,
                label: "Werbung",
                icon: "megaphone.fill",
              },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                className={`flex-row items-center gap-1 px-3 py-2 rounded-full ${
                  activeTab === tab.id ? "bg-primary" : "bg-surface"
                }`}
                onPress={() => setActiveTab(tab.id)}
              >
                <IconSymbol
                  name={tab.icon as any}
                  size={16}
                  color={activeTab === tab.id ? "#fff" : colors.muted}
                />
                <Text
                  className={`text-sm font-medium ${activeTab === tab.id ? "text-white" : "text-muted"}`}
                >
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
      >
        {activeTab === "dashboard" && (
          <>
            {/* Stats Grid */}
            <Text className="text-lg font-semibold text-foreground mb-3">
              Übersicht
            </Text>
            <View className="flex-row gap-3 mb-3">
              {renderStatCard(
                "Nutzer",
                (stats?.totalUsers ?? 0).toLocaleString(),
                "person.2.fill",
                colors.primary,
              )}
              {renderStatCard(
                "Aktiv (30 T.)",
                (stats?.activeUsers ?? 0).toLocaleString(),
                "person.fill",
                colors.success,
              )}
            </View>
            <View className="flex-row gap-3 mb-3">
              {renderStatCard(
                "Premium",
                stats?.premiumUsers ?? 0,
                "star.fill",
                colors.primary,
              )}
              {renderStatCard(
                "Pro",
                stats?.proUsers ?? 0,
                "crown.fill",
                colors.warning,
              )}
            </View>
            <View className="flex-row gap-3 mb-3">
              {renderStatCard(
                "Diagnosen",
                (stats?.totalDiagnoses ?? 0).toLocaleString(),
                "viewfinder",
                colors.success,
              )}
              {renderStatCard(
                "Posts",
                (stats?.totalPosts ?? 0).toLocaleString(),
                "bubble.left.fill",
                colors.primary,
              )}
            </View>

            {/* Revenue */}
            <View className="bg-success/10 rounded-xl p-4 border border-success/30 mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <IconSymbol
                  name="dollarsign.circle.fill"
                  size={24}
                  color={colors.success}
                />
                <Text className="text-base font-semibold text-foreground">
                  Werbeeinnahmen
                </Text>
              </View>
              <Text className="text-3xl font-bold text-success">
                €
                {(stats?.adRevenue ?? 0).toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            {/* Quick Actions */}
            <Text className="text-lg font-semibold text-foreground mb-3">
              Schnellaktionen
            </Text>
            <View className="gap-2 mb-4">
              <TouchableOpacity
                className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3"
                onPress={() => {
                  setActiveTab("contests");
                  setShowGiveawayForm(true);
                }}
              >
                <IconSymbol
                  name="trophy.fill"
                  size={20}
                  color={colors.warning}
                />
                <Text className="text-base text-foreground flex-1">
                  Neues Gewinnspiel erstellen
                </Text>
                <IconSymbol
                  name="chevron.right"
                  size={18}
                  color={colors.muted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3"
                onPress={handleExportReport}
              >
                <IconSymbol
                  name="doc.text.fill"
                  size={20}
                  color={colors.success}
                />
                <Text className="text-base text-foreground flex-1">
                  Bericht exportieren
                </Text>
                <IconSymbol
                  name="chevron.right"
                  size={18}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>

            {/* Push Broadcast */}
            <View className="bg-surface rounded-xl p-4 border border-border mt-4 gap-3">
              <Text className="text-base font-semibold text-foreground">
                Push-Nachricht an alle
              </Text>
              <Text className="text-xs text-muted">
                Registrierte Geräte: {pushCountQuery.data?.count ?? "…"}
              </Text>
              <TextInput
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                placeholder="Titel"
                placeholderTextColor={colors.muted}
                maxLength={100}
                value={pushTitle}
                onChangeText={setPushTitle}
              />
              <TextInput
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground min-h-[70px]"
                placeholder="Nachricht"
                placeholderTextColor={colors.muted}
                multiline
                maxLength={500}
                value={pushBody}
                onChangeText={setPushBody}
                style={{ textAlignVertical: "top" }}
              />
              <TouchableOpacity
                className="bg-primary py-3 rounded-lg"
                onPress={handleBroadcast}
                disabled={broadcastPush.isPending}
              >
                <Text className="text-white text-center font-semibold">
                  {broadcastPush.isPending ? "Sende..." : "Senden"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === "vendors" && (
          <>
            {/* Invite Vendor */}
            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <Text className="text-base font-semibold text-foreground mb-3">
                Anbieter einladen
              </Text>
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
                <Text className="text-center text-base font-semibold text-white">
                  Einladung senden
                </Text>
              </TouchableOpacity>
            </View>

            {/* Vendor List */}
            <Text className="text-lg font-semibold text-foreground mb-3">
              Anbieter
            </Text>
            {vendorsQuery.isLoading && loadingView}
            {!vendorsQuery.isLoading && vendors.length === 0 && (
              <Text className="text-base text-muted text-center py-6">
                Noch keine Anbieter vorhanden
              </Text>
            )}
            {vendors.map((vendor) => (
              <View
                key={vendor.id}
                className="bg-surface rounded-xl p-4 border border-border mb-3"
              >
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center">
                    <Text className="text-2xl">
                      {vendor.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold text-foreground">
                        {vendor.name}
                      </Text>
                      {vendor.isVerified && (
                        <IconSymbol
                          name="checkmark.seal.fill"
                          size={16}
                          color={colors.primary}
                        />
                      )}
                    </View>
                    <Text className="text-sm text-muted">
                      {vendor.totalProducts ?? 0} Produkte •{" "}
                      {BUSINESS_LABELS[vendor.type] ?? vendor.type}
                    </Text>
                  </View>
                  {vendor.rating != null && (
                    <View className="flex-row items-center gap-1">
                      <IconSymbol
                        name="star.fill"
                        size={14}
                        color={colors.warning}
                      />
                      <Text className="text-sm font-medium text-foreground">
                        {vendor.rating}
                      </Text>
                    </View>
                  )}
                </View>
                {!!vendor.description && (
                  <Text className="text-sm text-muted">
                    {vendor.description}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        {activeTab === "requests" && (
          <>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-foreground">
                Anbieter-Anfragen
              </Text>
              <View className="bg-warning/20 px-2 py-1 rounded-full">
                <Text className="text-xs font-medium text-warning">
                  {requests.filter((r) => isPending(r.status)).length}{" "}
                  ausstehend
                </Text>
              </View>
            </View>

            {inquiriesQuery.isLoading && loadingView}
            {requests.map(renderVendorRequest)}

            {!inquiriesQuery.isLoading && requests.length === 0 && (
              <View className="items-center py-8">
                <IconSymbol
                  name="envelope.fill"
                  size={48}
                  color={colors.muted}
                />
                <Text className="text-base text-muted mt-4">
                  Keine Anfragen vorhanden
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === "contests" && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">
              Gewinnspiel-Verwaltung
            </Text>

            <TouchableOpacity
              className="bg-primary rounded-xl p-4 mb-4 flex-row items-center gap-3"
              onPress={() => setShowGiveawayForm((v) => !v)}
            >
              <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
              <Text className="text-base font-semibold text-white">
                Neues Gewinnspiel erstellen
              </Text>
            </TouchableOpacity>

            {showGiveawayForm && (
              <View className="bg-surface rounded-xl p-4 border border-border mb-4 gap-3">
                <TextInput
                  className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
                  placeholder="Titel"
                  placeholderTextColor={colors.muted}
                  value={gwTitle}
                  onChangeText={setGwTitle}
                />
                <TextInput
                  className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
                  placeholder="Preis"
                  placeholderTextColor={colors.muted}
                  value={gwPrize}
                  onChangeText={setGwPrize}
                />
                <TextInput
                  className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
                  placeholder="Laufzeit in Tagen"
                  placeholderTextColor={colors.muted}
                  value={gwDays}
                  onChangeText={setGwDays}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  className="bg-primary py-3 rounded-lg"
                  onPress={handleCreateGiveaway}
                  disabled={createGiveaway.isPending}
                >
                  <Text className="text-center text-base font-semibold text-white">
                    {createGiveaway.isPending ? "Speichern…" : "Erstellen"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {giveawaysQuery.isLoading && loadingView}
            {!giveawaysQuery.isLoading && giveawayList.length === 0 && (
              <Text className="text-base text-muted text-center py-6">
                Keine Gewinnspiele vorhanden
              </Text>
            )}
            {giveawayList.map((g) => {
              const isActive = g.status === "active";
              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (new Date(g.endsAt).getTime() - Date.now()) / 86400000,
                ),
              );
              return (
                <View
                  key={g.id}
                  className="bg-surface rounded-xl p-4 border border-border mb-3"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-base font-semibold text-foreground flex-1 mr-2">
                      {g.title}
                    </Text>
                    <View
                      className={`px-2 py-1 rounded-full ${isActive ? "bg-success/20" : "bg-muted/20"}`}
                    >
                      <Text
                        className={`text-xs font-medium ${isActive ? "text-success" : "text-muted"}`}
                      >
                        {g.status === "active"
                          ? "Aktiv"
                          : g.status === "ended"
                            ? "Beendet"
                            : g.status === "cancelled"
                              ? "Abgebrochen"
                              : "Geplant"}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm text-muted mb-2">
                    {g.totalEntries ?? 0} Teilnehmer • Preis: {g.prize}
                    {isActive ? ` • Endet in ${daysLeft} Tagen` : ""}
                  </Text>
                  {isActive && (
                    <TouchableOpacity
                      className="bg-error/20 py-2 rounded-lg"
                      onPress={() =>
                        Alert.alert(
                          "Gewinnspiel beenden",
                          `„${g.title}" wirklich beenden?`,
                          [
                            { text: "Abbrechen", style: "cancel" },
                            {
                              text: "Beenden",
                              style: "destructive",
                              onPress: () => endGiveaway.mutate({ id: g.id }),
                            },
                          ],
                        )
                      }
                    >
                      <Text className="text-center text-sm font-medium text-error">
                        Beenden
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}

        {activeTab === "ads" && (
          <>
            <Text className="text-lg font-semibold text-foreground mb-3">
              Werbeverwaltung
            </Text>

            {/* Ad Stats */}
            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <Text className="text-base font-semibold text-foreground mb-3">
                Aktive Kampagnen
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1 bg-background rounded-lg p-3">
                  <Text className="text-2xl font-bold text-primary">
                    {stats?.activeAds ?? 0}
                  </Text>
                  <Text className="text-xs text-muted">Aktive Ads</Text>
                </View>
                <View className="flex-1 bg-background rounded-lg p-3">
                  <Text className="text-2xl font-bold text-success">
                    {(stats?.adImpressions ?? 0).toLocaleString("de-DE")}
                  </Text>
                  <Text className="text-xs text-muted">Impressionen</Text>
                </View>
                <View className="flex-1 bg-background rounded-lg p-3">
                  <Text className="text-2xl font-bold text-warning">
                    €{(stats?.adRevenue ?? 0).toFixed(2)}
                  </Text>
                  <Text className="text-xs text-muted">Einnahmen</Text>
                </View>
              </View>
            </View>

            {/* Ad Pricing */}
            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <Text className="text-base font-semibold text-foreground mb-3">
                Preisliste
              </Text>
              <View className="gap-2">
                <View className="flex-row items-center justify-between py-2 border-b border-border">
                  <Text className="text-sm text-foreground">
                    Home Banner (klein)
                  </Text>
                  <Text className="text-sm font-semibold text-primary">
                    €50/Woche
                  </Text>
                </View>
                <View className="flex-row items-center justify-between py-2 border-b border-border">
                  <Text className="text-sm text-foreground">
                    Community Banner
                  </Text>
                  <Text className="text-sm font-semibold text-primary">
                    €75/Woche
                  </Text>
                </View>
                <View className="flex-row items-center justify-between py-2">
                  <Text className="text-sm text-foreground">
                    Marktplatz Feature
                  </Text>
                  <Text className="text-sm font-semibold text-primary">
                    €100/Woche
                  </Text>
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
