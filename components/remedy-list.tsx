import { Linking, Text, TouchableOpacity, View } from "react-native";
import { buildRemedyLink, trackAffiliateClick } from "@/lib/affiliates";
import type { Remedy } from "@/shared/remedies";

/** Product suggestions with Amazon links; the affiliate tag is added only if configured. */
export function RemedyList({
  remedies,
  title,
}: {
  remedies: Remedy[];
  title: string;
}) {
  if (remedies.length === 0) return null;
  const isAffiliate = buildRemedyLink("x").isAffiliate;
  return (
    <View className="mt-2 bg-surface border border-border rounded-xl p-3 gap-3">
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      {remedies.map((remedy) => {
        const link = buildRemedyLink(remedy.searchTerm);
        return (
          <View key={remedy.name} className="gap-1 pb-2 border-b border-border">
            <Text className="text-sm font-semibold text-foreground">
              {remedy.name}
            </Text>
            {remedy.purpose ? (
              <Text className="text-xs text-muted">{remedy.purpose}</Text>
            ) : null}
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel={`${remedy.name} bei Amazon ansehen${link.isAffiliate ? " (Anzeige)" : ""}`}
              className="bg-primary rounded-lg py-2 items-center mt-1"
              onPress={() => {
                trackAffiliateClick({
                  partnerId: "amazon",
                  productType: "general",
                  productName: remedy.name,
                });
                Linking.openURL(link.url).catch(() => {});
              }}
            >
              <Text className="text-xs font-semibold text-white">
                Bei Amazon ansehen{link.isAffiliate ? " (Anzeige)" : ""}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
      <Text className="text-xs text-muted">
        {isAffiliate
          ? "Hinweis: Links zu Amazon sind Affiliate-Links (Werbung). Als Amazon-Partner verdienen wir an qualifizierten Verkäufen, für dich entstehen keine Mehrkosten. "
          : ""}
        Vorschläge ohne Garantie, bitte Anwendungshinweise beachten.
      </Text>
    </View>
  );
}
