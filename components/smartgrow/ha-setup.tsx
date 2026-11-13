import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import {
  ACTUATORS,
  ACTUATOR_LABEL,
  METRICS,
  METRIC_INFO,
  type Actuator,
  type Metric,
} from "@/shared/smartgrow/types";

type Entity = { entity_id: string; name: string; unit?: string; state: string };

/** Welche HA-Entitäten passen zu einer Messgröße (Einheit/Name) bzw. zu einem Gerät (Domäne). */
function candidatesForMetric(m: Metric, all: Entity[]): Entity[] {
  const unit: Partial<Record<Metric, RegExp>> = {
    airTemp: /°[CF]/,
    leafTemp: /°[CF]/,
    waterTemp: /°[CF]/,
    soilTemp: /°[CF]/,
    airRh: /%/,
    soilMoisture: /%/,
    waterLevel: /%/,
    co2: /ppm/i,
    waterEc: /S\/cm/i,
    soilEc: /S\/cm/i,
    ppfd: /mol/i,
  };
  const word: Partial<Record<Metric, RegExp>> = {
    airTemp: /temp/i,
    leafTemp: /(leaf|blatt|ir)/i,
    waterTemp: /(wasser|water|tank)/i,
    soilTemp: /(soil|boden|erde)/i,
    airRh: /(hum|feucht)/i,
    soilMoisture: /(soil|boden|moist|erde)/i,
    waterLevel: /(level|füll|fuell|tank)/i,
    waterPh: /ph/i,
    soilPh: /ph/i,
    leak: /(leak|leck|wasser|water)/i,
  };
  return all
    .filter((e) => {
      const isSensor =
        e.entity_id.startsWith("sensor.") ||
        (m === "leak" && e.entity_id.startsWith("binary_sensor."));
      if (!isSensor) return false;
      const u = unit[m];
      const w = word[m];
      const text = `${e.entity_id} ${e.name}`;
      return (
        (u ? u.test(e.unit ?? "") : true) &&
        (w
          ? w.test(text) || (u && u.test(e.unit ?? "") && m === "airTemp")
          : true)
      );
    })
    .slice(0, 8);
}
function candidatesForActuator(a: Actuator, all: Entity[]): Entity[] {
  const domains =
    a === "light"
      ? ["light", "switch"]
      : ["exhaust", "intake", "circulation"].includes(a)
        ? ["fan", "switch", "number"]
        : a === "humidifier" || a === "dehumidifier"
          ? ["humidifier", "switch"]
          : ["switch", "input_boolean"];
  return all
    .filter((e) => domains.includes(e.entity_id.split(".")[0]))
    .slice(0, 12);
}

