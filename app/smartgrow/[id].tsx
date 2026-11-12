import { useEffect, useMemo, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Polyline } from "react-native-svg";
import { ScreenContainer } from "@/components/screen-container";
import { Chips } from "@/components/smartgrow/chips";
import { AiCard, LeafCard } from "@/components/smartgrow/ai-cards";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers";
import {
  ACTUATOR_LABEL,
  DOSER_LABEL,
  MEDIA,
  MEDIUM_LABEL,
  METRIC_INFO,
  MODES,
  MODE_LABEL,
  STAGES,
  STAGE_LABEL,
  type Actuator,
  type DoserChannel,
  type Medium,
  type Metric,
  type Mode,
  type Range,
  type Stage,
} from "@/shared/smartgrow/types";

const MODE_HELP: Record<Mode, string> = {
  off: "Nur Überwachung und Alarme. Nur Notabschaltungen (Rauch, CO₂-Alarm, Überhitzung, Leck, Sensor-Ausfall) laufen weiter automatisch.",
  assist:
    "Die KI schlägt vor, du bestätigst. Notabschaltungen (CO₂-Alarm, Überhitzung, Leck) laufen trotzdem automatisch.",
  auto: "Die KI regelt selbst – innerhalb der Sicherheitsgrenzen. Ideal, wenn du unterwegs oder im Urlaub bist.",
};

