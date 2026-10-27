import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PlantQrCode } from "@/components/plant-qr-code";
import { PhaseTipsList } from "@/components/phase-tips-list";
import { tipsForPhase } from "@/lib/phase-tips";
import { useColors } from "@/hooks/use-colors";
import {
  CareEntry,
  daysSince,
  plantLabelHtml,
  plantPath,
} from "@/lib/plant-qr";

interface StoredPlant {
  id: string;
  name: string;
  strain?: string;
  phase: "seedling" | "vegetative" | "flowering" | "harvest";
  startDate: string;
  notes?: string;
  growType?: "indoor" | "outdoor" | "greenhouse";
}

const PHASE_LABEL: Record<StoredPlant["phase"], string> = {
  seedling: "Keimling",
  vegetative: "Vegetativ",
  flowering: "Blüte",
  harvest: "Ernte",
};

const careKey = (id: string) => `plant_care_log_${id}`;

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : `${d.toLocaleDateString("de-DE")} ${d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
};

export default function PlantCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const [plant, setPlant] = useState<StoredPlant | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [log, setLog] = useState<CareEntry[]>([]);
  const [note, setNote] = useState("");

  // Host form (growmasterai://plant/<id>) matches the Android intent filter, which needs a host.
  const link = `growmasterai://${plantPath(String(id))}`;

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem("plants");
      const all: StoredPlant[] = raw ? JSON.parse(raw) : [];
      setPlant(all.find((p) => p.id === id) ?? null);
      const rawLog = await AsyncStorage.getItem(careKey(String(id)));
      setLog(rawLog ? JSON.parse(rawLog) : []);
    } catch {
      setPlant(null);
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const addCare = async (kind: CareEntry["kind"]) => {
    const entry: CareEntry = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      kind,
      note: note.trim() || undefined,
    };
    const next = [entry, ...log].slice(0, 200);
    setLog(next);
    setNote("");
    await AsyncStorage.setItem(careKey(String(id)), JSON.stringify(next));
  };

  const removeCare = async (entryId: string) => {
    const next = log.filter((e) => e.id !== entryId);
    setLog(next);
    await AsyncStorage.setItem(careKey(String(id)), JSON.stringify(next));
  };

  const printLabel = async () => {
    if (!plant) return;
    try {
      await Print.printAsync({
        html: plantLabelHtml({
          name: plant.name,
          strain: plant.strain,
          link,
          startDate: plant.startDate,
        }),
      });
    } catch {
      Alert.alert("Fehler", "Das Etikett konnte nicht gedruckt werden.");
    }
  };

  const shareLink = async () => {
    if (!plant) return;
    try {
      await Share.share({ message: `${plant.name}: ${link}` });
    } catch {
      // user cancelled
    }
  };

  const lastOf = (kind: CareEntry["kind"]) => log.find((e) => e.kind === kind);

  if (!loaded) return <ScreenContainer className="p-4" />;

  if (!plant) {
    return (
      <ScreenContainer className="p-4 items-center justify-center gap-4">
        <Text className="text-lg font-semibold text-foreground">
          Pflanze nicht gefunden
        </Text>
        <Text className="text-sm text-muted text-center">
          Dieses Etikett gehört zu einer Pflanze, die auf diesem Gerät bzw. in
          diesem Konto nicht vorhanden ist.
        </Text>
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-xl"
          onPress={() => router.replace("/(tabs)/plants")}
        >
          <Text className="font-semibold text-background">
            Zu meinen Pflanzen
          </Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const start = new Date(plant.startDate);
  const days = daysSince(plant.startDate);
  const lastWater = lastOf("water");
  const lastFeed = lastOf("feed");

  return (
    <ScreenContainer>
      <View className="flex-row items-center px-4 pt-2 pb-2">
        <TouchableOpacity
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/plants")
          }
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-foreground">
          Pflanzenkarte
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}
      >
        <View className="bg-surface rounded-2xl p-4 border border-border gap-2">
          <Text className="text-2xl font-bold text-foreground">
            {plant.name}
          </Text>
          {plant.strain ? (
            <Text className="text-base text-muted">{plant.strain}</Text>
          ) : null}
          <View className="gap-1 mt-2">
            <Row
              label="Eingepflanzt"
              value={
                Number.isNaN(start.getTime())
                  ? "-"
                  : start.toLocaleDateString("de-DE")
              }
            />
            <Row
              label="Alter"
              value={`Tag ${days} (${Math.floor(days / 7)} Wochen)`}
            />
            <Row label="Phase" value={PHASE_LABEL[plant.phase]} />
            {plant.growType ? (
              <Row label="Anbau" value={plant.growType} />
            ) : null}
            <Row
              label="Zuletzt gegossen"
              value={
                lastWater ? formatDateTime(lastWater.date) : "noch nie erfasst"
              }
            />
            <Row
              label="Zuletzt gedüngt"
              value={
                lastFeed ? formatDateTime(lastFeed.date) : "noch nie erfasst"
              }
            />
          </View>
          {plant.notes ? (
            <Text className="text-sm text-muted mt-2">{plant.notes}</Text>
          ) : null}
        </View>

        <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
          <Text className="text-lg font-semibold text-foreground">
            Gießen &amp; Düngen
          </Text>
          <TextInput
            className="bg-background rounded-xl p-3 text-foreground border border-border"
            placeholder="Notiz, z.B. 1,5 l, EC 1,2 / Bio-Bloom 2 ml/l"
            placeholderTextColor={colors.muted}
            value={note}
            onChangeText={setNote}
          />
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-primary rounded-xl p-3 items-center"
              onPress={() => addCare("water")}
            >
              <Text className="font-semibold text-background">💧 Gegossen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-primary rounded-xl p-3 items-center"
              onPress={() => addCare("feed")}
            >
              <Text className="font-semibold text-background">🧪 Gedüngt</Text>
            </TouchableOpacity>
          </View>
          {log.length === 0 ? (
            <Text className="text-sm text-muted">Noch keine Einträge.</Text>
          ) : (
            log.slice(0, 15).map((e) => (
              <View
                key={e.id}
                className="flex-row items-center justify-between border-t border-border pt-2"
              >
                <View className="flex-1">
                  <Text className="text-sm text-foreground">
                    {e.kind === "water" ? "💧 Gegossen" : "🧪 Gedüngt"} ·{" "}
                    {formatDateTime(e.date)}
                  </Text>
                  {e.note ? (
                    <Text className="text-xs text-muted">{e.note}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  className="p-2"
                  onPress={() => removeCare(e.id)}
                >
                  <IconSymbol
                    name="xmark.circle.fill"
                    size={20}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
          <Text className="text-lg font-semibold text-foreground">
            💡 Tipps für die Phase „{PHASE_LABEL[plant.phase]}“
          </Text>
          <PhaseTipsList tips={tipsForPhase(plant.phase)} />
        </View>

        <View className="bg-surface rounded-2xl p-4 border border-border items-center gap-3">
          <Text className="text-lg font-semibold text-foreground">
            QR-Etikett
          </Text>
          <PlantQrCode value={link} size={220} />
          <Text className="text-xs text-muted text-center">
            Der Code öffnet diese Pflanzenkarte in deiner GrowMaster-App. Auf
            fremden Geräten ist damit nichts einsehbar.
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="bg-primary rounded-xl px-5 py-3"
              onPress={printLabel}
            >
              <Text className="font-semibold text-background">
                Drucken / PDF
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-background border border-border rounded-xl px-5 py-3"
              onPress={shareLink}
            >
              <Text className="font-semibold text-foreground">Link teilen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm text-foreground">{value}</Text>
    </View>
  );
}
