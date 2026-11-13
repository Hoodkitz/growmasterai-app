import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { STAGE_LABEL, type Stage } from "@/shared/smartgrow/types";

type Adj = {
  tempOffset?: number;
  rhOffset?: number;
  lightLevelOffset?: number;
  ecTarget?: { min: number; max: number } | null;
  co2Target?: number | null;
};
type Summary = {
  text: string;
  tips: string[];
  at: number;
  pending?: { adjustments: Adj; reason: string } | null;
  stageSuggestion?: { stage: Stage; reason: string } | null;
} | null;

const describe = (a: Adj) =>
  [
    a.tempOffset
      ? `Temperatur ${a.tempOffset > 0 ? "+" : ""}${a.tempOffset} °C`
      : null,
    a.rhOffset
      ? `Luftfeuchte ${a.rhOffset > 0 ? "+" : ""}${a.rhOffset} %`
      : null,
    a.lightLevelOffset
      ? `Licht ${a.lightLevelOffset > 0 ? "+" : ""}${a.lightLevelOffset} %`
      : null,
    a.ecTarget ? `EC ${a.ecTarget.min}–${a.ecTarget.max}` : null,
    typeof a.co2Target === "number" ? `CO₂ ${a.co2Target} ppm` : null,
  ]
    .filter(Boolean)
    .join(", ") || "keine";

