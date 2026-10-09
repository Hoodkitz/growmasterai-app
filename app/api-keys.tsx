import { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Alert, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used?: string;
  permissions: string[];
  is_active: boolean;
}

const API_KEYS_KEY = "grow_api_keys";

export default function ApiKeysScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPerms, setNewKeyPerms] = useState<string[]>(["read"]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const raw = await AsyncStorage.getItem(API_KEYS_KEY);
      if (raw) {
        setKeys(JSON.parse(raw));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      key: `gm_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`,
      created_at: new Date().toISOString(),
      permissions: newKeyPerms,
      is_active: true,
    };
    const next = [...keys, newKey];
    setKeys(next);
    await AsyncStorage.setItem(API_KEYS_KEY, JSON.stringify(next));
    setCreatedKey(newKey.key);
    setNewKeyName("");
    setNewKeyPerms(["read"]);
    setShowCreate(false);
  };

  const revokeKey = async (id: string) => {
    const next = keys.map((k) => (k.id === id ? { ...k, is_active: false } : k));
    setKeys(next);
    await AsyncStorage.setItem(API_KEYS_KEY, JSON.stringify(next));
  };

  const togglePerm = (perm: string) => {
    setNewKeyPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.foreground }}>Lade API-Keys...</Text>
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
          API-Keys
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
        <Text style={{ color: "#fff", fontWeight: "600" }}>+ Neuer API-Key</Text>
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
            Neuen API-Key erstellen
          </Text>
          <TextInput
            placeholder="Name (z.B. Produktion)"
            placeholderTextColor={colors.muted}
            value={newKeyName}
            onChangeText={setNewKeyName}
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
            Berechtigungen:
          </Text>
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            {["read", "write", "export"].map((perm) => (
              <TouchableOpacity
                key={perm}
                onPress={() => togglePerm(perm)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  marginRight: 8,
                  backgroundColor: newKeyPerms.includes(perm)
                    ? colors.primary
                    : colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: newKeyPerms.includes(perm) ? "#fff" : colors.foreground,
                    fontSize: 13,
                  }}
                >
                  {perm}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={createKey}
            style={{
              backgroundColor: colors.success,
              padding: 10,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Erstellen</Text>
          </TouchableOpacity>
        </View>
      )}

      {createdKey && (
        <View
          style={{
            backgroundColor: "#fef3c7",
            padding: 12,
            borderRadius: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#f59e0b",
          }}
        >
          <Text style={{ fontWeight: "600", marginBottom: 4, color: "#92400e" }}>
            API-Key erstellt (einmalig angezeigt):
          </Text>
          <Text style={{ color: "#92400e", fontSize: 12 }} selectable>
            {createdKey}
          </Text>
        </View>
      )}

      {keys.length === 0 ? (
        <Text style={{ color: colors.muted, textAlign: "center", marginTop: 32 }}>
          Noch keine API-Keys vorhanden.
        </Text>
      ) : (
        keys.map((key) => (
          <View
            key={key.id}
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
                {key.name}
              </Text>
              <View
                style={{
                  backgroundColor: key.is_active ? "#dcfce7" : "#fee2e2",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    color: key.is_active ? "#166534" : "#991b1b",
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  {key.is_active ? "Aktiv" : "Inaktiv"}
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
              Erstellt: {new Date(key.created_at).toLocaleDateString("de-DE")}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Berechtigungen: {key.permissions.join(", ")}
            </Text>
            {key.is_active && (
              <TouchableOpacity
                onPress={() => revokeKey(key.id)}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: "#dc2626", fontSize: 13 }}>Widerrufen</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}
