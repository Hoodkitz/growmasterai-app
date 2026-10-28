# Play-Store-Build (Store-Modus)

Google Play erlaubt keine Apps, die den Verkauf von Cannabis vermitteln (Restricted Content, abgerufen 2026-10-28).
Deshalb gibt es einen Store-Modus: `EXPO_PUBLIC_STORE_MODE=1` zur Build-Zeit.

## Was im Store-Modus ausgeblendet ist

- Sorten: "Samen suchen" und Link zur Hersteller-Seite (die Quelle bleibt als Text)
- Community: Radar (Shops, Headshops, Clubs), Auktionen, Empfohlene Produkte (Händler)
- Startseite: Shop-Kachel; Routen `/marketplace` und `/vendor-portal` leiten auf die Startseite um

## Was bleibt

Diagnose, Coach, Wissen, Pflanzen, Journal, Tools, News, Rangliste, Zubehör-Links (als Anzeige gekennzeichnet) und
kostenlose Verlosungen (eine Teilnahme pro Nutzer, feste Laufzeit und Teilnehmerzahl).

## Bauen

- EAS: `eas build -p android --profile store` (AAB, Profil `store`)
- Lokal: `EXPO_PUBLIC_STORE_MODE=1 ./gradlew :app:bundleRelease` im Ordner `android/`
  (Ausgabe `app/build/outputs/bundle/release/app-release.aab`, Signatur wie bei der APK über `GM_KEYSTORE`)

Der normale Build (ohne Variable) bleibt unverändert.

## Noch offen vor der Einreichung

Siehe PLAY_COMPLIANCE.md im Workspace: Altersfreigabe 18+, Data Safety, Datenschutz-URL, Konto-Löschung,
Closed Test (neue private Konten), Verlosungs-Bedingungen (Mindestens: feste Gewinnerzahl, Frist, Ziehungsdatum).
