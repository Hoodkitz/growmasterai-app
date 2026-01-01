import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type LegalSection = "imprint" | "privacy" | "terms";

export default function LegalScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeSection, setActiveSection] = useState<LegalSection>("imprint");

  const sections: { id: LegalSection; title: string; icon: string }[] = [
    { id: "imprint", title: "Impressum", icon: "📋" },
    { id: "privacy", title: "Datenschutz", icon: "🔒" },
    { id: "terms", title: "AGB", icon: "📜" },
  ];

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8 }}
        >
          <Text className="text-primary text-lg">← Zurück</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Rechtliches</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tab Navigation */}
      <View className="flex-row border-b border-border">
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            onPress={() => setActiveSection(section.id)}
            className={`flex-1 py-3 items-center ${
              activeSection === section.id ? "border-b-2 border-primary" : ""
            }`}
            style={activeSection === section.id ? { borderBottomColor: colors.primary } : {}}
          >
            <Text className="text-lg mb-1">{section.icon}</Text>
            <Text
              className={`text-sm ${
                activeSection === section.id ? "text-primary font-semibold" : "text-muted"
              }`}
            >
              {section.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-4">
        {activeSection === "imprint" && <ImprintContent />}
        {activeSection === "privacy" && <PrivacyContent />}
        {activeSection === "terms" && <TermsContent />}
      </ScrollView>
    </ScreenContainer>
  );
}

function ImprintContent() {
  return (
    <View className="gap-4">
      <Text className="text-2xl font-bold text-foreground">Impressum</Text>
      
      <Section title="Angaben gemäß § 5 TMG">
        <Text className="text-foreground leading-6">
          GrowMaster AI{"\n"}
          [Ihr vollständiger Name / Firmenname]{"\n"}
          [Straße und Hausnummer]{"\n"}
          [PLZ Ort]{"\n"}
          Deutschland
        </Text>
      </Section>

      <Section title="Kontakt">
        <Text className="text-foreground leading-6">
          Telefon: [Ihre Telefonnummer]{"\n"}
          E-Mail: support@growmaster.app{"\n"}
          Website: https://growmaster.app
        </Text>
      </Section>

      <Section title="Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV">
        <Text className="text-foreground leading-6">
          [Ihr vollständiger Name]{"\n"}
          [Adresse wie oben]
        </Text>
      </Section>

      <Section title="EU-Streitschlichtung">
        <Text className="text-foreground leading-6">
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{"\n\n"}
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL("https://ec.europa.eu/consumers/odr/")}>
          <Text className="text-primary underline">https://ec.europa.eu/consumers/odr/</Text>
        </TouchableOpacity>
      </Section>

      <Section title="Haftung für Inhalte">
        <Text className="text-foreground leading-6">
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.
        </Text>
      </Section>

      <Section title="Haftung für Links">
        <Text className="text-foreground leading-6">
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich.
        </Text>
      </Section>

      <Section title="Urheberrecht">
        <Text className="text-foreground leading-6">
          Die durch die Seitenbetreiber erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht. Downloads und Kopien sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
        </Text>
      </Section>

      <Text className="text-muted text-sm mt-4">Stand: Januar 2026</Text>
    </View>
  );
}

function PrivacyContent() {
  return (
    <View className="gap-4">
      <Text className="text-2xl font-bold text-foreground">Datenschutzerklärung</Text>
      
      <Section title="1. Datenschutz auf einen Blick">
        <Text className="text-foreground leading-6">
          Die folgenden Hinweise geben einen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie die GrowMaster AI App nutzen.
        </Text>
      </Section>

      <Section title="Datenerfassung">
        <Text className="text-foreground leading-6">
          <Text className="font-semibold">Wer ist verantwortlich?</Text>{"\n"}
          Die Datenverarbeitung erfolgt durch den App-Betreiber (siehe Impressum).{"\n\n"}
          
          <Text className="font-semibold">Welche Daten werden erfasst?</Text>{"\n"}
          • E-Mail-Adresse und Name bei Registrierung{"\n"}
          • Pflanzen-Daten und Journal-Einträge{"\n"}
          • Diagnose-Anfragen und Fotos{"\n"}
          • Community-Beiträge{"\n"}
          • Technische Daten (Gerätetyp, OS)
        </Text>
      </Section>

      <Section title="Ihre Rechte">
        <Text className="text-foreground leading-6">
          Sie haben jederzeit das Recht auf:{"\n"}
          • Auskunft über Ihre Daten{"\n"}
          • Berichtigung oder Löschung{"\n"}
          • Einschränkung der Verarbeitung{"\n"}
          • Datenübertragbarkeit{"\n"}
          • Widerruf erteilter Einwilligungen
        </Text>
      </Section>

      <Section title="Registrierung">
        <Text className="text-foreground leading-6">
          Bei der Registrierung werden erfasst:{"\n"}
          • E-Mail-Adresse{"\n"}
          • Name (optional){"\n"}
          • Profilbild (optional){"\n\n"}
          Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
        </Text>
      </Section>

      <Section title="Kamera und Fotos">
        <Text className="text-foreground leading-6">
          Die App benötigt Zugriff auf Ihre Kamera für:{"\n"}
          • Pflanzen-Diagnose{"\n"}
          • Journal-Fotos{"\n"}
          • Community-Beiträge{"\n\n"}
          Die Verarbeitung erfolgt nur nach Ihrer ausdrücklichen Einwilligung.
        </Text>
      </Section>

      <Section title="Zahlungsabwicklung">
        <Text className="text-foreground leading-6">
          Für Premium-Abonnements nutzen wir Apple/Google Zahlungsdienste. Wir erhalten keine Zahlungsdaten wie Kreditkartennummern.{"\n\n"}
          Wir nutzen RevenueCat zur Abo-Verwaltung.
        </Text>
      </Section>

      <Section title="KI-Dienste">
        <Text className="text-foreground leading-6">
          Für Pflanzen-Diagnose und Grow-Coach werden:{"\n"}
          • Hochgeladene Bilder analysiert{"\n"}
          • Chat-Nachrichten verarbeitet{"\n\n"}
          Die Verarbeitung erfolgt zur Bereitstellung der App-Funktionen.
        </Text>
      </Section>

      <Section title="Kontakt">
        <Text className="text-foreground leading-6">
          Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter:{"\n"}
          support@growmaster.app
        </Text>
      </Section>

      <Text className="text-muted text-sm mt-4">Stand: Januar 2026</Text>
    </View>
  );
}