export function HaSetup({
  tentId,
  onDone,
}: {
  tentId: number;
  onDone: () => void;
}) {
  const colors = useColors();
  const test = trpc.smartGrow.haEntities.useMutation();
  const add = trpc.smartGrow.addHaDevice.useMutation();
  const [url, setUrl] = useState("https://");
  const [token, setToken] = useState("");
  const [name, setName] = useState("Home Assistant");
  const [entities, setEntities] = useState<Entity[] | null>(null);
  const [sensors, setSensors] = useState<Partial<Record<Metric, string>>>({});
  const [acts, setActs] = useState<Partial<Record<Actuator, string>>>({});
  const [dimmable, setDimmable] = useState(true);
  const [camera, setCamera] = useState<string | null>(null);
  const cameras = useMemo(
    () =>
      (entities ?? [])
        .filter((e) => e.entity_id.startsWith("camera."))
        .slice(0, 8),
    [entities],
  );
  const metricRows = useMemo(
    () =>
      entities
        ? METRICS.map((m) => ({
            m,
            c: candidatesForMetric(m, entities),
          })).filter((r) => r.c.length)
        : [],
    [entities],
  );
  const actRows = useMemo(
    () =>
      entities
        ? ACTUATORS.filter((a) => a !== "doser")
            .map((a) => ({ a, c: candidatesForActuator(a, entities) }))
            .filter((r) => r.c.length)
        : [],
    [entities],
  );

  const connect = async () => {
    try {
      const r = await test.mutateAsync({ baseUrl: url, token });
      setUrl(r.baseUrl);
      setEntities(r.entities);
      if (!r.entities.length)
        Alert.alert("Verbunden", "Keine passenden Entitäten gefunden.");
    } catch (e) {
      Alert.alert("Verbindung fehlgeschlagen", (e as Error).message);
    }
  };
  const save = async () => {
    if (!Object.keys(sensors).length && !Object.keys(acts).length && !camera)
      return Alert.alert(
        "Bitte mindestens einen Sensor oder ein Gerät zuordnen.",
      );
    try {
      await add.mutateAsync({
        tentId,
        name,
        baseUrl: url,
        token,
        sensors: sensors as Record<string, string>,
        actuators: acts as Record<string, string>,
        dimmableLight: dimmable,
        camera,
      });
      onDone();
    } catch (e) {
      Alert.alert("Nicht möglich", (e as Error).message);
    }
  };
  const pick = (cur: string | undefined, id: string) =>
    cur === id ? undefined : id;
  const chip = (
    label: string,
    active: boolean,
    onPress: () => void,
    key: string,
  ) => (
    <TouchableOpacity
      key={key}
      onPress={onPress}
      className="rounded-full px-3 py-2 border"
      style={[
        {},
        { borderColor: active ? colors.primary : colors.border },
        active ? { backgroundColor: colors.primary } : undefined,
      ]}
    >
      <Text
        className={active ? undefined : "text-foreground"}
        style={[
          { fontSize: 12 },
          active
            ? colors.foreground
              ? { color: colors.foreground }
              : undefined
            : undefined,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="gap-3">
      <Text className="text-sm text-muted">
        Für Geräte, die schon in Home Assistant laufen (Shelly, Tuya, AC
        Infinity, Zigbee …). Die Adresse muss aus dem Internet per https
        erreichbar sein (z. B. Nabu Casa). Den Token erstellst du in Home
        Assistant unter Profil → Sicherheit → „Langlebige Zugriffstoken“.
      </Text>
      <Text className="text-xs font-semibold text-muted">
        Home-Assistant-Adresse
      </Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        className="bg-surface rounded-xl p-3 text-foreground border border-border"
        placeholder="https://xyz.ui.nabu.casa"
        placeholderTextColor={colors.muted}
      />
      <Text className="text-xs font-semibold text-muted">Zugriffstoken</Text>
      <TextInput
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        className="bg-surface rounded-xl p-3 text-foreground border border-border"
      />
      <TouchableOpacity
        testID="ha-test"
        className="bg-primary rounded-xl p-4 items-center"
        onPress={connect}
        disabled={test.isPending}
      >
        {test.isPending ? (
          <ActivityIndicator color={colors.foreground} />
        ) : (
          <Text className="text-foreground font-bold">Verbindung testen</Text>
        )}
      </TouchableOpacity>

      {entities ? (
        <>
          <Text className="text-sm text-foreground">
            ✅ Verbunden – {entities.length} Entitäten. Tippe an, was wozu
            gehört:
          </Text>
          <Text className="text-xs font-semibold text-muted">Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={80}
            className="bg-surface rounded-xl p-3 text-foreground border border-border"
          />
          {metricRows.map(({ m, c }) => (
            <View key={m} className="gap-1">
              <Text className="text-sm text-foreground">
                {METRIC_INFO[m].label}
                {sensors[m] ? " ✓" : ""}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {c.map((e) =>
                  chip(
                    `${e.name} (${e.state}${e.unit ? ` ${e.unit}` : ""})`,
                    sensors[m] === e.entity_id,
                    () =>
                      setSensors({
                        ...sensors,
                        [m]: pick(sensors[m], e.entity_id),
                      }),
                    e.entity_id,
                  ),
                )}
              </View>
            </View>
          ))}
          {actRows.map(({ a, c }) => (
            <View key={a} className="gap-1">
              <Text className="text-sm text-foreground">
                {ACTUATOR_LABEL[a]}
                {acts[a] ? " ✓" : ""}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {c.map((e) =>
                  chip(
                    e.name,
                    acts[a] === e.entity_id,
                    () => setActs({ ...acts, [a]: pick(acts[a], e.entity_id) }),
                    e.entity_id,
                  ),
                )}
              </View>
            </View>
          ))}
          {cameras.length ? (
            <View className="gap-1">
              <Text className="text-sm text-foreground">
                📷 Zelt-Kamera (KI-Beobachtung){camera ? " ✓" : ""}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {cameras.map((e) =>
                  chip(
                    e.name,
                    camera === e.entity_id,
                    () =>
                      setCamera(camera === e.entity_id ? null : e.entity_id),
                    e.entity_id,
                  ),
                )}
              </View>
            </View>
          ) : null}
          {acts.light ? (
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-foreground flex-1">
                Licht ist dimmbar
              </Text>
              <Switch value={dimmable} onValueChange={setDimmable} />
            </View>
          ) : null}
          <TouchableOpacity
            testID="ha-save"
            className="bg-primary rounded-xl p-4 items-center"
            onPress={save}
            disabled={add.isPending}
          >
            {add.isPending ? (
              <ActivityIndicator color={colors.foreground} />
            ) : (
              <Text className="text-foreground font-bold">
                Home Assistant verbinden
              </Text>
            )}
          </TouchableOpacity>
          <Text className="text-xs text-muted">
            Dosierpumpen gehen nicht über Home Assistant (zu ungenau) – dafür
            eigene Hardware nutzen.
          </Text>
        </>
      ) : null}
    </View>
  );
}
