import { Linking, Text, TouchableOpacity, View } from "react-native";
import { buildRemedyLink, trackAffiliateClick } from "@/lib/affiliates";
import { productsForRemedy, type Remedy } from "@/shared/remedies";

/** One button per chosen product, or a single Amazon search if none was chosen. */
export function RemedyLinks({
  remedy,
  compact = false,
}: {
  remedy: Remedy;
  compact?: boolean;
}) {
  const products = productsForRemedy(remedy.name);
  const options: { label?: string; asin?: string }[] =
    products.length > 0 ? products : [{}];
  return (
    <View className="gap-2 mt-1">
      {options.map((product, i) => {
        const link = buildRemedyLink(
          remedy.searchTerm,
          undefined,
          product.asin,
        );
        const text =
          product.label ??
          `Bei Amazon ansehen${link.isAffiliate ? " (Anzeige)" : ""}`;
        return (
          <TouchableOpacity
            key={`${product.asin ?? "search"}-${i}`}
            accessibilityRole="link"
            accessibilityLabel={`${product.label ?? remedy.name} bei Amazon ansehen${link.isAffiliate ? " (Anzeige)" : ""}`}
            className={`bg-primary rounded-xl items-center ${compact ? "py-2" : "py-2.5"} px-3`}
            onPress={() => {
              trackAffiliateClick({
                partnerId: "amazon",
                productType: "general",
                productName: product.label ?? remedy.name,
              });
              Linking.openURL(link.url).catch(() => {});
            }}
          >
            <Text
              className={`${compact ? "text-xs" : "text-sm"} font-semibold text-white text-center`}
            >
              {text}
              {product.label && link.isAffiliate ? " (Anzeige)" : ""}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

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
      {remedies.map((remedy) => (
        <View key={remedy.name} className="gap-1 pb-2 border-b border-border">
          <Text className="text-sm font-semibold text-foreground">
            {remedy.name}
          </Text>
          {remedy.purpose ? (
            <Text className="text-xs text-muted">{remedy.purpose}</Text>
          ) : null}
          <RemedyLinks remedy={remedy} compact />
        </View>
      ))}
      <Text className="text-xs text-muted">
        {isAffiliate
          ? "Hinweis: Links zu Amazon sind Affiliate-Links (Werbung). Als Amazon-Partner verdienen wir an qualifizierten Verkäufen, für dich entstehen keine Mehrkosten. "
          : ""}
        Vorschläge ohne Garantie, bitte Anwendungshinweise beachten.
      </Text>
    </View>
  );
}