/** Zelt-Dashboard: Live-Werte mit Zielbereich, Autopilot-Modus, Vorschläge, Handsteuerung, Geräte, Protokoll. */
export default function TentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tentId = Number(id);
  const router = useRouter();
  const colors = useColors();
  const utils = trpc.useUtils();
  const q = trpc.smartGrow.get.useQuery(
    { id: tentId },
    { enabled: Number.isFinite(tentId), refetchInterval: 15_000 },
  );
  const tick = trpc.smartGrow.tick.useMutation();
  const setMode = trpc.smartGrow.setMode.useMutation();
  const decideM = trpc.smartGrow.decide.useMutation();
  const command = trpc.smartGrow.command.useMutation();
  const del = trpc.smartGrow.delete.useMutation();
  const [chart, setChart] = useState<Metric>("airTemp");
  const [showSettings, setShowSettings] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const refresh = () =>
    Promise.all([
      utils.smartGrow.get.invalidate({ id: tentId }),
      utils.smartGrow.list.invalidate(),
    ]);

  useEffect(() => {
    if (Number.isFinite(tentId))
      tick
        .mutateAsync({ id: tentId })
        .then(refresh)
        .catch(() => undefined);
  }, [tentId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (q.isLoading)
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  if (q.error || !q.data) {
    return (
      <ScreenContainer className="p-4 gap-3">
        <Text className="text-error">
          {q.error?.message ?? "Zelt nicht gefunden"}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary">Zurück</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }
  const t = q.data;

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn();
      await refresh();
      if (ok) Alert.alert(ok);
    } catch (e) {
      Alert.alert("Nicht möglich", (e as Error).message);
    }
  };
  const changeMode = (m: Mode) => {
    if (m === t.mode) return;
    const go = () => run(() => setMode.mutateAsync({ id: tentId, mode: m }));
    if (m === "auto") {
      Alert.alert(
        "Autopilot einschalten?",
        "Die KI schaltet Licht, Klima, CO₂, Bewässerung und Dosierung selbst – nur innerhalb deiner Sicherheitsgrenzen. Prüfe vorher, dass alle Geräte richtig angeschlossen sind.",
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Einschalten", onPress: go },
        ],
      );
    } else go();
  };
  const manual = (
    cmd: Parameters<typeof command.mutateAsync>[0]["cmd"],
    label: string,
    confirm = false,
  ) => {
    const go = () =>
      run(() => command.mutateAsync({ tentId, cmd }), `${label}: gesendet`);
    if (confirm)
      Alert.alert(label, "Wirklich ausführen?", [
        { text: "Abbrechen", style: "cancel" },
        { text: "Ja", onPress: go },
      ]);
    else go();
  };

  const range = (m: Metric | "vpd"): Range | null => {
    const g = t.targets;
    switch (m) {
      case "airTemp":
        return t.isDay ? g.tempDay : g.tempNight;
      case "airRh":
        return g.rh;
      case "co2":
        return t.isDay && g.co2Target > 0
          ? { min: g.co2Target - 150, max: g.co2Target + 100 }
          : null;
      case "waterEc":
        return g.ec;
      case "waterPh":
      case "soilPh":
        return g.ph;
      case "soilMoisture":
        return g.soilMoisture.max > 0 ? g.soilMoisture : null;
      case "ppfd":
        return t.isDay ? g.ppfd : null;
      case "vpd":
        return g.vpd;
      default:
        return null;
    }
  };
  // ohne Zielbereich neutral (Textfarbe aus dem Theme), sonst grün/gelb
  const tone = (v: number, r: Range | null) =>
    !r ? undefined : v < r.min || v > r.max ? colors.warning : colors.success;
  const sensors = t.sensors as Metric[];
  const lightLabel = !t.light.isDay
    ? "🌙 Nacht"
    : t.light.phase === "sunrise"
      ? "🌅 Sonnenaufgang"
      : t.light.phase === "sunset"
        ? "🌇 Sonnenuntergang"
        : "☀️ Tag";

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 60 }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="py-2 pr-3">
            <Text className="text-primary">‹ Zelte</Text>
          </TouchableOpacity>
          <Text className="text-xs text-muted">
            {t.simulated ? "🧪 Simulator" : ""}
          </Text>
        </View>
        <Text className="text-2xl font-bold text-foreground">{t.name}</Text>
        <Text className="text-sm text-muted">
          {STAGE_LABEL[t.settings.stage]} · {MEDIUM_LABEL[t.settings.medium]} ·{" "}
          {lightLabel} ({t.targets.lightHours} h Licht ab {t.settings.lightsOn})
          {t.settings.purpleFinish ? " · 💜 Lila-Finish" : ""}
        </Text>

        {/* Autopilot */}
        <View className="bg-surface rounded-2xl p-4 border border-border gap-2">
          <Text className="text-base font-bold text-foreground">
            KI-Autopilot
          </Text>
          <Chips
            options={MODES.map((m) => ({ id: m, label: MODE_LABEL[m] }))}
            value={t.mode}
            onChange={(m) => changeMode(m as Mode)}
            testIDPrefix="mode"
          />
          <Text className="text-xs text-muted">{MODE_HELP[t.mode]}</Text>
        </View>

        {/* Alarme */}
        {t.alerts.length > 0 ? (
          <View
            className="rounded-2xl p-4 gap-1"
            style={{
              backgroundColor: t.alerts.some((a) => a.level === "alarm")
                ? `${colors.error}22`
                : `${colors.warning}22`,
            }}
          >
            {t.alerts.map((a) => (
              <Text key={a.kind} className="text-sm text-foreground">
                {a.level === "alarm" ? "🚨" : "⚠️"} {a.message}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Messwerte */}
        {sensors.length === 0 ? (
          <Text className="text-sm text-muted">
            Noch keine Sensoren verbunden. Füge unten ein Gerät hinzu.
          </Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {sensors.map((m) => {
              const r = t.readings[m];
              const info = METRIC_INFO[m];
              const tr = range(m);
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setChart(m)}
                  testID={`tile-${m}`}
                  className="bg-surface rounded-xl p-3 border"
                  style={{
                    width: "48%",
                    borderColor: chart === m ? colors.primary : colors.border,
                  }}
                >
                  <Text className="text-xs text-muted">{info.label}</Text>
                  <Text
                    className="text-xl font-bold text-foreground"
                    style={{ color: r ? tone(r.value, tr) : colors.muted }}
                  >
                    {r
                      ? `${m === "leak" ? (r.value >= 1 ? "NASS" : "trocken") : r.value.toFixed(info.decimals)} ${m === "leak" ? "" : info.unit}`
                      : "–"}
                  </Text>
                  {tr ? (
                    <Text className="text-xs text-muted">
                      Ziel {tr.min}–{tr.max}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
            {t.vpd !== null ? (
              <View
                className="bg-surface rounded-xl p-3 border border-border"
                style={{ width: "48%" }}
              >
                <Text className="text-xs text-muted">VPD</Text>
                <Text
                  className="text-xl font-bold"
                  style={{ color: tone(t.vpd, range("vpd")) }}
                >
                  {t.vpd.toFixed(2)} kPa
                </Text>
                <Text className="text-xs text-muted">
                  Ziel {t.targets.vpd.min}–{t.targets.vpd.max}
                </Text>
              </View>
            ) : null}
          </View>
        )}
        {sensors.length > 0 ? <History tentId={tentId} metric={chart} /> : null}

        {/* Vorschläge */}
        {t.mode === "assist" && t.proposals.length > 0 ? (
          <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
            <Text className="text-base font-bold text-foreground">
              Vorschläge der KI ({t.proposals.length})
            </Text>
            {t.proposals.map((p) => (
              <View key={p.id} className="gap-2">
                <Text className="text-sm text-foreground">
                  <Text className="font-bold">{p.text}</Text> – {p.reason}
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    testID={`approve-${p.id}`}
                    className="flex-1 bg-primary rounded-xl p-3 items-center"
                    onPress={() =>
                      run(() =>
                        decideM.mutateAsync({ commandId: p.id, approve: true }),
                      )
                    }
                  >
                    <Text className="text-white font-bold">Ausführen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-background rounded-xl p-3 items-center border border-border"
                    onPress={() =>
                      run(() =>
                        decideM.mutateAsync({
                          commandId: p.id,
                          approve: false,
                        }),
                      )
                    }
                  >
                    <Text className="text-foreground">Ablehnen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Was der Regler gerade denkt */}
        {t.next.length > 0 || t.blocked.length > 0 ? (
          <View className="bg-surface rounded-2xl p-4 border border-border gap-1">
            <Text className="text-base font-bold text-foreground">
              {t.mode === "auto"
                ? "Der Autopilot regelt gerade"
                : "Das würde die KI jetzt tun"}
            </Text>
            {t.next.map((n, i) => (
              <Text key={i} className="text-sm text-foreground">
                {n.safety ? "🛡️" : "•"} {n.text} – {n.reason}
              </Text>
            ))}
            {t.blocked.map((b, i) => (
              <Text key={`b${i}`} className="text-xs text-muted">
                ⛔ {b.text}: {b.reason}
              </Text>
            ))}
          </View>
        ) : null}

        <AiCard
          tentId={tentId}
          summary={t.aiSummary}
          adjustments={t.adjustments}
          aiEnabled={t.aiEnabled}
          onChanged={refresh}
        />
        <LeafCard tentId={tentId} last={t.lastSnapshot} onChanged={refresh} />

        {/* Handsteuerung */}
        {t.caps.length > 0 ? (
          <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
            <Text className="text-base font-bold text-foreground">
              Von Hand schalten
            </Text>
            {t.caps.map((c) => {
              const a = c.type as Actuator;
              const cur = t.state[a];
              if (a === "pump") {
                return (
                  <Row
                    key={a}
                    label={`${ACTUATOR_LABEL.pump} · heute ${t.usage.pumpSecondsToday} s`}
                  >
                    <Btn
                      label="30 s gießen"
                      onPress={() =>
                        manual(
                          { kind: "run", actuator: "pump", seconds: 30 },
                          "30 s gießen",
                          true,
                        )
                      }
                    />
                    <Btn
                      label="Stopp"
                      onPress={() =>
                        manual(
                          { kind: "run", actuator: "pump", seconds: 0 },
                          "Pumpe stoppen",
                        )
                      }
                    />
                  </Row>
                );
              }
              if (a === "doser") {
                return (
                  <View key={a} className="gap-2">
                    <Text className="text-sm text-foreground">
                      {ACTUATOR_LABEL.doser}
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {(c.channels ?? []).map((ch) => (
                        <Btn
                          key={ch}
                          label={`${DOSER_LABEL[ch as DoserChannel]} 1 ml${t.usage.dosedToday[ch as DoserChannel] ? ` (heute ${t.usage.dosedToday[ch as DoserChannel]} ml)` : ""}`}
                          onPress={() =>
                            manual(
                              {
                                kind: "dose",
                                actuator: "doser",
                                channel: ch as DoserChannel,
                                ml: 1,
                              },
                              `${DOSER_LABEL[ch as DoserChannel]} 1 ml`,
                              true,
                            )
                          }
                        />
                      ))}
                    </View>
                  </View>
                );
              }
              const steps =
                c.dimmable || ["exhaust", "intake", "circulation"].includes(a)
                  ? [0, 30, 60, 100]
                  : [0, 100];
              return (
                <Row
                  key={a}
                  label={`${ACTUATOR_LABEL[a]}${cur !== undefined ? ` · ${cur === 0 ? "aus" : steps.length === 2 ? "an" : `${cur} %`}` : ""}`}
                >
                  {steps.map((v) => (
                    <Btn
                      key={v}
                      testID={`man-${a}-${v}`}
                      label={
                        v === 0 ? "Aus" : steps.length === 2 ? "An" : `${v} %`
                      }
                      active={cur === v}
                      onPress={() =>
                        manual(
                          {
                            kind: "set",
                            actuator: a as Exclude<Actuator, "pump" | "doser">,
                            value: v,
                          } as never,
                          `${ACTUATOR_LABEL[a]} ${v === 0 ? "aus" : `${v} %`}`,
                        )
                      }
                    />
                  ))}
                </Row>
              );
            })}
            {t.mode === "auto" ? (
              <Text className="text-xs text-muted">
                Im Autopilot passt die KI Stellungen beim nächsten Takt wieder
                an.
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Geräte */}
        <View className="bg-surface rounded-2xl p-4 border border-border gap-2">
          <Text className="text-base font-bold text-foreground">Geräte</Text>
          {t.devices.map((d) => (
            <View key={d.id} className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm text-foreground">
                  {d.online ? "🟢" : "🔴"} {d.name}
                </Text>
                <Text className="text-xs text-muted">
                  {d.kind === "simulator"
                    ? "Simulator"
                    : d.lastSeenAt
                      ? `zuletzt ${new Date(d.lastSeenAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
                      : "noch nie gemeldet"}
                  {d.firmware ? ` · ${d.firmware}` : ""} ·{" "}
                  {d.caps.sensors.length} Sensoren, {d.caps.actuators.length}{" "}
                  Aktoren
                </Text>
              </View>
              {d.kind === "http" ? (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/smartgrow/device",
                      params: {
                        tentId: String(tentId),
                        deviceId: String(d.id),
                      },
                    })
                  }
                >
                  <Text className="text-primary text-sm">Verwalten</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          <TouchableOpacity
            testID="add-device"
            className="bg-background rounded-xl p-3 items-center border border-border"
            onPress={() =>
              router.push({
                pathname: "/smartgrow/device",
                params: { tentId: String(tentId) },
              })
            }
          >
            <Text className="text-foreground font-semibold">
              + Gerät verbinden
            </Text>
          </TouchableOpacity>
        </View>

        {/* Einstellungen */}
        <TouchableOpacity
          onPress={() => setShowSettings(!showSettings)}
          className="flex-row justify-between items-center"
        >
          <Text className="text-base font-bold text-foreground">
            Phase & Einstellungen
          </Text>
          <Text className="text-primary">
            {showSettings ? "schließen" : "öffnen"}
          </Text>
        </TouchableOpacity>
        {showSettings ? <Settings tent={t} onSaved={refresh} /> : null}

        {/* Protokoll */}
        <TouchableOpacity
          onPress={() => setShowLog(!showLog)}
          className="flex-row justify-between items-center"
        >
          <Text className="text-base font-bold text-foreground">
            Protokoll ({t.events.length})
          </Text>
          <Text className="text-primary">
            {showLog ? "schließen" : "öffnen"}
          </Text>
        </TouchableOpacity>
        {showLog ? (
          <View className="gap-2">
            {t.events.map((e) => (
              <Text key={e.id} className="text-xs text-foreground">
                <Text className="text-muted">
                  {new Date(e.at).toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                </Text>
                {e.level === "alarm" ? "🚨 " : e.level === "warn" ? "⚠️ " : ""}
                {e.message}
              </Text>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          className="items-center p-3"
          onPress={() =>
            Alert.alert(
              "Zelt löschen?",
              "Alle Messwerte, das Protokoll und die Geräte-Zugänge dieses Zelts werden gelöscht.",
              [
                { text: "Abbrechen", style: "cancel" },
                {
                  text: "Löschen",
                  style: "destructive",
                  onPress: () =>
                    run(async () => {
                      await del.mutateAsync({ id: tentId });
                      await utils.smartGrow.list.invalidate();
                      router.back();
                    }),
                },
              ],
            )
          }
        >
          <Text style={{ color: colors.error }}>Zelt löschen</Text>
        </TouchableOpacity>
        <Text className="text-xs text-muted">
          Die KI arbeitet mit Richtwerten und festen Sicherheitsgrenzen.
          Elektrische Geräte, CO₂ und Wasser bergen Risiken – Installation nur
          fachgerecht, mit Fehlerstromschutz und Rauchmelder. Beachte die
          Rechtslage (in Deutschland max. 3 Pflanzen für den Eigenbedarf).
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm text-foreground">{label}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

function Btn({
  label,
  onPress,
  active,
  testID,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      className="rounded-lg px-3 py-2 border"
      style={{
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? `${colors.primary}22` : "transparent",
      }}
    >
      <Text className="text-sm text-foreground">{label}</Text>
    </TouchableOpacity>
  );
}

/** Verlauf der gewählten Messgröße (24 h). */
function History({ tentId, metric }: { tentId: number; metric: Metric }) {
  const colors = useColors();
  const h = trpc.smartGrow.history.useQuery(
    { tentId, metric, hours: 24 },
    { refetchInterval: 60_000 },
  );
  const [w, setW] = useState(300);
  const pts = useMemo(() => h.data ?? [], [h.data]);
  const path = useMemo(() => {
    if (pts.length < 2) return "";
    const lo = Math.min(...pts.map((p) => p.v));
    const hi = Math.max(...pts.map((p) => p.v));
    const span = hi - lo || 1;
    const t0 = pts[0].t;
    const t1 = pts[pts.length - 1].t || t0 + 1;
    return pts
      .map(
        (p) =>
          `${((p.t - t0) / (t1 - t0 || 1)) * (w - 4) + 2},${76 - ((p.v - lo) / span) * 72}`,
      )
      .join(" ");
  }, [pts, w]);
  const info = METRIC_INFO[metric];
  return (
    <View
      className="bg-surface rounded-2xl p-3 border border-border"
      onLayout={(e) => setW(e.nativeEvent.layout.width - 24)}
    >
      <Text className="text-xs text-muted mb-1">
        {info.label} – letzte 24 h
        {pts.length
          ? ` (${Math.min(...pts.map((p) => p.v)).toFixed(info.decimals)}–${Math.max(...pts.map((p) => p.v)).toFixed(info.decimals)} ${info.unit})`
          : ""}
      </Text>
      {path ? (
        <Svg width={w} height={80}>
          <Polyline
            points={path}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2}
          />
        </Svg>
      ) : (
        <Text className="text-xs text-muted">Noch zu wenige Messwerte.</Text>
      )}
    </View>
  );
}

type TentData = inferRouterOutputs<AppRouter>["smartGrow"]["get"];

function Settings({ tent, onSaved }: { tent: TentData; onSaved: () => void }) {
  const colors = useColors();
  const update = trpc.smartGrow.update.useMutation();
  const s = tent.settings;
  const [stage, setStage] = useState<Stage>(s.stage);
  const [medium, setMedium] = useState<Medium>(s.medium);
  const [lightsOn, setLightsOn] = useState(s.lightsOn);
  const [hours, setHours] = useState(
    s.lightHoursOverride != null ? String(s.lightHoursOverride) : "",
  );
  const [ramp, setRamp] = useState(String(s.rampMinutes));
  const [liters, setLiters] = useState(String(s.reservoirLiters));
  const [purple, setPurple] = useState(s.purpleFinish);
  const [harvest, setHarvest] = useState(s.harvestDate ?? "");
  const [co2Max, setCo2Max] = useState(String(tent.limits.co2Max));
  const [tempMax, setTempMax] = useState(String(tent.limits.airTempMax));
  const [doseDay, setDoseDay] = useState(String(tent.limits.doseMaxMlPerDay));
  const [pumpDay, setPumpDay] = useState(
    String(tent.limits.pumpMaxSecondsPerDay),
  );
  const num = (v: string) => Number(v.replace(",", "."));

  const save = async () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(lightsOn))
      return Alert.alert("Licht an", "Bitte als HH:MM eingeben");
    if (purple && !/^\d{4}-\d{2}-\d{2}$/.test(harvest))
      return Alert.alert(
        "Lila-Finish",
        "Für das Lila-Finish brauche ich das geplante Erntedatum (JJJJ-MM-TT).",
      );
    try {
      await update.mutateAsync({
        id: tent.id,
        settings: {
          ...s,
          stage,
          medium,
          lightsOn,
          lightHoursOverride: hours.trim()
            ? Math.min(24, Math.max(0, num(hours)))
            : null,
          rampMinutes: Math.round(Math.min(120, Math.max(0, num(ramp) || 0))),
          reservoirLiters: Math.max(1, num(liters) || 20),
          purpleFinish: purple,
          harvestDate: harvest || null,
        },
        limits: {
          co2Max: num(co2Max),
          airTempMax: num(tempMax),
          doseMaxMlPerDay: num(doseDay),
          pumpMaxSecondsPerDay: num(pumpDay),
        },
      });
      onSaved();
      Alert.alert("Gespeichert");
    } catch (e) {
      Alert.alert("Nicht möglich", (e as Error).message);
    }
  };
  const input = (
    label: string,
    value: string,
    set: (v: string) => void,
    hint?: string,
  ) => (
    <View className="gap-1" style={{ width: "48%" }}>
      <Text className="text-xs font-semibold text-muted">{label}</Text>
      <TextInput
        value={value}
        onChangeText={set}
        className="bg-background rounded-xl p-3 text-foreground border border-border"
        keyboardType="numbers-and-punctuation"
        placeholder={hint}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
  return (
    <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
      <Text className="text-xs font-semibold text-muted">Phase</Text>
      <Chips
        options={STAGES.map((x) => ({ id: x, label: STAGE_LABEL[x] }))}
        value={stage}
        onChange={(v) => setStage(v as Stage)}
      />
      <Text className="text-xs font-semibold text-muted">Substrat</Text>
      <Chips
        options={MEDIA.map((x) => ({ id: x, label: MEDIUM_LABEL[x] }))}
        value={medium}
        onChange={(v) => setMedium(v as Medium)}
      />
      <View className="flex-row flex-wrap gap-3">
        {input("Licht an (HH:MM)", lightsOn, setLightsOn)}
        {input(
          "Lichtstunden (leer = Phase)",
          hours,
          setHours,
          `${tent.targets.lightHours}`,
        )}
        {input("Sonnenauf-/untergang (Min.)", ramp, setRamp)}
        {input("Tank (Liter)", liters, setLiters)}
      </View>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-sm text-foreground">💜 Lila-Finish</Text>
          <Text className="text-xs text-muted">
            Letzte 2 Wochen vor der Ernte nachts unter 15 °C – färbt dafür
            veranlagte Sorten lila.
          </Text>
        </View>
        <Switch value={purple} onValueChange={setPurple} />
      </View>
      {purple
        ? input("Erntedatum (JJJJ-MM-TT)", harvest, setHarvest, "2026-12-20")
        : null}
      <Text className="text-xs font-semibold text-muted mt-2">
        Sicherheitsgrenzen
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {input(
          `Max. Temperatur °C (≤ ${tent.hardLimits.airTempMax.max})`,
          tempMax,
          setTempMax,
        )}
        {input(
          `CO₂-Grenze ppm (≤ ${tent.hardLimits.co2Max.max})`,
          co2Max,
          setCo2Max,
        )}
        {input("Dünger max. ml/Tag je Kanal", doseDay, setDoseDay)}
        {input("Gießen max. Sekunden/Tag", pumpDay, setPumpDay)}
      </View>
      <TouchableOpacity
        className="bg-primary rounded-xl p-4 items-center"
        onPress={save}
        disabled={update.isPending}
      >
        {update.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-bold">Speichern</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
