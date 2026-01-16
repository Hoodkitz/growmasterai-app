# UI/UX Analyse Prompt für Google Gemini (AI Studio)

## Anleitung
1. Gehe zu https://aistudio.google.com/
2. Wähle ein Modell mit Vision-Fähigkeiten (z.B. Gemini 2.0 Flash oder Gemini 1.5 Pro)
3. Lade Screenshots deiner App hoch
4. Kopiere den unten stehenden Prompt

---

## Prompt für Gemini

Ich entwickle eine Cannabis-Anbau-App namens "CannaCompanion" und benötige eine professionelle UI/UX Analyse.

**Kontext:**
- React Native/Expo App für iOS und Android
- Zielgruppe: Hobby-Grower (18-45 Jahre)
- Hauptfunktionen: Pflanzenverwaltung, Tagebuch, Community, Coach, Diagnose-Tools
- Design-System: NativeWind (Tailwind CSS), Custom Theme mit grünen Akzenten
- Monetarisierung: Freemium mit Premium-Features

**Deine Aufgabe:**
Analysiere die hochgeladenen Screenshots und gib mir:

1. **Erste Eindrücke** (2-3 Sätze)
   - Was fällt sofort auf?
   - Wirkt die App professionell/vertrauenswürdig?

2. **Navigation & Information Architecture**
   - Ist die Tab-Navigation intuitiv?
   - Sind die Hauptfunktionen leicht erreichbar?
   - Verbesserungsvorschläge?

3. **Visuelle Hierarchie**
   - Führt das Design den Blick richtig?
   - Sind CTAs (Call-to-Actions) klar erkennbar?
   - Ist der Text gut lesbar?

4. **Konsistenz & Design System**
   - Wirkt das Design durchgängig?
   - Werden Farben/Abstände konsistent genutzt?
   - Spacing und Padding gut gelöst?

5. **Mobile UX Best Practices**
   - Sind Touch-Targets groß genug? (min. 44x44pt)
   - Ist wichtiger Content "thumb-friendly"?
   - Funktioniert es für verschiedene Bildschirmgrößen?

6. **Emotionale Wirkung**
   - Passt das Design zur Zielgruppe?
   - Welche Stimmung vermittelt die App?
   - Wie kann man das verbessern?

7. **Top 5 Verbesserungsvorschläge**
   - Priorisiert nach Impact/Aufwand
   - Konkrete, umsetzbare Tipps
   - Falls möglich mit Design-Referenzen

8. **Accessibility Hinweise**
   - Kontraste ausreichend?
   - Schriftgrößen okay?
   - Verbesserungspotenzial?

**Format:**
- Strukturiert mit Überschriften
- Konkrete Beispiele aus den Screenshots
- Actionable Tipps, keine allgemeinen Aussagen
- Wenn möglich: Vorher/Nachher Vergleiche oder Sketches

**Bonus:**
Falls du spezifische Screens besonders problematisch findest, gehe darauf detailliert ein.

---

## Welche Screenshots solltest du hochladen?

### Mindestens diese Screens:
1. **Home/Dashboard** - Erster Eindruck
2. **Pflanzen-Übersicht** - Hauptfunktion
3. **Tagebuch-Eintrag** - Interaktion
4. **Community Feed** - Social Feature
5. **Onboarding** - First-Time User Experience

### Optional aber hilfreich:
6. **Coach/Diagnose** - AI Features
7. **Settings** - Navigation Tiefe
8. **Paywall** - Monetarisierung
9. **Detail-Ansichten** - Content Density

---

## Nach der Analyse

Wenn du die Ergebnisse hast:
1. Speichere sie in `design-review/GEMINI_ANALYSIS.md`
2. Priorisiere die Quick Wins (hoher Impact, wenig Aufwand)
3. Erstelle ggf. Jira Tickets für größere Änderungen
4. Teste Änderungen mit echten Usern wenn möglich

---

## Alternative: Mit Webapp testen

Falls du keine Screenshots hast, kannst du auch diese Demo-Webapp hochladen:
- `tmp_rovodev_webapp.html` aus dem Projekt-Root
- Gemini kann auch HTML/CSS analysieren
- Weniger akkurat als echte Screenshots, aber besser als nichts

---

## Tipps für bessere Ergebnisse

1. **Hochauflösende Screenshots** - Mindestens 1080p
2. **Verschiedene States** - Leer, befüllt, Fehler-States
3. **Mehrere Iterationen** - Lass Gemini auf seine eigenen Vorschläge reagieren
4. **Vergleiche** - Zeige auch Konkurrenz-Apps für Benchmark
5. **Spezifische Fragen** - "Ist dieser Button zu klein?" statt "Wie ist der Button?"