function TermsContent() {
  return (
    <View className="gap-4">
      <Text className="text-2xl font-bold text-foreground">Allgemeine Geschäftsbedingungen</Text>
      
      <Section title="1. Geltungsbereich">
        <Text className="text-foreground leading-6">
          Diese AGB gelten für die Nutzung der GrowMaster AI App und alle damit verbundenen Dienste. Mit der Registrierung akzeptieren Sie diese AGB.
        </Text>
      </Section>

      <Section title="2. Leistungsbeschreibung">
        <Text className="text-foreground leading-6">
          <Text className="font-semibold">Free (kostenlos):</Text>{"\n"}
          • Bis zu 2 Pflanzen{"\n"}
          • 3 Diagnosen pro Tag{"\n"}
          • 5 Coach-Nachrichten pro Tag{"\n"}
          • Community (Lesen){"\n\n"}
          
          <Text className="font-semibold">Premium (4,99€/Monat):</Text>{"\n"}
          • Bis zu 10 Pflanzen{"\n"}
          • 15 Diagnosen pro Tag{"\n"}
          • 50 Coach-Nachrichten pro Tag{"\n"}
          • Vollständige Features{"\n"}
          • Werbefrei{"\n\n"}
          
          <Text className="font-semibold">Pro (9,99€/Monat):</Text>{"\n"}
          • Unbegrenzte Pflanzen{"\n"}
          • Unbegrenzte Diagnosen{"\n"}
          • Live-Kamera-Analyse{"\n"}
          • Direktnachrichten{"\n"}
          • Prioritäts-Support
        </Text>
      </Section>

      <Section title="3. Abonnement">
        <Text className="text-foreground leading-6">
          • Abschluss über Apple App Store oder Google Play{"\n"}
          • Automatische Verlängerung{"\n"}
          • Kündigung 24h vor Ablauf möglich{"\n"}
          • Kündigung über Store-Einstellungen
        </Text>
      </Section>

      <Section title="4. Widerrufsrecht">
        <Text className="text-foreground leading-6">
          Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen zu widerrufen. Das Widerrufsrecht erlischt bei digitalen Inhalten nach Beginn der Ausführung mit Ihrer Zustimmung.
        </Text>
      </Section>

      <Section title="5. Nutzungspflichten">
        <Text className="text-foreground leading-6">
          Es ist untersagt:{"\n"}
          • Illegale Nutzung{"\n"}
          • Falsche Angaben{"\n"}
          • Belästigung anderer Nutzer{"\n"}
          • Urheberrechtsverletzungen{"\n"}
          • Manipulation der App{"\n"}
          • Spam und Werbung
        </Text>
      </Section>

      <Section title="6. Community-Richtlinien">
        <Text className="text-foreground leading-6">
          Verboten sind:{"\n"}
          • Beleidigungen und Hassrede{"\n"}
          • Diskriminierung{"\n"}
          • Gewaltverherrlichung{"\n"}
          • Pornografische Inhalte{"\n\n"}
          Verstöße führen zur Sperrung.
        </Text>
      </Section>

      <Section title="7. Haftung">
        <Text className="text-foreground leading-6">
          KI-Diagnosen und Empfehlungen dienen nur zu Informationszwecken und ersetzen keine fachkundige Beratung. Wir übernehmen keine Haftung für Schäden durch das Befolgen von KI-Empfehlungen.
        </Text>
      </Section>

      <Section title="8. Anwendbares Recht">
        <Text className="text-foreground leading-6">
          Es gilt das Recht der Bundesrepublik Deutschland.
        </Text>
      </Section>

      <Text className="text-muted text-sm mt-4">Stand: Januar 2026</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      {children}
    </View>
  );
}
