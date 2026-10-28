/**
 * Privacy policy text, single source for the in-app screen (app/legal.tsx), legal/privacy.md and the
 * public page (growmasterai-legal/privacy.html), see scripts/export-privacy.ts.
 * Draft based on what the code actually does; have it reviewed before the store release.
 */

export interface PrivacySection {
  title: string;
  /** Paragraphs. */
  text?: string[];
  /** Bullet points shown after the paragraphs. */
  bullets?: string[];
}

export const PRIVACY_UPDATED = "Oktober 2026";
export const PRIVACY_CONTACT = "team@growmaster.app";

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    title: "1. Verantwortlicher",
    text: [
      "Julien Nicolas Paarmann, Klausingring 19, 13627 Berlin, Deutschland. E-Mail: team@growmaster.app.",
    ],
  },
  {
    title: "2. Für wen die App ist",
    text: [
      "GrowMaster AI richtet sich an Erwachsene ab 18 Jahren und begleitet den legalen Eigenanbau von Pflanzen. Wir verkaufen kein Cannabis und vermitteln keinen Verkauf.",
    ],
  },
  {
    title: "3. Welche Daten wir verarbeiten",
    bullets: [
      "Konto: E-Mail-Adresse, optional Name. Bei der Anmeldung mit E-Mail ein Passwort-Hash (kein Klartext), bei der Anmeldung mit Google die von Google übermittelte Kennung, E-Mail-Adresse und Name.",
      "Inhalte, die Sie anlegen: Pflanzen, Journal, Messwerte, Notizen und Fotos.",
      "Diagnosen und Coach-Chats: hochgeladene Fotos und Texte sowie die Antworten.",
      "Community: Beiträge, Kommentare, Likes, Nachrichten und die Teilnahme an Verlosungen.",
      "Abo-Status (Stufe, Ablaufdatum) und Ihre App-Nutzer-Kennung bei RevenueCat.",
      "Push-Token, wenn Sie Benachrichtigungen erlauben.",
      "Technische Daten: Gerätetyp, Betriebssystem, App-Version, IP-Adresse beim Zugriff auf den Server und Fehlerberichte.",
    ],
  },
  {
    title: "4. Zwecke und Rechtsgrundlagen",
    text: [
      "Wir verarbeiten Ihre Daten, um die App und Ihr Konto bereitzustellen (Art. 6 Abs. 1 lit. b DSGVO), für Sicherheit, Fehlerbehebung und Missbrauchsschutz (lit. f), für optionale Funktionen wie Push-Benachrichtigungen auf Grundlage Ihrer Einwilligung, die Sie jederzeit widerrufen können (lit. a), und zur Erfüllung gesetzlicher Pflichten (lit. c).",
    ],
  },
  {
    title: "5. KI-Dienste",
    text: [
      "Für Pflanzen-Diagnose und Grow-Coach senden wir Ihre Fotos und Texte an die Gemini-Schnittstelle von Google. Dabei kann eine Übermittlung in Länder außerhalb der EU erfolgen, zum Beispiel in die USA, auf Grundlage der vertraglichen Garantien des Anbieters.",
      "Die Ergebnisse sind Hinweise und keine fachliche Beratung. Laden Sie bitte keine Fotos hoch, auf denen Personen erkennbar sind.",
    ],
  },
  {
    title: "6. Anmeldung mit Google",
    text: [
      "Sie können sich optional mit Ihrem Google-Konto anmelden. Google übermittelt uns dann Ihre Kennung, E-Mail-Adresse und Ihren Namen. Es gilt zusätzlich die Datenschutzerklärung von Google.",
    ],
  },
  {
    title: "7. Abonnements",
    text: [
      "Käufe laufen über Google Play. Zur Verwaltung der Abonnements nutzen wir RevenueCat; dorthin werden Ihre App-Nutzer-Kennung und der Abo-Status übermittelt. Zahlungsdaten wie Kartennummern erhalten wir nicht.",
    ],
  },
  {
    title: "8. Push-Benachrichtigungen",
    text: [
      "Wenn Sie Benachrichtigungen erlauben, speichern wir ein Push-Token und senden Mitteilungen über den Expo-Push-Dienst. Sie können das jederzeit in den Einstellungen der App oder Ihres Geräts abschalten.",
    ],
  },
  {
    title: "9. Fehlerberichte",
    text: [
      "Bei Abstürzen kann die App einen Fehlerbericht an Sentry senden, ohne Name oder E-Mail-Adresse. Rechtsgrundlage ist unser Interesse an einer stabilen App (Art. 6 Abs. 1 lit. f DSGVO).",
    ],
  },
  {
    title: "10. Hosting",
    text: [
      "Die Server der App werden bei einem Cloud-Anbieter (Railway) betrieben. Dort werden Ihre Konto- und Anwendungsdaten gespeichert.",
    ],
  },
  {
    title: "11. Links zu Shops",
    text: [
      "Produktempfehlungen (zum Beispiel Links zu Amazon) sind als Anzeige gekennzeichnet. Wir erhalten bei einem Kauf gegebenenfalls eine Provision, für Sie ändert sich der Preis nicht. Beim Öffnen eines Links verlassen Sie die App, dort gilt die Datenschutzerklärung des Anbieters.",
    ],
  },
  {
    title: "12. Verlosungen",
    text: [
      "Die Teilnahme ist kostenlos und ab 18 Jahren möglich. Wir speichern Ihre Teilnahme bis zur Ziehung und Abwicklung des Gewinns. Gewinner werden über die App oder per E-Mail informiert.",
    ],
  },
  {
    title: "13. Speicherdauer und Löschung",
    text: [
      "Wir speichern Ihre Daten, solange Ihr Konto besteht. In der App löschen Sie Ihr Konto unter Einstellungen > Konto > Konto löschen. Dabei werden alle damit gespeicherten Daten gelöscht: Pflanzen, Journal, Diagnosen, Beiträge, Nachrichten, Verlosungsteilnahmen, Push-Token und Zugangsdaten.",
      "Zurück bleibt ein anonymer Löschvermerk (eine mit einem geheimen Schlüssel erzeugte Kennung ohne Name und E-Mail-Adresse, die sich nicht auf Ihre Daten zurückrechnen lässt), damit alte Anmeldungen das Konto nicht neu anlegen können. Reste in Sicherungen und Server-Protokollen können vorübergehend erhalten bleiben. Sie können die Löschung auch per E-Mail an team@growmaster.app verlangen.",
    ],
  },
  {
    title: "14. Ihre Rechte",
    text: [
      "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie auf Widerruf erteilter Einwilligungen. Sie können sich bei einer Datenschutzaufsichtsbehörde beschweren, zum Beispiel bei der Berliner Beauftragten für Datenschutz und Informationsfreiheit.",
      "Zur Ausübung Ihrer Rechte schreiben Sie an team@growmaster.app.",
    ],
  },
];
