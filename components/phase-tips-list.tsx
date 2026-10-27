import { Linking, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import {
  PhaseTip,
  TIP_VIDEO_CHANNEL,
  formatTimestamp,
  tipVideoUrl,
} from "@/lib/phase-tips";

/** Tips with a link to the exact moment in the source video. */
export function PhaseTipsList({ tips }: { tips: PhaseTip[] }) {
  const colors = useColors();
  if (tips.length === 0) return null;
  return (
    <View className="gap-3">
      {tips.map((tip) => (
        <View
          key={tip.id}
          className="bg-background rounded-xl p-3 border border-border gap-1"
        >
          <Text className="text-sm font-semibold text-foreground">
            {tip.topic}
          </Text>
          <Text className="text-sm text-foreground">{tip.text}</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(tipVideoUrl(tip)).catch(() => {})}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: colors.primary }}
            >
              ▶ {TIP_VIDEO_CHANNEL}, ab {formatTimestamp(tip.start)}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
      <Text className="text-xs text-muted">
        Zusammenfassung der genannten Videos, ohne Gewähr. Beachte die
        Rechtslage in deinem Land.
      </Text>
    </View>
  );
}
