# GrowMaster AI - Mobile App Design Document

## App Overview

GrowMaster AI ist ein intelligenter Cannabis-Anbau-Assistent, der Nutzern hilft, ihre Pflanzen zu analysieren, Krankheiten zu erkennen und den Ertrag zu optimieren. Die App nutzt KI-gestützte Bildanalyse und einen interaktiven Chat-Coach.

## Screen List

| Screen | Beschreibung |
|--------|--------------|
| **Home** | Dashboard mit Übersicht der aktiven Pflanzen und Quick-Actions |
| **Diagnose** | Kamera/Foto-Upload für KI-gestützte Pflanzenanalyse |
| **Coach** | AI-Chat für Fragen rund um den Anbau |
| **Pflanzen** | Verwaltung aller Pflanzen mit Details |
| **Journal** | Grow-Tagebuch mit wöchentlichen Einträgen |

## Primary Content and Functionality

### Home Screen
Der Home Screen zeigt eine Übersicht der aktiven Pflanzen als Karten mit Foto, Name und aktuellem Status. Quick-Action-Buttons ermöglichen den schnellen Zugriff auf Diagnose und Coach. Eine Statistik-Sektion zeigt die Anzahl der Pflanzen, durchgeführte Diagnosen und den aktuellen Streak.

### Diagnose Screen
Der Diagnose Screen ist das Herzstück der App. Nutzer können bis zu 4 Fotos ihrer Pflanze aufnehmen oder aus der Galerie auswählen. Nach dem Upload analysiert die Gemini Vision AI die Bilder und liefert eine detaillierte Diagnose mit Problemidentifikation, Behandlungsempfehlungen und Pflegetipps.

### Coach Screen
Der Coach Screen bietet einen Chat-Interface zum AI-Grow-Experten. Nutzer können Fragen stellen und erhalten kontextbezogene Antworten mit praktischen Tipps. Optional können Bilder zur Frage hinzugefügt werden.

### Pflanzen Screen
Hier werden alle Pflanzen des Nutzers in einer Liste angezeigt. Jede Pflanze kann mit Details wie Sorte, Alter, Wachstumsphase und Notizen versehen werden. Neue Pflanzen können hinzugefügt und bestehende bearbeitet oder gelöscht werden.

### Journal Screen
Das Grow-Journal ermöglicht wöchentliche Einträge mit Fotos, Notizen und Checklisten. Eine Timeline-Ansicht zeigt den gesamten Verlauf des Grows.

## Key User Flows

### Pflanzen-Diagnose Flow
1. Nutzer tippt auf "Diagnose" Tab
2. Nutzer wählt "Foto aufnehmen" oder "Aus Galerie"
3. Nutzer kann bis zu 4 Bilder hinzufügen
4. Optional: Zusätzliche Notizen eingeben
5. Nutzer tippt "Diagnose starten"
6. Ladeanimation während KI analysiert
7. Ergebnis-Screen mit Problem, Empfehlungen und Tipps

### Coach-Frage Flow
1. Nutzer tippt auf "Coach" Tab
2. Nutzer gibt Frage in Textfeld ein
3. Optional: Bild zur Frage hinzufügen
4. Nutzer tippt "Fragen"
5. AI-Antwort erscheint mit praktischen Tipps

### Pflanze hinzufügen Flow
1. Nutzer tippt auf "Pflanzen" Tab
2. Nutzer tippt auf "+" Button
3. Formular: Name, Sorte, Startdatum, Phase
4. Optional: Foto hinzufügen
5. Nutzer tippt "Speichern"
6. Pflanze erscheint in der Liste

## Color Choices

Das Farbschema orientiert sich an der bestehenden GrowMaster-Marke mit einem dunklen Theme und grünen Akzenten:

| Token | Light Mode | Dark Mode | Verwendung |
|-------|------------|-----------|------------|
| **primary** | #22C55E | #4ADE80 | Buttons, Akzente, aktive Elemente |
| **background** | #F0FDF4 | #0A0F0D | Hintergrund aller Screens |
| **surface** | #DCFCE7 | #14201A | Karten, erhöhte Flächen |
| **foreground** | #14532D | #ECFDF5 | Primärer Text |
| **muted** | #4D7C5F | #6EE7A0 | Sekundärer Text |
| **border** | #BBF7D0 | #22543D | Rahmen, Trennlinien |
| **success** | #16A34A | #4ADE80 | Erfolgs-States |
| **warning** | #EAB308 | #FACC15 | Warnungen |
| **error** | #DC2626 | #F87171 | Fehler |

## Typography

Die App verwendet die System-Schriftart für optimale Lesbarkeit und native Performance. Überschriften sind fett und groß, Fließtext ist gut lesbar mit ausreichend Zeilenabstand.

## Navigation

Die App verwendet eine Tab-Navigation am unteren Bildschirmrand mit 5 Tabs:
1. **Home** (Haus-Icon)
2. **Diagnose** (Kamera-Icon)
3. **Coach** (Chat-Icon)
4. **Pflanzen** (Blatt-Icon)
5. **Journal** (Buch-Icon)

## Interaction Patterns

Alle interaktiven Elemente haben haptisches Feedback. Buttons zeigen einen leichten Scale-Effekt beim Drücken. Karten haben einen Opacity-Effekt bei Berührung. Ladeanimationen informieren den Nutzer über laufende Prozesse.
