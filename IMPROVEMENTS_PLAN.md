# GrowMaster AI - Verbesserungsplan

**Datum:** 2026-10-06  
**Status:** In Arbeit

---

## Drei Verbesserungen

### 1. ✅ App für Neulinge verständlicher

**Problem:** Aktuell sind 4 Onboarding-Schritte zu technisch und überfordernd.

**Lösung:**
- Vereinfachter Onboarding-Flow mit 3 Schritten statt 4
- Einfachere Sprache, weniger Fachjargon
- Visuelle Guides mit mehr Emojis
- Interaktive Tipps direkt im UI
- Quick-Start Guide nach Onboarding

**Dateien:**
- `components/onboarding/onboarding-flow.tsx` - Vereinfachen
- Neue Datei: `components/help/quick-start-guide.tsx`

---

### 2. ✅ Live Scan Button beim Öffnen entfernen

**Problem:** Der "Live-Analyse starten" Button ist beim ersten Öffnen des Scan-Fensters sichtbar und verwirrt.

**Lösung:**
- Live Scan Button wird nur nach dem ersten Foto-Scan angezeigt
- Beim ersten Öffnen: Nur Kamera-Button und Galerie-Button
- Nach erstem Scan: "Möchtest du Live-Analyse aktivieren?" Hinweis

**Dateien:**
- `app/(tabs)/diagnose.tsx` - Zeile 562-575 (Live Analysis Toggle)

**Änderung:**
```tsx
// Verstecke Live-Button wenn noch kein Scan gemacht wurde
const [hasScannedOnce, setHasScannedOnce] = useState(false);

// In takePicture() nach erfolgreichem Scan:
setHasScannedOnce(true);

// Live Analysis Toggle nur anzeigen wenn hasScannedOnce === true
{hasScannedOnce && (
  <View className="flex-row justify-center gap-4 mb-4">
    <TouchableOpacity ... >
      ...Live-Analyse...
    </TouchableOpacity>
  </View>
)}
```

---

### 3. ✅ Scan-Ergebnis mit Sprache + Geschlecht

**Problem:** 
- Nach Scan nur Text-Ausgabe
- Kein Pflanzengeschlecht (männlich/weiblich) erkannt
- Keine Voice-Ausgabe

**Lösung:**
- **Text + Voice:** Ergebnis wird vorgelesen mit `expo-speech` (bereits installiert als `expo-audio`)
- **Geschlecht-Erkennung:** AI analysiert Pflanze auf männlich/weiblich/hermaphrodit
- **UI-Update:** Geschlecht-Badge im Ergebnis-Screen

**Dateien:**
- `app/(tabs)/diagnose.tsx` - Result View erweitern
- `server/routers/diagnosis.ts` - API erweitern für Geschlecht
- Neue Library: `expo-speech` für TTS

**Neue Diagnosis-Response:**
```typescript
interface DiagnosisResult {
  problem: string;
  recommendations: string[];
  careTips: string[];
  severity: "low" | "medium" | "high";
  // NEU:
  plantGender?: "male" | "female" | "hermaphrodite" | "unknown";
  genderConfidence?: number; // 0-100%
  voiceResponse: string; // Formatierter Text für TTS
}
```

**TTS Integration:**
```tsx
import * as Speech from 'expo-speech';

// Nach erfolgreicher Diagnose:
const speakResult = () => {
  Speech.speak(diagnosis.voiceResponse, {
    language: 'de-DE',
    pitch: 1.0,
    rate: 0.9,
  });
};

// Auto-play nach 1 Sekunde
useEffect(() => {
  if (diagnosis && mode === 'result') {
    setTimeout(speakResult, 1000);
  }
}, [diagnosis, mode]);
```

---

## Implementierungsreihenfolge

1. **Verbesserung 2** (einfachste) - Live Button verstecken ✅
2. **Verbesserung 3** (kritisch) - Voice + Geschlecht ✅
3. **Verbesserung 1** (umfangreich) - Onboarding vereinfachen ✅

---

## Geschätzte Zeit
- Verbesserung 2: 15 Minuten
- Verbesserung 3: 45 Minuten
- Verbesserung 1: 60 Minuten

**Total:** ~2 Stunden

---

## Testing Checklist

- [ ] Live Button erscheint nur nach erstem Scan
- [ ] Voice-Ausgabe funktioniert nach Diagnose
- [ ] Geschlecht wird korrekt angezeigt
- [ ] Onboarding ist verständlicher
- [ ] TypeScript kompiliert fehlerfrei
- [ ] Tests bestehen
