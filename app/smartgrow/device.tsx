import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Chips } from "@/components/smartgrow/chips";
import { HaSetup } from "@/components/smartgrow/ha-setup";
import { AddonPaywall } from "@/components/smartgrow/addon-paywall";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { getApiBaseUrl } from "@/constants/oauth";
import {
  ACTUATORS,
  ACTUATOR_LABEL,
  DOSER_CHANNELS,
  DOSER_LABEL,
  METRICS,
  METRIC_INFO,
  type Actuator,
  type DoserChannel,
  type Metric,
} from "@/shared/smartgrow/types";

/** Vorlagen für gängige Aufbauten – danach frei anpassbar. */
const PRESETS: {
  id: string;
  label: string;
  sensors: Metric[];
  actuators: Actuator[];
}[] = [
  {
    id: "climate",
    label: "Klima-Box",
    sensors: ["airTemp", "airRh", "co2"],
    actuators: ["exhaust", "intake", "humidifier", "dehumidifier", "heater"],
  },
  {
    id: "light",
    label: "Licht-Controller",
    sensors: ["ppfd", "leafTemp"],
    actuators: ["light"],
  },
  {
    id: "water",
    label: "Wasser & Dünger",
    sensors: [
      "waterEc",
      "waterPh",
      "waterTemp",
      "waterLevel",
      "soilMoisture",
      "leak",
    ],
    actuators: ["pump", "doser"],
  },
  {
    id: "all",
    label: "Alles in einem",
    sensors: [
      "airTemp",
      "airRh",
      "co2",
      "leafTemp",
      "waterEc",
      "waterPh",
      "waterLevel",
      "soilMoisture",
      "leak",
    ],
    actuators: [
      "light",
      "exhaust",
      "intake",
      "humidifier",
      "dehumidifier",
      "heater",
      "co2",
      "pump",
      "doser",
    ],
  },
];

