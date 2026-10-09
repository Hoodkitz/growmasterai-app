import { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_triggered?: string;
  trigger_count: number;
}

const WEBHOOKS_KEY = "grow_webhooks";

const AVAILABLE_EVENTS = [
  "plant.created",
  "plant.updated",
  "plant.harvested",
  "diagnosis.completed",
  "expense.added",
  "export.completed",
  "backup.created",
];

export default function WebhooksScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const raw = await AsyncStorage.getItem(WEBHOOKS_KEY);
      if (raw) {
        setWebhooks(JSON.parse(raw));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    const newHook: Webhook = {
      id: `wh_${Date.now()}`,
      name: newName,
      url: newUrl,
      events: newEvents,
      is_active: true,
      created_at: new Date().toISOString(),
      trigger_count: 0,
    };
    const next = [...webhooks, newHook];
    setWebhooks(next);
    await AsyncStorage.setItem(WEBHOOKS_KEY, JSON.stringify(next));
    setNewName("");
    setNewUrl("");
    setNewEvents([]);
    setShowCreate(false);
  };

  const toggleWebhook = async (id: string) => {
    const next = webhooks.map((w) =>
      w.id === id ? { ...w, is_active: !w.is_active } : w
    );
    setWebhooks(next);
    await AsyncStorage.setItem(WEBHOOKS_KEY, JSON.stringify(next));
  };

  const deleteWebhook = async (id: string) => {
    const next = webhooks.filter((w) => w.id !== id);
    setWebhooks(next);
    await AsyncStorage.setItem(WEBHOOKS_KEY, JSON.stringify(next));
  };

  const testWebhook = async (id: string) => {
    const next = webhooks.map((w) =>
      w.id === id
        ? {
            ...w,
            last_triggered: new Date().toISOString(),
            trigger_count: w.trigger_count + 1,
          }
        : w
    );
    setWebhooks(next);
    await AsyncStorage.setItem(WEBHOOKS_KEY, JSON.stringify(next));
    Alert.alert("Test gesendet", "Test-Event wurde an den Webhook gesendet.");
  };

  const toggleEvent = (event: string) => {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.foreground }}>Lade Webhooks...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <IconSymbol name="chevron-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>
          Webhooks
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => setShowCreate(true)}
        style={{
          backgroundColor: colors.primary,
          padding: 12,
          borderRadius: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>+ Neuer Webhook</Text>
      </TouchableOpacity>

      {showCreate && (
        <View
          style={{
            backgroundColor: colors.surface,
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontWeight: "600", marginBottom: 8, color: colors.foreground }}>
            Neuen Webhook registrieren
          </Text>
          <TextInput
            placeholder="Name (z.B. Slack-Benachrichtigung)"
            placeholderTextColor={colors.muted}
            value={newName}
            onChangeText={setNewName}
            style={{
              backgroundColor: colors.background,
              padding: 10,
              borderRadius: 8,
              marginBottom: 8,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
          <TextInput
            placeholder="Webhook-URL"
            placeholderTextColor={colors.muted}
            value={newUrl}
            onChangeText={setNewUrl}
            autoCapitalize="none"
            style={{
              backgroundColor: colors.background,
              padding: 10,
              borderRadius: 8,
              marginBottom: 12,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
          <Text style={{ fontSize: 13, marginBottom: 6, color: colors.muted }}>
            Events:
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
            {AVAILABLE_EVENTS.map((event) => (
              <TouchableOpacity
                key={event}
                onPress={() => toggleEvent(event)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  marginRight: 6,
                  marginBottom: 6,
                  backgroundColor: newEvents.includes(event)
                    ? colors.primary
                    : colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: newEvents.includes(event) ? "#fff" : colors.foreground,
                    fontSize: 12,
                  }}
                >
                  {event}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={createWebhook}
            style={{
              backgroundColor: colors.success,
              padding: 10,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Registrieren</Text>
          </TouchableOpacity>
        </View>
      )}

      {webhooks.length === 0 ? (
        <Text style={{ color: colors.muted, textAlign: "center", marginTop: 32 }}>
          Noch keine Webhooks registriert.
        </Text>
      ) : (
        webhooks.map((wh) => (
          <View
            key={wh.id}
            style={{
              backgroundColor: colors.surface,
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontWeight: "600", color: colors.foreground }}>
                {wh.name}
              </Text>
              <View
                style={{
                  backgroundColor: wh.is_active ? "#dcfce7" : "#f3f4f6",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    color: wh.is_active ? "#166534" : "#6b7280",
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  {wh.is_active ? "Aktiv" : "Inaktiv"}
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
              {wh.url}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Events: {wh.events.join(", ")}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
              {wh.trigger_count} ausgelöst
              {wh.last_triggered &&
                ` · Zuletzt: ${new Date(wh.last_triggered).toLocaleString("de-DE")}`}
            </Text>
            <View style={{ flexDirection: "row", marginTop: 8, gap: 12 }}>
              <TouchableOpacity onPress={() => testWebhook(wh.id)}>
                <Text style={{ color: colors.primary, fontSize: 13 }}>Test</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleWebhook(wh.id)}>
                <Text style={{ color: "#d97706", fontSize: 13 }}>Toggle</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteWebhook(wh.id)}>
                <Text style={{ color: "#dc2626", fontSize: 13 }}>Löschen</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