/** KI-Einschätzung: Lage, Tipps, vorgeschlagene Zielwert-Anpassung, Phasen-Hinweis. */
export function AiCard({
  tentId,
  summary,
  adjustments,
  aiEnabled,
  onChanged,
}: {
  tentId: number;
  summary: Summary;
  adjustments: Adj;
  aiEnabled: boolean;
  onChanged: () => void;
}) {
  const review = trpc.smartGrow.aiReview.useMutation();
  const decide = trpc.smartGrow.aiDecide.useMutation();
  const reset = trpc.smartGrow.resetAdjustments.useMutation();
  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      onChanged();
    } catch (e) {
      Alert.alert("Nicht möglich", (e as Error).message);
    }
  };
  const hasAdj = Object.keys(adjustments ?? {}).length > 0;
  return (
    <View
      className="bg-surface rounded-2xl p-4 border border-border gap-2"
      testID="ai-card"
    >
      <Text className="text-base font-bold text-foreground">
        🤖 KI-Einschätzung
      </Text>
      {summary ? (
        <>
          <Text className="text-xs text-muted">
            {new Date(summary.at).toLocaleString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <Text className="text-sm text-foreground">{summary.text}</Text>
          {summary.tips.map((tip, i) => (
            <Text key={i} className="text-sm text-foreground">
              • {tip}
            </Text>
          ))}
          {summary.pending ? (
            <View className="gap-2 mt-1">
              <Text className="text-sm text-foreground">
                <Text className="font-bold">Vorschlag: </Text>
                {describe(summary.pending.adjustments)} –{" "}
                {summary.pending.reason}
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-primary rounded-xl p-3 items-center"
                  onPress={() =>
                    run(() => decide.mutateAsync({ id: tentId, apply: true }))
                  }
                >
                  <Text className="text-white font-bold">Übernehmen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 rounded-xl p-3 items-center border border-border"
                  onPress={() =>
                    run(() => decide.mutateAsync({ id: tentId, apply: false }))
                  }
                >
                  <Text className="text-foreground">Verwerfen</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
          {summary.stageSuggestion ? (
            <Text className="text-sm text-foreground">
              🔁 Phasen-Hinweis: {STAGE_LABEL[summary.stageSuggestion.stage]}?{" "}
              {summary.stageSuggestion.reason} (unter „Phase & Einstellungen“
              ändern)
            </Text>
          ) : null}
        </>
      ) : (
        <Text className="text-sm text-muted">
          Die KI schaut sich alle 6 Stunden den Verlauf an und passt die
          Zielwerte vorsichtig an.
        </Text>
      )}
      {hasAdj ? (
        <Text className="text-xs text-muted">
          Aktive KI-Anpassung: {describe(adjustments)}
        </Text>
      ) : null}
      <View className="flex-row gap-2 mt-1">
        {aiEnabled ? (
          <TouchableOpacity
            className="flex-1 rounded-xl p-3 items-center border border-border"
            disabled={review.isPending}
            onPress={() => run(() => review.mutateAsync({ id: tentId }))}
          >
            {review.isPending ? (
              <ActivityIndicator />
            ) : (
              <Text className="text-foreground">Jetzt einschätzen</Text>
            )}
          </TouchableOpacity>
        ) : null}
        {hasAdj ? (
          <TouchableOpacity
            className="flex-1 rounded-xl p-3 items-center border border-border"
            onPress={() => run(() => reset.mutateAsync({ id: tentId }))}
          >
            <Text className="text-foreground">Auf Richtwerte zurück</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

type Observation = {
  stage?: Stage | null;
  stageConfidence?: number;
  flowerWeek?: number | null;
  heightCm?: number | null;
  canopy?: "sparse" | "medium" | "dense" | null;
  colors?: string[];
  purple?: boolean;
  buds?: string | null;
  trainingTip?: string | null;
};
type Leaf = {
  healthy: boolean;
  severity: "none" | "low" | "medium" | "high";
  summary: string;
  issues: string[];
  actions: string[];
  observation?: Observation;
} | null;
const CANOPY: Record<string, string> = {
  sparse: "licht",
  medium: "mittel",
  dense: "dicht",
};

/** Kamera-Beobachtung: letztes Bild, Blattbefund, Phase/Größe/Farben und Verlauf; eigenes Foto prüfen lassen. */
export function LeafCard({
  tentId,
  last,
  onChanged,
}: {
  tentId: number;
  last: { id: number; at: number; analysis: unknown } | null;
  onChanged: () => void;
}) {
  const colors = useColors();
  const upload = trpc.smartGrow.uploadSnapshot.useMutation();
  const img = trpc.smartGrow.snapshotImage.useQuery(
    { id: last?.id ?? 0 },
    { enabled: !!last },
  );
  const hist = trpc.smartGrow.observations.useQuery(
    { tentId },
    { enabled: !!last },
  );
  const [busy, setBusy] = useState(false);
  const a = (last?.analysis ?? null) as Leaf;
  const o = a?.observation ?? {};
  const color = !a
    ? colors.muted
    : a.severity === "high"
      ? colors.error
      : a.severity === "medium"
        ? colors.warning
        : colors.success;
  const fmt = (t: number) =>
    new Date(t).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const shoot = async (camera: boolean) => {
    try {
      const perm = camera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted)
        return Alert.alert(
          "Kein Zugriff",
          camera ? "Bitte Kamera erlauben." : "Bitte Fotos erlauben.",
        );
      const res = camera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });
      if (res.canceled || !res.assets[0]) return;
      setBusy(true);
      const small = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 1280 } }],
        {
          compress: 0.75,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      if (!small.base64) throw new Error("Bild konnte nicht gelesen werden");
      await upload.mutateAsync({ tentId, jpegBase64: small.base64 });
      onChanged();
    } catch (e) {
      Alert.alert("Nicht möglich", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const facts = [
    o.stage
      ? `Phase: ${STAGE_LABEL[o.stage]}${o.flowerWeek ? ` (ca. Blütewoche ${o.flowerWeek})` : ""}`
      : null,
    o.heightCm ? `Höhe: ca. ${Math.round(o.heightCm)} cm` : null,
    o.canopy ? `Blätterdach: ${CANOPY[o.canopy]}` : null,
    o.colors?.length
      ? `Farben: ${o.colors.join(", ")}${o.purple ? " 💜" : ""}`
      : null,
    o.buds ? `Blüten: ${o.buds}` : null,
  ].filter(Boolean) as string[];
  const history = (hist.data ?? [])
    .filter((h) => h.analysis && h.id !== last?.id)
    .slice(0, 6);

  return (
    <View
      className="bg-surface rounded-2xl p-4 border border-border gap-2"
      testID="leaf-card"
    >
      <Text className="text-base font-bold text-foreground">
        📷 Kamera-Beobachtung
      </Text>
      {img.data ? (
        <Image
          source={{ uri: img.data.dataUri }}
          style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 12 }}
          resizeMode="cover"
        />
      ) : null}
      {last ? <Text className="text-xs text-muted">{fmt(last.at)}</Text> : null}
      {a ? (
        <>
          <Text
            className="text-sm font-semibold"
            style={color ? { color } : undefined}
          >
            {a.healthy
              ? "✅ Sieht gesund aus"
              : a.severity === "high"
                ? "🚨 Ernster Befund"
                : "⚠️ Auffällig"}
          </Text>
          <Text className="text-sm text-foreground">{a.summary}</Text>
          {a.actions.map((x, i) => (
            <Text key={i} className="text-sm text-foreground">
              → {x}
            </Text>
          ))}
          {facts.length ? (
            <View className="gap-0.5 mt-1">
              {facts.map((f) => (
                <Text key={f} className="text-sm text-foreground">
                  • {f}
                </Text>
              ))}
            </View>
          ) : null}
          {o.trainingTip ? (
            <Text className="text-sm text-foreground">✂️ {o.trainingTip}</Text>
          ) : null}
        </>
      ) : (
        <Text className="text-sm text-muted">
          {last
            ? "Noch nicht ausgewertet."
            : "Eine Zelt-Kamera (ESP32-CAM oder Home Assistant) schickt regelmäßig Bilder – oder du prüfst ein Foto vom Handy. Die KI erkennt Blattprobleme, Phase, Größe und Farben."}
        </Text>
      )}
      {history.length ? (
        <View className="gap-1 mt-1">
          <Text className="text-xs font-semibold text-muted">Verlauf</Text>
          {history.map((h) => {
            const x = h.analysis as Leaf;
            const ob = x?.observation ?? {};
            return (
              <Text key={h.id} className="text-xs text-foreground">
                {fmt(h.at)} ·{" "}
                {x?.healthy
                  ? "gesund"
                  : x?.severity === "high"
                    ? "ernst"
                    : "auffällig"}
                {ob.heightCm ? ` · ${Math.round(ob.heightCm)} cm` : ""}
                {ob.stage ? ` · ${STAGE_LABEL[ob.stage]}` : ""}
                {ob.purple ? " · lila" : ""}
              </Text>
            );
          })}
        </View>
      ) : null}
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 bg-primary rounded-xl p-3 items-center"
          disabled={busy}
          onPress={() => shoot(true)}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold">Foto prüfen</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 rounded-xl p-3 items-center border border-border"
          disabled={busy}
          onPress={() => shoot(false)}
        >
          <Text className="text-foreground">Aus Galerie</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
