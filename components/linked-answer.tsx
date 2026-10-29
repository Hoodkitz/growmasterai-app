import { Linking, Text } from "react-native";
import { buildRemedyLink, trackAffiliateClick } from "@/lib/affiliates";
import {
  splitAnswerWithLinks,
  type AnswerSegment,
} from "@/shared/inline-links";
import { productsForRemedy, type Remedy } from "@/shared/remedies";

/** Renders **bold** markers from the model as real bold text instead of raw asterisks. */
function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
    /^\*\*[^*]+\*\*$/.test(chunk) ? (
      <Text key={i} style={{ fontWeight: "700" }}>
        {chunk.slice(2, -2)}
      </Text>
    ) : (
      chunk
    ),
  );
}

/** Coach answer with product names as tappable Amazon links right in the text. */
export function LinkedAnswer({
  answer,
  remedies,
  segments,
  className,
  linkColor,
}: {
  answer: string;
  remedies: Remedy[];
  segments?: AnswerSegment[];
  className?: string;
  linkColor: string;
}) {
  const parts = segments ?? splitAnswerWithLinks(answer, remedies);
  return (
    <Text className={className}>
      {parts.map((part, i) => {
        if (part.remedyIndex === undefined) {
          return <Text key={i}>{renderBold(part.text)}</Text>;
        }
        const remedy = remedies[part.remedyIndex];
        const product = productsForRemedy(remedy.name)[0];
        const link = buildRemedyLink(
          remedy.searchTerm,
          undefined,
          product?.asin,
        );
        return (
          <Text
            key={i}
            accessibilityRole="link"
            style={{ color: linkColor, textDecorationLine: "underline" }}
            onPress={() => {
              trackAffiliateClick({
                partnerId: "amazon",
                productType: "general",
                productName: product?.label ?? remedy.name,
              });
              Linking.openURL(link.url).catch(() => {});
            }}
          >
            {part.text}
            {link.isAffiliate ? " (Anzeige)" : ""}
          </Text>
        );
      })}
    </Text>
  );
}
