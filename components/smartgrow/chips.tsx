import { Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/use-colors";

/** Auswahl als umbrechende Chips (kein seitliches Scrollen). */
export function Chips({
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  options: { id: string; label: string }[];
  value: string | string[];
  onChange: (id: string) => void;
  testIDPrefix?: string;
}) {
  const colors = useColors();
  const selected = (id: string) =>
    Array.isArray(value) ? value.includes(id) : value === id;
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => (
        <TouchableOpacity
          key={o.id}
          testID={testIDPrefix ? `${testIDPrefix}-${o.id}` : undefined}
          onPress={() => onChange(o.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: selected(o.id) }}
          className="rounded-full px-3 py-2 border"
          style={{
            backgroundColor: selected(o.id) ? colors.primary : "transparent",
            borderColor: selected(o.id) ? colors.primary : colors.border,
          }}
        >
          <Text
            className={selected(o.id) ? undefined : "text-foreground"}
            style={[
              { fontSize: 13, fontWeight: "600" },
              selected(o.id)
                ? { color: colors.foreground }
                : colors.foreground
                  ? { color: colors.foreground }
                  : undefined,
            ]}
          >
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
