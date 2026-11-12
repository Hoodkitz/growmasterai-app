import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/lib/auth-context";
import {
  MEDIA,
  MEDIUM_LABEL,
  MODE_LABEL,
  STAGES,
  STAGE_LABEL,
  type Medium,
  type Stage,
} from "@/shared/smartgrow/types";
import { Chips } from "@/components/smartgrow/chips";

const deviceTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin";
  } catch {
    return "Europe/Berlin";
  }
};

/** Smart Grow: Übersicht der Zelte + neues Zelt anlegen. */
export default function SmartGrowList() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAppAuth();
  const utils = trpc.useUtils();
  const list = trpc.smartGrow.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
  const create = trpc.smartGrow.create.useMutation();
  // beim Zurückkommen vom Dashboard frische Werte/Modus zeigen
  const refetchList = list.refetch;
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) refetchList();
    }, [isAuthenticated, refetchList]),
  );
  const [form, setForm] = useState(false);
  const [name, setName] = useState("Mein Zelt");
  const [stage, setStage] = useState<Stage>("veg");
  const [medium, setMedium] = useState<Medium>("soil");
  const [lightsOn, setLightsOn] = useState("06:00");
  const [liters, setLiters] = useState("20");
  const [sim, setSim] = useState(false);

  const submit = async (simulator: boolean) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(lightsOn))
      return Alert.alert("Licht an", "Bitte als HH:MM eingeben, z. B. 06:00");
    try {
      const r = await create.mutateAsync({
        name:
          simulator && name === "Mein Zelt"
            ? "Simulator-Zelt"
            : name.trim() || "Mein Zelt",
        simulator,
        settings: {
          stage,
          medium,
          lightsOn,
          rampMinutes: 30,
          reservoirLiters: Math.max(1, Number(liters.replace(",", ".")) || 20),
          purpleFinish: false,
          harvestDate: null,
          lightHoursOverride: null,
          timeZone: deviceTimeZone(),
        },
      });
      await utils.smartGrow.list.invalidate();
      setForm(false);
      router.push({
        pathname: "/smartgrow/[id]",
        params: { id: String(r.id) },
      });
    } catch (e) {
      Alert.alert("Nicht möglich", (e as Error).message);
    }
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-4 gap-4">
        <Header onClose={() => router.back()} />
        <Text className="text-base text-foreground">
          Melde dich an, um dein Zelt zu verbinden.
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-xl p-4 items-center"
          onPress={() => router.push("/login")}
        >
          <Text className="text-white font-bold">Anmelden</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48 }}
      >
        <Header onClose={() => router.back()} />
        <Text className="text-sm text-muted">
          Verbinde Sensoren und Geräte mit deinem Zelt. Die KI überwacht rund um
          die Uhr, regelt Licht, Klima, CO₂, Bewässerung und Dünger – je nach
          Phase und immer innerhalb fester Sicherheitsgrenzen.
        </Text>

        {list.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
        {list.error ? (
          <Text className="text-error">{list.error.message}</Text>
        ) : null}
        {(list.data ?? []).map((t) => (
          <TouchableOpacity
            key={t.id}
            testID={`tent-${t.id}`}
            className="bg-surface rounded-2xl p-4 border border-border gap-1"
            onPress={() =>
              router.push({
                pathname: "/smartgrow/[id]",
                params: { id: String(t.id) },
              })
            }
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">
                {t.simulated ? "🧪 " : "🌱 "}
                {t.name}
              </Text>
              <Text
                className="text-xs font-semibold"
                style={{
                  color:
                    t.mode === "auto"
                      ? colors.success
                      : t.mode === "assist"
                        ? colors.warning
                        : colors.muted,
                }}
              >
                {MODE_LABEL[t.mode]}
              </Text>
            </View>
            <Text className="text-sm text-muted">
              {STAGE_LABEL[t.stage]}
              {t.airTemp !== null ? ` · ${t.airTemp.toFixed(1)} °C` : ""}
              {t.airRh !== null ? ` · ${Math.round(t.airRh)} %` : ""}
              {!t.lastValueAt ? " · noch keine Messwerte" : ""}
            </Text>
            {t.recentAlerts > 0 ? (
              <Text className="text-xs" style={{ color: colors.warning }}>
                ⚠️ {t.recentAlerts} Hinweis(e) in der letzten Stunde
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}

        {!form ? (
          <View className="gap-3">
            <TouchableOpacity
              testID="sg-new"
              className="bg-primary rounded-2xl p-4 items-center"
              onPress={() => {
                setSim(false);
                setForm(true);
              }}
            >
              <Text className="text-white font-bold text-base">
                + Zelt verbinden
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="sg-sim"
              className="bg-surface rounded-2xl p-4 items-center border border-border"
              onPress={() => {
                setSim(true);
                setForm(true);
              }}
            >
              <Text className="text-foreground font-bold">
                🧪 Simulator ausprobieren (ohne Hardware)
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
            <Text className="text-base font-bold text-foreground">
              {sim ? "Simulator-Zelt" : "Neues Zelt"}
            </Text>
            <Label text="Name" />
            <TextInput
              value={name}
              onChangeText={setName}
              className="bg-background rounded-xl p-3 text-foreground border border-border"
              placeholderTextColor={colors.muted}
              maxLength={80}
            />
            <Label text="Phase" />
            <Chips
              options={STAGES.map((s) => ({ id: s, label: STAGE_LABEL[s] }))}
              value={stage}
              onChange={(v) => setStage(v as Stage)}
            />
            <Label text="Substrat" />
            <Chips
              options={MEDIA.map((m) => ({ id: m, label: MEDIUM_LABEL[m] }))}
              value={medium}
              onChange={(v) => setMedium(v as Medium)}
            />
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1">
                <Label text="Licht an (HH:MM)" />
                <TextInput
                  value={lightsOn}
                  onChangeText={setLightsOn}
                  className="bg-background rounded-xl p-3 text-foreground border border-border"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <View className="flex-1 gap-1">
                <Label text="Tank (Liter)" />
                <TextInput
                  value={liters}
                  onChangeText={setLiters}
                  className="bg-background rounded-xl p-3 text-foreground border border-border"
                  keyboardType="decimal-pad"
                  maxLength={6}
                />
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-foreground flex-1">
                Simulator (virtuelles Zelt zum Testen)
              </Text>
              <Switch value={sim} onValueChange={setSim} />
            </View>
            <TouchableOpacity
              testID="sg-create"
              className="bg-primary rounded-xl p-4 items-center"
              onPress={() => submit(sim)}
              disabled={create.isPending}
            >
              {create.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">Anlegen</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center p-2"
              onPress={() => setForm(false)}
            >
              <Text className="text-muted">Abbrechen</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text className="text-xs text-muted">
          Tipp: Mit dem Simulator siehst du, wie der Autopilot arbeitet, bevor
          du echte Geräte anschließt. Eigene Hardware (z. B. ESP32) verbindest
          du über das offene GrowMaster-Geräteprotokoll.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-2xl font-bold text-foreground">Smart Grow</Text>
      <TouchableOpacity
        onPress={onClose}
        accessibilityLabel="Schließen"
        className="p-2"
      >
        <Text className="text-muted text-base">Schließen</Text>
      </TouchableOpacity>
    </View>
  );
}

const Label = ({ text }: { text: string }) => (
  <Text className="text-xs font-semibold text-muted">{text}</Text>
);
