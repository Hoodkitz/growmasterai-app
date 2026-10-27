import { Linking, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import {
  PhaseTip,
  TIP_VIDEO_CHANNEL,
  TipPhase,
  formatTimestamp,
  tipVideoUrl,
  tipsForPhase,
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
              ▶ {tip.channel ?? TIP_VIDEO_CHANNEL}, ab{" "}
              {formatTimestamp(tip.start)}
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

/** Tips for one phase, from the server knowledge base; falls back to the bundled tips offline. */
export function PhaseTipsForPhase({ phase }: { phase: TipPhase }) {
  const query = trpc.knowledge.forPhase.useQuery(
    { phase },
    { staleTime: 10 * 60 * 1000 },
  );
  const fromServer: PhaseTip[] = (query.data ?? []).map((e) => ({
    id: e.id,
    phases: e.phases as TipPhase[],
    topic: e.topic,
    text: e.text,
    videoId: e.videoId,
    start: e.start,
    channel: e.channel,
  }));
  return (
    <PhaseTipsList
      tips={fromServer.length > 0 ? fromServer : tipsForPhase(phase)}
    />
  );
}
