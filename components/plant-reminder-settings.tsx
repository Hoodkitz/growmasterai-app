import { Switch, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import type { ReminderSettings } from "@/lib/plant-schedule";

function Stepper({
  value,
  min,
  max,
  unit,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <TouchableOpacity
        accessibilityLabel="weniger"
        className="w-8 h-8 rounded-full bg-background border border-border items-center justify-center"
        onPress={() => onChange(Math.max(min, value - 1))}
      >
        <Text className="text-foreground">−</Text>
      </TouchableOpacity>
      <Text className="text-sm text-foreground w-24 text-center">
        alle {value} {unit}
      </Text>
      <TouchableOpacity
        accessibilityLabel="mehr"
        className="w-8 h-8 rounded-full bg-background border border-border items-center justify-center"
        onPress={() => onChange(Math.min(max, value + 1))}
      >
        <Text className="text-foreground">+</Text>
      </TouchableOpacity>
    </View>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
  children,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View className="gap-2 pt-3 border-t border-border">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground">{label}</Text>
          {hint ? <Text className="text-xs text-muted">{hint}</Text> : null}
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ true: colors.primary }}
        />
      </View>
      {value ? children : null}
    </View>
  );
}

/** Per-plant reminder switches; the caller reschedules the notifications on change. */
export function PlantReminderSettings({
  settings,
  onChange,
  permissionDenied,
}: {
  settings: ReminderSettings;
  onChange: (next: ReminderSettings) => void;
  permissionDenied: boolean;
}) {
  const colors = useColors();
  const set = (patch: Partial<ReminderSettings>) =>
    onChange({ ...settings, ...patch });
  return (
    <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">
            🔔 Erinnerungen
          </Text>
          <Text className="text-xs text-muted">
            Benachrichtigungen auf diesem Gerät, abgestimmt auf die Phase deiner
            Pflanze.
          </Text>
        </View>
        <Switch
          value={settings.enabled}
          onValueChange={(enabled) => set({ enabled })}
          trackColor={{ true: colors.primary }}
        />
      </View>
      {permissionDenied ? (
        <Text className="text-xs text-error">
          Benachrichtigungen sind für die App ausgeschaltet. Erlaube sie in den
          Android-Einstellungen, damit die Erinnerungen ankommen.
        </Text>
      ) : null}
      {settings.enabled ? (
        <>
          <ToggleRow
            label="Gießen"
            hint="Zählt ab dem letzten „Gegossen“-Eintrag."
            value={settings.watering}
            onChange={(watering) => set({ watering })}
          >
            <Stepper
              value={settings.wateringEveryDays}
              min={1}
              max={14}
              unit="Tage"
              onChange={(wateringEveryDays) => set({ wateringEveryDays })}
            />
          </ToggleRow>
          <ToggleRow
            label="Düngen"
            hint="Zählt ab dem letzten „Gedüngt“-Eintrag."
            value={settings.feeding}
            onChange={(feeding) => set({ feeding })}
          >
            <Stepper
              value={settings.feedingEveryDays}
              min={2}
              max={21}
              unit="Tage"
              onChange={(feedingEveryDays) => set({ feedingEveryDays })}
            />
          </ToggleRow>
          <ToggleRow
            label="Umtopfen / Wurzeln prüfen"
            hint="Nach 2, 4 und 6 Wochen (nur bei Keimling/Wachstum)."
            value={settings.repotCheck}
            onChange={(repotCheck) => set({ repotCheck })}
          />
          <ToggleRow
            label="Blüte einleiten"
            hint="Nach 4 Wochen, wenn die Pflanze noch wächst (nicht für Autoflowers)."
            value={settings.flip}
            onChange={(flip) => set({ flip })}
          />
          <ToggleRow
            label="Ernte prüfen"
            hint="Aus der Blütezeit der Sorte (Hersteller) berechnet. Braucht „Blüte starten“."
            value={settings.harvest}
            onChange={(harvest) => set({ harvest })}
          />
          <View className="flex-row items-center justify-between pt-3 border-t border-border">
            <Text className="text-sm text-foreground">Uhrzeit</Text>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-background border border-border items-center justify-center"
                onPress={() => set({ hour: (settings.hour + 23) % 24 })}
              >
                <Text className="text-foreground">−</Text>
              </TouchableOpacity>
              <Text className="text-sm text-foreground w-16 text-center">
                {String(settings.hour).padStart(2, "0")}:00 Uhr
              </Text>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-background border border-border items-center justify-center"
                onPress={() => set({ hour: (settings.hour + 1) % 24 })}
              >
                <Text className="text-foreground">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}
