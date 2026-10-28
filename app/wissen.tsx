import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { formatTimestamp, tipVideoUrl } from "@/lib/phase-tips";
import {
  filterKnowledge,
  loadCachedKnowledge,
  saveCachedKnowledge,
  type WissenEntry,
} from "@/lib/knowledge-offline";

const PHASES = [
  { id: "", label: "Alle" },
  { id: "germination", label: "Keimung" },
  { id: "seedling", label: "Keimling" },
  { id: "vegetative", label: "Wachstum" },
  { id: "flowering", label: "Blüte" },
  { id: "harvest", label: "Ernte" },
];

export default function WissenScreen() {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState("");
  const [cached, setCached] = useState<WissenEntry[]>([]);
  const remote = trpc.knowledge.all.useQuery(undefined, {
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    loadCachedKnowledge().then(setCached);
  }, []);

  useEffect(() => {
    if (remote.data && remote.data.length > 0) {
      saveCachedKnowledge(remote.data as WissenEntry[]);
    }
  }, [remote.data]);

  const entries = (remote.data as WissenEntry[] | undefined) ?? cached;
  const offline = !remote.data && cached.length > 0;
  const results = useMemo(
    () => filterKnowledge(entries, query, phase || undefined),
    [entries, query, phase],
  );

  return (
    <ScreenContainer className="p-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Wissen</Text>
      <Text className="text-xs text-muted mb-3">
        {entries.length} geprüfte Aussagen aus Anbau-Videos
        {offline ? " (offline gespeichert)" : ""}
      </Text>
      <TextInput
        className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-3"
        placeholder="Suchen, z. B. Thripse, pH, Kokos"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />
      <View className="flex-row flex-wrap gap-2 mb-3">
        {PHASES.map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => setPhase(p.id)}
            className={`px-3 py-1.5 rounded-full border ${
              phase === p.id
                ? "bg-primary border-primary"
                : "bg-surface border-border"
            }`}
          >
            <Text
              className={`text-sm ${
                phase === p.id ? "text-white" : "text-foreground"
              }`}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {entries.length === 0 ? (
        <Text className="text-sm text-muted">
          {remote.isLoading
            ? "Lade Wissensdatenbank…"
            : "Keine Verbindung und noch nichts gespeichert. Öffne diese Seite einmal mit Internet."}
        </Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(e) => e.id}
          initialNumToRender={15}
          ListEmptyComponent={
            <Text className="text-sm text-muted">Nichts gefunden.</Text>
          }
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <View className="bg-surface rounded-xl p-3 border border-border gap-1">
              <Text className="text-sm font-semibold text-foreground">
                {item.topic}
              </Text>
              <Text className="text-sm text-foreground">{item.text}</Text>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(tipVideoUrl(item)).catch(() => {})
                }
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: colors.primary }}
                >
                  ▶ {item.channel}, ab {formatTimestamp(item.start)}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            <Text className="text-xs text-muted mt-3">
              Zusammenfassung der genannten Videos, ohne Gewähr. Beachte die
              Rechtslage in deinem Land.
            </Text>
          }
        />
      )}
    </ScreenContainer>
  );
}
