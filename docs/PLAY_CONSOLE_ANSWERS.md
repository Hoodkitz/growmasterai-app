# Play Console: Antworten (Entwurf, Stand 2026-10-28)

Grundlage ist der Store-Build (`EXPO_PUBLIC_STORE_MODE=1`, Profil `store`, siehe PLAY_STORE_BUILD.md). Vor dem Absenden jede Antwort
gegen den aktuellen Wortlaut der Console prüfen; das hier ist ein Vorschlag aus dem Code, keine Rechtsberatung.

## App-Inhalte

| Feld                          | Antwort                                                                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App-Name                      | GrowMaster AI: Grow Assistent                                                                                                                                                                     |
| Kategorie                     | Lifestyle                                                                                                                                                                                         |
| Kostenlos/kostenpflichtig     | Kostenlos, In-App-Abos (Pro)                                                                                                                                                                      |
| Datenschutzerklärung          | https://hoodkitz.github.io/growmasterai-legal/privacy.html                                                                                                                                        |
| Kontakt                       | team@growmaster.app, https://growmaster.app                                                                                                                                                       |
| Zielgruppe                    | Nur Erwachsene (18+), nicht für Kinder                                                                                                                                                            |
| Anzeigen                      | Ja: gekennzeichnete Produktempfehlungen mit Partner-Links (Anzeige). Kein Werbenetzwerk, kein Tracking durch Dritte in der App                                                                    |
| Inhalts-Altersfreigabe (IARC) | Fragebogen ehrlich beantworten: Cannabis-/Drogenbezug (Anbau-Information, kein Verkauf), keine Gewalt, kein Glücksspiel mit Geldeinsatz, nutzergenerierte Inhalte (Community). Zu erwarten: ab 18 |
| Nachrichten/Community         | Nutzer können Beiträge und Nachrichten schreiben: Moderation und Meldefunktion prüfen, bevor die Frage "UGC" beantwortet wird                                                                     |
| Gewinnspiele                  | Kostenlose Teilnahme, feste Frist, ein Gewinner, Ziehung nach Ablauf (keine Geldeinsätze). Teilnahmebedingungen in der App sichtbar                                                               |
| Finanzfunktionen              | Keine                                                                                                                                                                                             |
| Gesundheit                    | Keine Gesundheits-App (Pflanzenpflege)                                                                                                                                                            |
| Regierungs-App                | Nein                                                                                                                                                                                              |
| Nachrichten-App               | Nein (News-Bereich zur Rechtslage mit Quellenangabe: "Nein" als News-App)                                                                                                                         |

## App-Zugang (Prüfer)

Die App funktioniert ohne Anmeldung (Gast). Anmeldung nötig für Community, Sync, Verlosungen. Für den Prüfer ein Testkonto
(E-Mail + Passwort) in der Console eintragen. Zugangsdaten gehören nicht in dieses Repo.

## Data Safety (Datensicherheit)

Alle Daten werden bei der Übertragung verschlüsselt (HTTPS). Nutzer können die Löschung anfordern: in der App (Einstellungen > Konto
löschen) und per E-Mail. Lösch-URL: https://hoodkitz.github.io/growmasterai-legal/delete-account.html

| Datentyp                                                                    | Erhoben                            | Weitergegeben                                   | Zweck                              | Optional         |
| --------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------- | ---------------------------------- | ---------------- |
| E-Mail-Adresse                                                              | Ja                                 | Nein                                            | App-Funktionen, Kontoverwaltung    | Nein (für Konto) |
| Name                                                                        | Ja                                 | Nein                                            | Kontoverwaltung, Community-Anzeige | Ja               |
| Nutzer-IDs (Konto-ID, RevenueCat-ID)                                        | Ja                                 | Ja, an RevenueCat (Dienstleister für Abos)      | App-Funktionen, Abo-Verwaltung     | Nein             |
| Fotos                                                                       | Ja                                 | Ja, an Google (Gemini, Verarbeitung im Auftrag) | App-Funktionen (Diagnose, Journal) | Ja               |
| Sonstige nutzergenerierte Inhalte (Pflanzen, Journal, Notizen, Coach-Chats) | Ja                                 | Ja, Texte an Google (Gemini)                    | App-Funktionen                     | Ja               |
| Nachrichten und Beiträge in der App                                         | Ja                                 | Nein                                            | App-Funktionen, Community          | Ja               |
| Kaufverlauf / Abo-Status                                                    | Ja                                 | Ja, an RevenueCat                               | App-Funktionen, Abo-Verwaltung     | Ja               |
| App-Interaktionen (XP, Streak, Verlosungen)                                 | Ja                                 | Nein                                            | App-Funktionen                     | Nein             |
| Absturzprotokolle / Diagnosedaten                                           | Ja (Sentry, nur wenn konfiguriert) | Ja, an Sentry (Dienstleister)                   | Analyse, Fehlerbehebung            | Nein             |
| Geräte- oder andere IDs (Push-Token)                                        | Ja, nur mit Einwilligung           | Ja, an Expo Push (Dienstleister)                | Benachrichtigungen                 | Ja               |
| Standort                                                                    | Nein (im Store-Build entfernt)     |                                                 |                                    |                  |
| Mikrofon/Audio                                                              | Nein                               |                                                 |                                    |                  |
| Kontakte, Kalender, SMS                                                     | Nein                               |                                                 |                                    |                  |

Hinweis zu "Weitergegeben": Übermittlungen an Dienstleister, die im Auftrag verarbeiten, zählen bei Google nicht als "Weitergabe", wenn sie
nur dafür dienen, die App zu betreiben. Falls die Console abweicht, konservativ "Ja" wählen.

Sicherheitsverfahren: Datenverschlüsselung bei Übertragung: Ja. Löschung anforderbar: Ja. Unabhängige Sicherheitsprüfung: Nein.

## Berechtigungen im Store-Build

Kamera (Pflanzenfoto), Fotos lesen (READ_EXTERNAL_STORAGE bis Android 12, Foto-Auswahl), Benachrichtigungen, Internet/Netzwerkstatus,
Play-Abrechnung, Biometrie nur falls für sichere Anmeldung genutzt. Gesperrt: Standort, Mikrofon, Overlay, Schreiben auf Speicher,
Medien-Foreground-Service. Nach dem AAB-Build mit `aapt dump permissions` gegenprüfen.

## Veröffentlichungsablauf

1. Neues privates Entwicklerkonto: Identität bestätigen, Closed Test mit mindestens 12 Testern über 14 Tage (laut aktuellem Stand, in der Console prüfen).
2. Play App Signing aktivieren; das AAB mit dem Upload-Schlüssel hochladen (Keystore ~/.secrets/growmaster-release.keystore, sichern!).
3. Store-Eintrag aus store-assets/descriptions (de/en), Grafiken aus store-assets/.
4. Inhalte-Fragebögen (siehe oben), Preise der Abos (Produkt-IDs `monthly`, `yearly` laut docs/GOOGLE_PLAY_SETUP.md) und RevenueCat-Verknüpfung.
5. Closed Test starten, nach 14 Tagen Produktion beantragen.
