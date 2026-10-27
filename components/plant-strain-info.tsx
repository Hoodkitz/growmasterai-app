import { Linking, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import {
  getRatioLabel,
  getThcLabel,
  getTypeColor,
  getTypeLabel,
  type Strain,
} from "@/lib/strains-data";

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="flex-row justify-between gap-4">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm text-foreground flex-1 text-right">{value}</Text>
    </View>
  );
}

/** Breeder data and hints for the strain a plant was created from. */
export function PlantStrainInfo({ strain }: { strain: Strain }) {
  const colors = useColors();
  return (
    <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-foreground">
          🌿 Sorte: {strain.name}
        </Text>
        {strain.type ? (
          <Text
            className="text-xs font-semibold"
            style={{ color: getTypeColor(strain.type) }}
          >
            {getTypeLabel(strain.type)}
          </Text>
        ) : null}
      </View>
      <View className="gap-1">
        <Row label="Züchter" value={strain.breeder} />
        <Row label="Genetik" value={strain.genetics} />
        <Row label="Anteil" value={getRatioLabel(strain)} />
        <Row label="THC" value={getThcLabel(strain)} />
        <Row label="Blütezeit (indoor)" value={strain.floweringText} />
        <Row label="Ertrag indoor" value={strain.yieldIndoor} />
        <Row label="Ertrag outdoor" value={strain.yieldOutdoor} />
        <Row label="Höhe indoor" value={strain.heightIndoor} />
        <Row label="Höhe outdoor" value={strain.heightOutdoor} />
        <Row label="Ernte outdoor" value={strain.harvestOutdoor} />
        <Row label="Aroma" value={strain.flavours?.join(", ")} />
      </View>
      {strain.tips?.length ? (
        <View className="gap-1">
          <Text className="text-sm font-semibold text-foreground">
            💡 Tipps zur Sorte
          </Text>
          {strain.tips.map((tip, i) => (
            <Text key={i} className="text-sm text-foreground">
              • {tip}
            </Text>
          ))}
        </View>
      ) : null}
      <TouchableOpacity
        onPress={() => Linking.openURL(strain.source).catch(() => {})}
      >
        <Text className="text-xs font-medium" style={{ color: colors.primary }}>
          Angaben laut {strain.breeder} (Quelle öffnen)
        </Text>
      </TouchableOpacity>
    </View>
  );
}
