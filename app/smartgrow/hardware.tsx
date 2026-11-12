import { useState } from "react";
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Chips } from "@/components/smartgrow/chips";
import { buildRemedyLink, trackAffiliateClick } from "@/lib/affiliates";
import { HARDWARE_PATHS, type HwPath } from "@/shared/smartgrow/hardware";
import { GROW_PRODUCTS, PRODUCT_CATEGORIES } from "@/shared/smartgrow/products";
import { ACTUATOR_LABEL, METRIC_INFO } from "@/shared/smartgrow/types";

/** Hardware-Ratgeber: welche Geräte die KI steuern kann und wie man sie installiert. */
export default function HardwareGuide() {
  const router = useRouter();
  const [pathId, setPathId] = useState<string>("ha");
  const path = HARDWARE_PATHS.find((p) => p.id === pathId);
  const isAffiliate = buildRemedyLink("x").isAffiliate;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48 }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary">‹ Zurück</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">
          Hardware für Smart Grow
        </Text>
        <Text className="text-sm text-muted">
          Alles hier kann die KI lesen bzw. schalten. Du kannst die Wege auch
          mischen (z. B. Home Assistant fürs Klima und ESP32 für die Dosierung).
        </Text>
        <Chips
          options={HARDWARE_PATHS.map((p): { id: string; label: string } => ({
            id: p.id,
            label:
              p.id === "ha"
                ? "Fertige Geräte"
                : p.id === "diy"
                  ? "ESP32 selbst bauen"
                  : "Kamera",
          })).concat([{ id: "shop", label: "Zubehör & Dünger" }])}
          value={pathId}
          onChange={setPathId}
          testIDPrefix="hw"
        />

        {path ? (
          <PathView path={path} isAffiliate={isAffiliate} />
        ) : (
          <ProductsView isAffiliate={isAffiliate} />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function PathView({
  path,
  isAffiliate,
}: {
  path: HwPath;
  isAffiliate: boolean;
}) {
  return (
    <>
      <View className="bg-surface rounded-2xl p-4 border border-border gap-1">
        <Text className="text-lg font-bold text-foreground">{path.title}</Text>
        <Text className="text-xs text-muted">{path.level}</Text>
        <Text className="text-sm text-foreground">{path.summary}</Text>
      </View>

      <Text className="text-base font-bold text-foreground">Einkaufsliste</Text>
      {path.items.map((it) => {
        const link = buildRemedyLink(it.searchTerm, undefined, it.asin);
        const what = [
          ...(it.metrics ?? []).map((m) => METRIC_INFO[m].label),
          ...(it.actuators ?? []).map((a) => ACTUATOR_LABEL[a]),
        ];
        return (
          <View
            key={it.id}
            className="bg-surface rounded-xl p-3 border border-border gap-1"
          >
            <Text className="text-sm font-bold text-foreground">{it.name}</Text>
            <Text className="text-xs text-muted">{it.price}</Text>
            <Text className="text-sm text-foreground">{it.role}</Text>
            {what.length ? (
              <Text className="text-xs text-muted">
                In der App: {what.join(", ")}
              </Text>
            ) : null}
            {it.note ? (
              <Text className="text-xs text-foreground">ℹ️ {it.note}</Text>
            ) : null}
            <TouchableOpacity
              accessibilityRole="link"
              className="self-start mt-1 rounded-lg px-3 py-2 bg-primary"
              onPress={() => {
                trackAffiliateClick({
                  partnerId: "amazon",
                  productType: "equipment",
                  productName: it.name,
                });
                Linking.openURL(link.url).catch(() => {});
              }}
            >
              <Text className="text-xs font-semibold text-white">
                {it.asin ? "Bei Amazon ansehen" : "Bei Amazon suchen"}
                {link.isAffiliate ? " (Anzeige)" : ""}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <Text className="text-base font-bold text-foreground">
        Installation Schritt für Schritt
      </Text>
      <View className="bg-surface rounded-2xl p-4 border border-border gap-2">
        {path.steps.map((s, i) => (
          <Text key={i} className="text-sm text-foreground">
            {i + 1}. {s}
          </Text>
        ))}
      </View>

      <Text className="text-base font-bold text-foreground">⚠️ Sicherheit</Text>
      <View className="rounded-2xl p-4 gap-2 border border-border">
        {path.safety.map((s, i) => (
          <Text key={i} className="text-sm text-foreground">
            • {s}
          </Text>
        ))}
      </View>
      <Text className="text-xs text-muted">
        Preise sind ungefähre Richtwerte. Produktnamen sind Beispiele, die Links
        führen zur Amazon-Suche
        {isAffiliate
          ? " (Partnerlinks: wir erhalten ggf. eine Provision, für dich ändert sich der Preis nicht)"
          : ""}
        .
      </Text>
    </>
  );
}

/** Zubehör- und Dünger-Empfehlungen nach Kategorie. */
function ProductsView({ isAffiliate }: { isAffiliate: boolean }) {
  const [cat, setCat] = useState(PRODUCT_CATEGORIES[0]);
  return (
    <>
      <Text className="text-sm text-muted">
        Bewährte Produkte von Grow-Marken – zum Messen, Düngen, Klima, Ernte und
        Schutz. Wähle eine Kategorie:
      </Text>
      <Chips
        options={PRODUCT_CATEGORIES.map((c) => ({ id: c, label: c }))}
        value={cat}
        onChange={setCat}
        testIDPrefix="cat"
      />
      {GROW_PRODUCTS.filter((p) => p.category === cat).map((p) => {
        const link = buildRemedyLink(p.searchTerm, undefined, p.asin);
        return (
          <View
            key={p.name}
            className="bg-surface rounded-xl p-3 border border-border gap-1"
          >
            <Text className="text-sm font-bold text-foreground">{p.name}</Text>
            <Text className="text-xs text-muted">
              {p.brand} · {p.priceRange}
            </Text>
            <Text className="text-sm text-foreground">{p.purpose}</Text>
            <TouchableOpacity
              accessibilityRole="link"
              className="self-start mt-1 rounded-lg px-3 py-2 bg-primary"
              onPress={() => {
                trackAffiliateClick({
                  partnerId: "amazon",
                  productType: "equipment",
                  productName: p.name,
                });
                Linking.openURL(link.url).catch(() => {});
              }}
            >
              <Text className="text-xs font-semibold text-white">
                {p.asin ? "Bei Amazon ansehen" : "Bei Amazon suchen"}
                {link.isAffiliate ? " (Anzeige)" : ""}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
      <Text className="text-xs text-muted">
        Preise sind ungefähre Richtwerte, Produktnamen Beispiele
        {isAffiliate
          ? " (Partnerlinks: wir erhalten ggf. eine Provision, für dich ändert sich der Preis nicht)"
          : ""}
        .
      </Text>
    </>
  );
}
