/**
 * Hardware-Ratgeber für Smart Grow: was sich mit der App verbinden lässt, wie man es installiert.
 *
 * Drei Wege: 1) Home Assistant mit fertigen Geräten (ohne Löten), 2) eigene ESP32-Steuerung (DIY),
 * 3) Mischbetrieb. Produktnamen sind Beispiele – Links sind Amazon-Suchen, keine festen Angebote.
 */
import type { Actuator, Metric } from "./types";

export type HwItem = {
  id: string;
  name: string;
  /** wofür in der App */
  role: string;
  metrics?: Metric[];
  actuators?: Actuator[];
  /** wie verbunden */
  via: "homeassistant" | "esp32" | "both";
  price: string;
  searchTerm: string;
  /** geprüfte Amazon-Produktnummer -> direkter Produktlink statt Suche */
  asin?: string;
  note?: string;
};

export type HwPath = {
  id: "ha" | "diy" | "camera";
  title: string;
  summary: string;
  level: string;
  items: HwItem[];
  steps: string[];
  safety: string[];
};

export const HARDWARE_PATHS: HwPath[] = [
  {
    id: "ha",
    title: "Fertige Geräte über Home Assistant",
    summary:
      "Kein Löten, keine 230-V-Verkabelung: Zwischenstecker, Funk-Sensoren und smarte Lüfter. Home Assistant sammelt alles, GrowMaster steuert darüber.",
    level: "Einsteiger · ca. 250–600 €",
    items: [
      {
        id: "ha-green",
        name: "Home Assistant Green",
        role: "Zentrale, an der alle Geräte hängen (läuft 24/7, sparsam)",
        via: "homeassistant",
        price: "ca. 110–130 €",
        searchTerm: "Home Assistant Green",
      },
      {
        id: "zigbee",
        name: "Zigbee-USB-Stick (z. B. SONOFF ZBDongle / Home Assistant Connect ZBT-1)",
        role: "Funk für Zigbee-Sensoren",
        via: "homeassistant",
        price: "ca. 25–40 €",
        searchTerm: "Zigbee USB Stick Home Assistant",
      },
      {
        id: "aqara-th",
        name: "Aqara Temperatur- und Feuchtesensor (Zigbee)",
        role: "Lufttemperatur und Luftfeuchte",
        metrics: ["airTemp", "airRh"],
        via: "homeassistant",
        price: "ca. 15–20 €",
        searchTerm: "Aqara Temperatur Luftfeuchtigkeit Sensor Zigbee",
      },
      {
        id: "co2",
        name: "SwitchBot Meter Pro CO2 oder Aranet4",
        role: "CO₂, Temperatur, Luftfeuchte",
        metrics: ["co2", "airTemp", "airRh"],
        via: "homeassistant",
        price: "ca. 70–180 €",
        searchTerm: "SwitchBot Meter Pro CO2",
      },
      {
        id: "shelly-plug",
        name: "Shelly Plus Plug S (mehrere)",
        role: "Schalten von Heizung, Befeuchter, Entfeuchter, Pumpe, CO₂-Ventil; misst Strom",
        actuators: ["heater", "humidifier", "dehumidifier", "pump", "co2"],
        via: "homeassistant",
        price: "ca. 20–25 € je Stück",
        searchTerm: "Shelly Plus Plug S",
        note: "Max. 2500 W je Stecker – Heizlüfter-Leistung prüfen.",
      },
      {
        id: "ac-infinity",
        name: "AC Infinity CloudLine (EC-Rohrlüfter) + Controller 69 Pro/AI+",
        role: "Abluft/Umluft stufenlos, eigener Temp-/Feuchte-Fühler",
        metrics: ["airTemp", "airRh"],
        actuators: ["exhaust", "circulation"],
        via: "homeassistant",
        price: "ca. 150–300 €",
        searchTerm: "AC Infinity Cloudline Controller 69",
        note: "Einbindung in Home Assistant über die Community-Integration „AC Infinity“ (HACS).",
      },
      {
        id: "shelly-dim",
        name: "Shelly Plus 0-10V Dimmer",
        role: "LED-Lampe dimmen (Sonnenauf-/untergang)",
        actuators: ["light"],
        via: "homeassistant",
        price: "ca. 30–35 €",
        searchTerm: "Shelly Plus 0-10V Dimmer",
        note: "Nur für Lampen mit 0–10-V-Dimmeingang (z. B. viele Spider Farmer, Mars Hydro, Lumatek). Einbau durch Elektrofachkraft.",
      },
      {
        id: "flood",
        name: "Shelly Flood oder Aqara Wassermelder",
        role: "Leck am Zeltboden → Pumpe/Dosierung sofort gesperrt",
        metrics: ["leak"],
        via: "homeassistant",
        price: "ca. 20–35 €",
        searchTerm: "Shelly Flood Wassermelder",
      },
      {
        id: "soil",
        name: "Zigbee-Bodenfeuchtesensor",
        role: "Substratfeuchte für automatisches Gießen",
        metrics: ["soilMoisture"],
        via: "homeassistant",
        price: "ca. 15–25 €",
        searchTerm: "Zigbee Bodenfeuchtesensor Pflanze",
      },
    ],
    steps: [
      "Home Assistant Green ans Netzwerk (LAN) und Strom anschließen, im Browser homeassistant.local:8123 öffnen und Konto anlegen.",
      "Zigbee-Stick einstecken → Einstellungen → Geräte & Dienste → „ZHA“ hinzufügen. Sensoren in den Kopplungsmodus bringen und nacheinander anlernen.",
      "Shelly-Stecker in der Shelly-App ins WLAN bringen; Home Assistant findet sie danach automatisch (Integration „Shelly“).",
      "AC-Infinity-Controller: über HACS die Integration „AC Infinity“ installieren und mit deinem AC-Infinity-Konto anmelden.",
      "Für den Zugriff aus dem Internet „Home Assistant Cloud“ (Nabu Casa) aktivieren – GrowMaster braucht eine https-Adresse. Alternativ eigene Domain mit Zertifikat.",
      "In Home Assistant: Profil → Sicherheit → „Langlebiges Zugriffstoken“ erstellen und kopieren.",
      "In GrowMaster: Smart Grow → Zelt → „Gerät verbinden“ → Home Assistant → Adresse + Token → „Verbindung testen“ → Sensoren und Schalter antippen → verbinden.",
      "Zuerst im Modus „Vorschläge“ laufen lassen und prüfen, ob die richtigen Geräte schalten. Dann Autopilot einschalten.",
    ],
    safety: [
      "Zwischenstecker nur bis zur angegebenen Leistung belasten (Heizlüfter!). Keine Mehrfachsteckdosen-Kaskaden.",
      "Rauchmelder ins Zelt, Fehlerstromschutzschalter (FI) im Stromkreis.",
      "CO₂-Flasche nur mit Druckminderer und Magnetventil, das stromlos schließt – und nur mit CO₂-Sensor (die App sperrt CO₂ sonst).",
    ],
  },
  {
    id: "diy",
    title: "Eigene Steuerung mit ESP32 (DIY)",
    summary:
      "Volle Kontrolle und Dosierpumpen: ein ESP32 mit Sensoren, Relais und Peristaltikpumpen nach dem offenen GrowMaster-Protokoll. Die Firmware gibt es fertig.",
    level: "Fortgeschritten (Löten, 12-V-Technik) · ca. 150–350 €",
    items: [
      {
        id: "esp32",
        name: "ESP32-DevKit (ESP32-WROOM-32)",
        role: "Gehirn der Steuerung, meldet alle 30 s an GrowMaster",
        via: "esp32",
        price: "ca. 8–12 €",
        searchTerm: "ESP32 DevKit WROOM 32",
      },
      {
        id: "sht",
        name: "SHT31- oder SHT40-Sensor (I²C)",
        role: "Lufttemperatur und Luftfeuchte (genau)",
        metrics: ["airTemp", "airRh"],
        via: "esp32",
        price: "ca. 8–15 €",
        searchTerm: "SHT31 Sensor I2C",
      },
      {
        id: "scd40",
        name: "Sensirion SCD40/SCD41 (I²C)",
        role: "echtes CO₂ (NDIR/photoakustisch)",
        metrics: ["co2"],
        via: "esp32",
        price: "ca. 30–50 €",
        searchTerm: "SCD40 CO2 Sensor",
      },
      {
        id: "mlx",
        name: "MLX90614 Infrarot-Thermometer",
        role: "Blatttemperatur → echter Blatt-VPD",
        metrics: ["leafTemp"],
        via: "esp32",
        price: "ca. 10–15 €",
        searchTerm: "MLX90614 Infrarot Sensor",
      },
      {
        id: "ph-ec",
        name: "DFRobot Gravity pH- und EC-Sensor (analog) + DS18B20",
        role: "pH, EC und Wassertemperatur im Tank",
        metrics: ["waterPh", "waterEc", "waterTemp"],
        via: "esp32",
        price: "ca. 60–90 €",
        searchTerm: "DFRobot Gravity pH Sensor",
        note: "Laborgenauer, aber teurer: Atlas Scientific EZO (Firmware-Anpassung nötig).",
      },
      {
        id: "level",
        name: "Ultraschall-Füllstandsensor JSN-SR04T (wasserdicht)",
        role: "Tankfüllstand → Pumpen-Trockenlaufschutz",
        metrics: ["waterLevel"],
        via: "esp32",
        price: "ca. 8–12 €",
        searchTerm: "JSN-SR04T wasserdicht",
      },
      {
        id: "soil-cap",
        name: "Kapazitiver Bodenfeuchtesensor v2.0",
        role: "Substratfeuchte",
        metrics: ["soilMoisture"],
        via: "esp32",
        price: "ca. 3–6 € je Stück",
        searchTerm: "kapazitiver Bodenfeuchtesensor v2.0",
      },
      {
        id: "relay",
        name: "8-Kanal-Relaismodul mit Optokoppler",
        role: "Schaltet Heizung, Befeuchter, CO₂-Ventil, Pumpe (über Steckdosen-Box)",
        actuators: ["heater", "humidifier", "dehumidifier", "co2", "pump"],
        via: "esp32",
        price: "ca. 10–15 €",
        searchTerm: "8 Kanal Relais Modul Optokoppler",
        note: "230-V-Seite nur durch Elektrofachkraft, in einem geschlossenen Gehäuse.",
      },
      {
        id: "doser",
        name: "4–6× 12-V-Peristaltikpumpe + MOSFET-Modul",
        role: "Dosierung von Dünger A/B, Cal-Mag, pH minus/plus",
        actuators: ["doser"],
        via: "esp32",
        price: "ca. 40–80 €",
        searchTerm: "Peristaltik Dosierpumpe 12V",
      },
      {
        id: "dim",
        name: "PWM-auf-0-10-V-Wandler",
        role: "LED-Lampe dimmen, EC-Lüfter regeln",
        actuators: ["light", "exhaust", "intake"],
        via: "esp32",
        price: "ca. 5–10 € je Kanal",
        searchTerm: "PWM 0-10V Wandler Modul",
      },
      {
        id: "psu",
        name: "12-V-Netzteil (5 A) + Step-down auf 5 V",
        role: "Stromversorgung für ESP32, Pumpen, Sensoren",
        via: "esp32",
        price: "ca. 15–25 €",
        searchTerm: "12V 5A Netzteil Hutschiene",
      },
    ],
    steps: [
      "Firmware aus dem GrowMaster-Projekt laden (firmware/esp32-growmaster), PlatformIO in VS Code installieren.",
      "Verdrahtung nach der Pin-Tabelle in der Firmware-Anleitung: I²C-Sensoren an GPIO 21/22, Analogsensoren an 34/35/36, Relais und Pumpen laut Tabelle.",
      "In GrowMaster: Smart Grow → Zelt → „Gerät verbinden“ → Eigene Hardware → Sensoren/Geräte wie verbaut antippen → Token kopieren.",
      "In der Firmware src/config.example.h nach config.h kopieren: WLAN, Server-Adresse, Token, Root-Zertifikat, Lichtzeiten eintragen.",
      "Flashen (pio run -t upload) und im seriellen Monitor prüfen: Messwerte, Antwort „ok“ vom Server.",
      "pH-/EC-Sonden mit Kalibrierlösungen kalibrieren (pH 4/7, EC 1,413) und Dosierpumpen auf ml/Sekunde einmessen (Messbecher, 60 s laufen lassen).",
      "Zuerst im Modus „Vorschläge“ testen, Dosierlimits in den Sicherheitsgrenzen klein halten, dann Autopilot.",
    ],
    safety: [
      "230 V nur durch eine Elektrofachkraft. Die Relais nur zum Schalten von Steckdosen in einer geschlossenen Box mit Zugentlastung.",
      "Die Firmware hat eigene Notabschaltungen (Leck, CO₂ > 2000 ppm, max. Pumpzeit) und schaltet ohne Server in den Notbetrieb.",
      "Dünger und pH-Mittel sind ätzend: Schläuche sichern, Tank abdecken, Kinder und Tiere fernhalten.",
    ],
  },
  {
    id: "camera",
    title: "Kamera im Zelt",
    summary:
      "Die KI beobachtet Blätter, Phase, Größe und Farben. Entweder eine günstige ESP32-CAM oder eine WLAN-Kamera, die in Home Assistant eingebunden ist.",
    level: "Einfach · ca. 10–60 €",
    items: [
      {
        id: "esp32cam",
        name: "ESP32-CAM (AI-Thinker, mit PSRAM) + ESP32-CAM-MB-Programmer",
        role: "Fotografiert alle 30 Min. bei Licht an",
        via: "esp32",
        price: "ca. 10–15 €",
        searchTerm: "ESP32-CAM MB Programmer",
        note: "Mit 160°-Weitwinkelobjektiv für kleine Zelte.",
      },
      {
        id: "reolink",
        name: "Reolink- oder Tapo-WLAN-Kamera",
        role: "Kamera über Home Assistant (Integration „Reolink“ bzw. ONVIF)",
        via: "homeassistant",
        price: "ca. 30–60 €",
        searchTerm: "Reolink WLAN Kamera Innen",
      },
    ],
    steps: [
      "Kamera von oben schräg auf das Blätterdach richten, so dass Topf oder Zeltstange als Maßstab zu sehen ist. Nicht direkt unter die Lampe.",
      "ESP32-CAM: Firmware firmware/esp32cam-growmaster flashen, Token aus „Gerät verbinden“ (eigene Hardware ohne Sensoren) eintragen.",
      "WLAN-Kamera: in Home Assistant einbinden, dann bei „Gerät verbinden → Home Assistant“ unter „Zelt-Kamera“ antippen.",
      "Die erste Auswertung siehst du im Zelt unter „Kamera-Beobachtung“. Mit „Foto prüfen“ geht es jederzeit auch per Handy.",
    ],
    safety: [
      "Kamera und Netzteil vor Spritzwasser schützen; Kabel nicht über heiße Lampen führen.",
    ],
  },
];