export default function DeviceScreen() {
  const { tentId, deviceId } = useLocalSearchParams<{
    tentId: string;
    deviceId?: string;
  }>();
  const router = useRouter();
  const colors = useColors();
  const utils = trpc.useUtils();
  const tent = trpc.smartGrow.get.useQuery({ id: Number(tentId) });
  const add = trpc.smartGrow.addDevice.useMutation();
  const rotate = trpc.smartGrow.rotateDeviceToken.useMutation();
  const remove = trpc.smartGrow.removeDevice.useMutation();
  const [name, setName] = useState("ESP32 Zelt");
  const [sensors, setSensors] = useState<Metric[]>(["airTemp", "airRh"]);
  const [actuators, setActuators] = useState<Actuator[]>(["exhaust"]);
  const [dimmable, setDimmable] = useState(true);
  const [channels, setChannels] = useState<DoserChannel[]>([
    "nutrientA",
    "nutrientB",
    "phDown",
  ]);
  const [token, setToken] = useState<string | null>(null);
  const [via, setVia] = useState<"own" | "ha">("own");
  const access = trpc.smartGrow.access.useQuery();
  const existing = deviceId
    ? tent.data?.devices.find((d) => d.id === Number(deviceId))
    : undefined;
  const endpoint = `${getApiBaseUrl()}/api/device/v1/report`;
  const toggle = <T,>(arr: T[], v: T) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const create = async () => {
    if (!sensors.length && !actuators.length)
      return Alert.alert(
        "Bitte mindestens einen Sensor oder ein Gerät wählen.",
      );
    try {
      const r = await add.mutateAsync({
        tentId: Number(tentId),
        name: name.trim() || "Gerät",
        caps: {
          sensors,
          actuators: actuators.map((a) => ({
            type: a,
            ...(a === "light" ? { dimmable } : {}),
            ...(a === "doser" ? { channels } : {}),
          })),
        },
      });
      setToken(r.token);
      await utils.smartGrow.get.invalidate({ id: Number(tentId) });
    } catch (e) {
      Alert.alert("Nicht möglich", (e as Error).message);
    }
  };
  const example = (tok: string) =>
    `curl -X POST ${endpoint} \\\n  -H "Authorization: Bearer ${tok}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"readings":{${sensors
      .slice(0, 2)
      .map((m) => `"${m}":${m === "airRh" ? 60 : 24.5}`)
      .join(",")}},"firmware":"mein-geraet 0.1"}'`;

  if (token) {
    return (
      <ScreenContainer>
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48 }}
        >
          <Text className="text-2xl font-bold text-foreground">
            Gerät verbunden ✅
          </Text>
          <Text className="text-sm text-foreground">
            Trage diesen Zugang in dein Gerät ein.{" "}
            <Text className="font-bold">Er wird nur jetzt angezeigt</Text> –
            speichere ihn sicher (z. B. in der Firmware-Konfiguration).
          </Text>
          <View className="bg-surface rounded-xl p-3 border border-border gap-1">
            <Text className="text-xs text-muted">Adresse</Text>
            <Text selectable className="text-sm text-foreground">
              {endpoint}
            </Text>
            <Text className="text-xs text-muted mt-2">Geräte-Token</Text>
            <Text
              selectable
              testID="device-token"
              className="text-sm font-bold text-foreground"
            >
              {token}
            </Text>
          </View>
          <TouchableOpacity
            className="bg-primary rounded-xl p-4 items-center"
            onPress={() =>
              Share.share({
                message: `GrowMaster Smart Grow\nAdresse: ${endpoint}\nToken: ${token}`,
              })
            }
          >
            <Text className="text-white font-bold">
              Zugang teilen/speichern
            </Text>
          </TouchableOpacity>
          <Text className="text-sm font-bold text-foreground">
            So meldet sich dein Gerät (alle 30 Sekunden):
          </Text>
          <Text
            selectable
            className="text-xs text-foreground bg-surface rounded-xl p-3 border border-border"
            style={{ fontFamily: "monospace" }}
          >
            {example(token)}
          </Text>
          <Text className="text-xs text-muted">
            Die Antwort enthält die Befehle für dein Gerät (z. B. Abluft 60 %).
            Nach dem Ausführen bestätigt es sie beim nächsten Melden mit „acks“.
            Hört dein Gerät 5 Minuten nichts vom Server, schaltet es in den
            sicheren Notbetrieb (Pumpen, Dosierer, CO₂ und Heizung aus, Lüftung
            50 %, Licht nach eigenem Zeitplan). Eine fertige ESP32-Vorlage liegt
            im Projekt unter firmware/esp32-growmaster.
          </Text>
          <TouchableOpacity
            className="bg-surface rounded-xl p-4 items-center border border-border"
            onPress={() => router.back()}
          >
            <Text className="text-foreground font-bold">Fertig</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (deviceId) {
    if (tent.isLoading)
      return (
        <ScreenContainer className="items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </ScreenContainer>
      );
    return (
      <ScreenContainer>
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48 }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary">‹ Zurück</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">
            {existing?.name ?? "Gerät"}
          </Text>
          <Text className="text-sm text-muted">
            Token beginnt mit {existing?.tokenHint ?? "?"}… ·{" "}
            {existing?.firmware ?? "Firmware unbekannt"}
          </Text>
          <Text className="text-sm text-foreground">
            Sensoren:{" "}
            {existing?.caps.sensors
              .map((m) => METRIC_INFO[m as Metric].label)
              .join(", ") || "keine"}
          </Text>
          <Text className="text-sm text-foreground">
            Geräte:{" "}
            {existing?.caps.actuators
              .map((a) => ACTUATOR_LABEL[a.type as Actuator])
              .join(", ") || "keine"}
          </Text>
          <TouchableOpacity
            className="bg-surface rounded-xl p-4 items-center border border-border"
            onPress={() =>
              Alert.alert(
                "Neues Token?",
                "Das alte Token funktioniert danach nicht mehr – du musst das neue im Gerät eintragen.",
                [
                  { text: "Abbrechen", style: "cancel" },
                  {
                    text: "Neues Token",
                    onPress: async () => {
                      try {
                        const r = await rotate.mutateAsync({
                          deviceId: Number(deviceId),
                        });
                        setToken(r.token);
                      } catch (e) {
                        Alert.alert("Nicht möglich", (e as Error).message);
                      }
                    },
                  },
                ],
              )
            }
          >
            <Text className="text-foreground font-bold">
              Neues Token erzeugen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="items-center p-3"
            onPress={() =>
              Alert.alert(
                "Gerät entfernen?",
                "Es kann sich danach nicht mehr melden.",
                [
                  { text: "Abbrechen", style: "cancel" },
                  {
                    text: "Entfernen",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await remove.mutateAsync({
                          deviceId: Number(deviceId),
                        });
                        await utils.smartGrow.get.invalidate({
                          id: Number(tentId),
                        });
                        router.back();
                      } catch (e) {
                        Alert.alert("Nicht möglich", (e as Error).message);
                      }
                    },
                  },
                ],
              )
            }
          >
            <Text style={{ color: colors.error }}>Gerät entfernen</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (access.data && !access.data.active) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary">‹ Zurück</Text>
          </TouchableOpacity>
          <AddonPaywall />
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary">‹ Zurück</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">
          Gerät verbinden
        </Text>
        <Chips
          options={[
            { id: "own", label: "Eigene Hardware (ESP32 …)" },
            { id: "ha", label: "Home Assistant" },
          ]}
          value={via}
          onChange={(v) => setVia(v as "own" | "ha")}
          testIDPrefix="via"
        />
        {via === "ha" ? (
          <HaSetup
            tentId={Number(tentId)}
            onDone={async () => {
              await utils.smartGrow.get.invalidate({ id: Number(tentId) });
              router.back();
            }}
          />
        ) : (
          <>
            <Text className="text-sm text-muted">
              Wähle, was dein Gerät misst und schaltet. Ein Gerät kann ein
              Sensor-Modul, eine Steckdosenleiste, ein Licht-Dimmer oder deine
              eigene Steuerung sein.
            </Text>
            <Text className="text-xs font-semibold text-muted">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={80}
              className="bg-surface rounded-xl p-3 text-foreground border border-border"
            />
            <Text className="text-xs font-semibold text-muted">Vorlage</Text>
            <Chips
              options={PRESETS.map((p) => ({ id: p.id, label: p.label }))}
              value=""
              onChange={(id) => {
                const p = PRESETS.find((x) => x.id === id)!;
                setSensors(p.sensors);
                setActuators(p.actuators);
              }}
            />
            <Text className="text-xs font-semibold text-muted">
              Sensoren (misst)
            </Text>
            <Chips
              options={METRICS.map((m) => ({
                id: m,
                label: METRIC_INFO[m].label,
              }))}
              value={sensors}
              onChange={(m) => setSensors(toggle(sensors, m as Metric))}
              testIDPrefix="sensor"
            />
            <Text className="text-xs font-semibold text-muted">
              Geräte (schaltet)
            </Text>
            <Chips
              options={ACTUATORS.map((a) => ({
                id: a,
                label: ACTUATOR_LABEL[a],
              }))}
              value={actuators}
              onChange={(a) => setActuators(toggle(actuators, a as Actuator))}
              testIDPrefix="act"
            />
            {actuators.includes("light") ? (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-foreground flex-1">
                  Licht ist dimmbar (für Sonnenauf-/untergang)
                </Text>
                <Switch value={dimmable} onValueChange={setDimmable} />
              </View>
            ) : null}
            {actuators.includes("doser") ? (
              <>
                <Text className="text-xs font-semibold text-muted">
                  Dosierkanäle
                </Text>
                <Chips
                  options={DOSER_CHANNELS.map((c) => ({
                    id: c,
                    label: DOSER_LABEL[c],
                  }))}
                  value={channels}
                  onChange={(c) =>
                    setChannels(toggle(channels, c as DoserChannel))
                  }
                />
              </>
            ) : null}
            <TouchableOpacity
              testID="device-create"
              className="bg-primary rounded-xl p-4 items-center mt-2"
              onPress={create}
              disabled={add.isPending}
            >
              {add.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">
                  Gerät anlegen & Zugang erzeugen
                </Text>
              )}
            </TouchableOpacity>
            <Text className="text-xs text-muted">
              Fertige Geräte (Shelly, Tuya, AC Infinity …) verbindest du über
              „Home Assistant“ oben.
            </Text>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
