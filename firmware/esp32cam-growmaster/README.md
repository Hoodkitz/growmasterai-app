# GrowMaster ESP32-CAM – Zelt-Kamera

Fotografiert während der Lichtphase regelmäßig das Blätterdach und schickt die Bilder an GrowMaster.
Die KI prüft daraus Blattgesundheit (Mängel, Schädlinge, Schimmel), Wachstumsphase/Blütewoche, Größe,
Blattfarben (z. B. Lila) und Blütenentwicklung – mit Verlauf in der App und Push bei ernsten Befunden.

## Stückliste

- ESP32-CAM (AI-Thinker, OV2640, **mit PSRAM**) – ca. 8–12 €
- USB-Programmer für ESP32-CAM (ESP32-CAM-MB) oder USB-Seriell-Adapter (3,3 V)
- 5-V-Netzteil, mind. 2 A (zu schwache Netzteile = Neustarts)
- optional: OV2640-Weitwinkelobjektiv (120–160°) für kleine Zelte

## Montage im Zelt

- Von oben schräg auf das Blätterdach (ca. 45°), so dass ein Topf oder die Zeltstange als Maßstab im Bild ist – dann kann die KI die Höhe schätzen.
- Nicht direkt neben/unter die Lampe (Hitze, Gegenlicht). Gehäuse gegen Feuchtigkeit schützen.
- Farbtreue: Unter rot-blauem LED-Licht wirken Farben verfälscht. Die Firmware fotografiert nur in der Lichtphase und nicht während Sonnenauf-/untergang; Vollspektrum-LEDs liefern die besten Ergebnisse.

## Einrichten

1. In der App: Smart Grow → Zelt → „Gerät verbinden“ → Eigene Hardware, Name „Kamera“, **keine** Sensoren/Aktoren wählen → Token kopieren.
2. `src/config.example.h` nach `src/config.h` kopieren und ausfüllen: WLAN, `SNAPSHOT_URL` (`https://<server>/api/device/v1/snapshot`), `DEVICE_TOKEN`, Lichtzeiten, **Root-Zertifikat** (`ROOT_CA_PEM`, siehe Kommentar).
3. Flashen: `pio run -t upload` (IO0 beim Flashen auf GND, danach lösen und Reset drücken), Log mit `pio device monitor`.

## Test ohne Kamera

```bash
curl -X POST https://<server>/api/device/v1/snapshot \
  -H "Authorization: Bearer gmd_…" -H "Content-Type: image/jpeg" --data-binary @zelt.jpg
```

Grenzen: nur JPEG, max. 1,5 MB, 12 Bilder/Stunde. Die KI prüft höchstens alle 2 Stunden ein Gerätebild.
