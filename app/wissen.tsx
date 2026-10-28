import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useSubscription } from "@/lib/subscription-context";
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

type Hit = Omit<
  WissenEntry,
  "videoId" | "videoTitle" | "channel" | "start" | "tags"
> &
  Partial<Pick<WissenEntry, "videoId" | "videoTitle" | "channel" | "start">> & {
    tags?: string[];
  };

export default function WissenScreen() {
  const colors = useColors();
  const router = useRouter();
  const { tier } = useSubscription();
  const paid = tier !== "free";
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [phase, setPhase] = useState("");
  const [cached, setCached] = useState<WissenEntry[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Paying users load everything once and search locally, so it works offline.
  const all = trpc.knowledge.all.useQuery(undefined, {
    enabled: paid,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
  // Free users get a server-side teaser per search.
  const teaser = trpc.knowledge.browse.useQuery(
    { query: debounced, phase: phase || undefined },
    { enabled: !paid, retry: 1 },
  );

  useEffect(() => {
    if (paid) loadCachedKnowledge().then(setCached);
  }, [paid]);

  useEffect(() => {
    if (paid && all.data && all.data.length > 0) {
      saveCachedKnowledge(all.data as WissenEntry[]);
    }
  }, [paid, all.data]);

  const entries = paid
    ? ((all.data as WissenEntry[] | undefined) ?? cached)
    : [];
  const offline = paid && !all.data && cached.length > 0;
  const results: Hit[] = useMemo(
    () =>
      paid
        ? filterKnowledge(entries, query, phase || undefined)
        : (teaser.data?.entries ?? []),
    [paid, entries, query, phase, teaser.data],
  );
  const total = paid ? entries.length : (teaser.data?.total ?? 0);
  const loading = paid
    ? all.isLoading && cached.length === 0
    : teaser.isLoading;
  const hiddenCount =
    !paid && teaser.data ? teaser.data.total - results.length : 0;

  return (
    <ScreenContainer className="p-4">
      <Text className="text-2xl font-bold text-foreground mb-1">Wissen</Text>
      <Text className="text-xs text-muted mb-3">
        {paid
          ? `${entries.length} geprüfte Aussagen aus Anbau-Videos${offline ? " (offline gespeichert)" : ""}`
          : "Geprüfte Aussagen aus Anbau-Videos. Gratis: 3 Treffer pro Suche."}
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
      {loading || (paid && entries.length === 0) ? (
        <Text className="text-sm text-muted">
          {loading
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
              {item.videoId && item.start !== undefined ? (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      tipVideoUrl({
                        videoId: item.videoId!,
                        start: item.start!,
                      }),
                    ).catch(() => {})
                  }
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: colors.primary }}
                  >
                    ▶ {item.channel}, ab {formatTimestamp(item.start)}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => router.push("/(tabs)/coach")}>
                <Text className="text-xs text-muted">
                  Frag den Coach für deine Pflanze →
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            <View className="mt-3 gap-2">
              {hiddenCount > 0 ? (
                <TouchableOpacity
                  className="bg-primary rounded-xl p-3 items-center"
                  onPress={() => router.push("/paywall")}
                >
                  <Text className="text-sm font-semibold text-white">
                    {hiddenCount} weitere Treffer mit Premium oder Pro
                  </Text>
                  <Text className="text-xs text-white/80">
                    Alle Treffer, Video-Links und Offline-Modus
                  </Text>
                </TouchableOpacity>
              ) : null}
              <Text className="text-xs text-muted">
                Zusammenfassung der genannten Videos, ohne Gewähr. Beachte die
                Rechtslage in deinem Land.
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
