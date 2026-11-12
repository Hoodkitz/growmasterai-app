# GrowMaster Smart-Grow – ESP32 Referenz-Firmware (Protokoll v1)

Diese Firmware verbindet einen **ESP32** über HTTPS mit dem **GrowMaster Smart-Grow Geräte-Protokoll v1** (`/api/device/v1/report`). Sie erfasst Klima-, Tank- und Substratsensoren, steuert LED-Beleuchtung, EC-Lüfter, Klimarelais, Bewässerungspumpe sowie bis zu 6 Peristaltik-Dosierpumpen und verfügt über eine eigenständige Hardware-Sicherheits- und Notbetriebslogik (Failsafe).

---

## 1. Sicherheitshinweise (Unbedingt vor Aufbau lesen!)

> [!CAUTION]
> **Lebensgefahr durch 230 V Netzspannung sowie Erstickungsgefahr durch CO₂!**
>
> 1. **230 V-Arbeiten nur durch eine Elektrofachkraft:** Das Schalten von Netzspannung (Heizung, Klimagerät, Luftbefeuchter, Entfeuchter) darf ausschließlich durch eine ausgebildete Elektrofachkraft gemäß VDE 0100 erfolgen. Für Bastler-Aufbauten empfiehlt es sich, auf der ESP32-Seite nur Kleinspannung (12 V / 24 V DC) sowie 0–10 V / PWM-Steuerleitungen zu verwenden.
> 2. **FI-Schutzschalter (RCD ≤ 30 mA):** Die gesamte Stromversorgung des Grow-Zeltes muss zwingend über einen Fehlerstrom-Schutzschalter (FI/RCD, max. 30 mA) abgesichert sein – insbesondere wegen der Kombination aus Wasser/Nährlösung und elektrischer Ausrüstung.
> 3. **Relaismodule mit Optokoppler & Freilaufdioden:** Verwende für induktive Lasten (Pumpen, Magnetventile, Schütze) ausschließlich galvanisch getrennte Relaismodule mit Optokoppler sowie geeignete Schutzbeschaltung (Freilaufdiode bei DC-Ventilen/Pumpen, RC-Snubber bei AC-Lasten).
> 4. **CO₂-Begasung nur mit stromlos geschlossenem Magnetventil (NC) & Abschaltung:** Verwende ausschließlich **stromlos geschlossene (Normally Closed, NC)** Magnetventile. Die Firmware schließt das Ventil automatisch, sobald `co2 > 2000 ppm` gemessen wird oder die Serververbindung ausfällt. Betreibe eine CO₂-Anlage niemals ohne unabhängigen CO₂-Raumwarner außerhalb des Zelts!
> 5. **Wasserschutz (Tropfschleifen & Leck-Sensor):** Platziere alle Elektronikeinheiten außerhalb des Zeltes oder oberhalb der maximalen Wasserlinie. Führe Kabel immer mit einer Tropfschleife ein und installiere den Leck-Sensor an der tiefsten Stelle der Bodenwanne.

---

## 2. Beispiel-Stückliste (BOM)

| Komponente                | Beispiel-Bauteil                                                                                 | Zweck / Messgröße                                                                          |
| :------------------------ | :----------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| **Mikrocontroller**       | ESP32-WROOM-32 DevKitC (38 Pin)                                                                  | Hauptcontroller mit WLAN & Hardware-PWM                                                    |
| **Klima-Sensor (Luft)**   | Sensirion SHT31-D oder SHT40 / SHT41 (I²C)                                                       | Lufttemperatur (`airTemp`) & relative Luftfeuchte (`airRh`)                                |
| **CO₂-Sensor**            | Sensirion SCD40 oder SCD41 (I²C)                                                                 | Echter NDIR/photoakustischer CO₂-Messwert (`co2` in ppm)                                   |
| **Blatttemperatur**       | Melexis MLX90614ESF-BAA (I²C, 3.3 V)                                                             | Berührungslose IR-Blatttemperatur (`leafTemp` für präzisen Blatt-VPD)                      |
| **Wassertemperatur**      | DS18B20 (wasserdichte Edelstahlhülse + 4,7 kΩ Pull-up)                                           | Tanktemperatur (`waterTemp`) & Temperaturkompensation für pH/EC                            |
| **pH-Sonde + Modul**      | DFRobot Gravity Analog pH Sensor Pro V2                                                          | pH-Wert der Nährlösung (`waterPh`)                                                         |
| **EC-Sonde + Modul**      | DFRobot Gravity Analog Electrical Conductivity V2 (K=1)                                          | Leitwert der Nährlösung (`waterEc` in mS/cm)                                               |
| **Bodenfeuchte**          | Kapazitiver Bodenfeuchtesensor v1.2 / v2.0 (korrosionsfrei)                                      | Substratfeuchte (`soilMoisture` in %)                                                      |
| **Tankfüllstand**         | Wasserdichter Ultraschallsensor JSN-SR04T (oder Schwimmerschalter)                               | Füllstand im Nährstofftank (`waterLevel` in %)                                             |
| **Leck-Sensor**           | Wassermelder-Sonde mit Komparator-Modul (LM393)                                                  | Schutz vor Überschwemmung (`leak`: `0` = trocken, `1` = nass)                              |
| **PWM -> 0–10 V Wandler** | 4x PWM-zu-0-10V-Modul (oder Optokoppler PC817 für EC-Lüfter)                                     | Dimmung für LED-Treiber (`light`) & EC-Lüfter (`exhaust`, `intake`, `circulation`)         |
| **Relais-Board**          | 6-Kanal 5 V Relaismodul mit Optokoppler (Active-LOW)                                             | Schalten von `heater`, `cooler`, `humidifier`, `dehumidifier`, `co2`, `pump`               |
| **Dosierpumpen**          | 6x 12 V Peristaltikpumpe + 6x Logic-Level-MOSFET-Modul (z. B. IRLZ44N / AOD4184 + Freilaufdiode) | Millilitergenaue Dosierung (`nutrientA`, `nutrientB`, `bloom`, `calmag`, `phDown`, `phUp`) |

---

## 3. Verdrahtung & Pinbelegung

Die folgende Tabelle zeigt die Standard-Pinbelegung aus [`src/config.example.h`](file:///home/administrator/projects/growmasterai-app/firmware/esp32-growmaster/src/config.example.h). Alle Analogeingänge liegen auf **ADC1 (GPIO 32–39)**, da ADC2 bei aktivem WLAN auf dem ESP32 technisch blockiert ist.

| Funktion / Kanal       | Protokoll-Name                        |    ESP32 GPIO    | Richtung / Bus  | Hinweise zur Beschaltung                                                                    |
| :--------------------- | :------------------------------------ | :--------------: | :-------------- | :------------------------------------------------------------------------------------------ |
| **I²C SDA**            | `airTemp`, `airRh`, `co2`, `leafTemp` |   **GPIO 21**    | I²C Daten       | 3.3 V Bus für SHT3x/4x (`0x44`), SCD4x (`0x62`), MLX90614 (`0x5A`)                          |
| **I²C SCL**            | `airTemp`, `airRh`, `co2`, `leafTemp` |   **GPIO 22**    | I²C Takt        | Gemeinsame Taktleitung                                                                      |
| **Wassertemperatur**   | `waterTemp`                           |    **GPIO 4**    | OneWire         | 4,7 kΩ Pull-up-Widerstand zwischen GPIO 4 und 3.3 V erforderlich                            |
| **pH-Sensor**          | `waterPh`                             |   **GPIO 34**    | Analog (ADC1)   | Eingang 0–3.3 V (nur Eingangspin, kein interner Pull-up)                                    |
| **EC-Sensor**          | `waterEc`                             |   **GPIO 35**    | Analog (ADC1)   | Eingang 0–3.3 V (nur Eingangspin)                                                           |
| **Bodenfeuchte**       | `soilMoisture`                        | **GPIO 36 (VP)** | Analog (ADC1)   | Eingang 0–3.3 V vom kapazitiven Sensor                                                      |
| **Leck-Sensor**        | `leak`                                | **GPIO 39 (VN)** | Digital In      | `LOW` = Wasser erkannt (`LEAK_ACTIVE_LOW = 1`)                                              |
| **Füllstand Trigger**  | `waterLevel`                          |   **GPIO 12**    | Digital Out     | Trigger-Pin für Ultraschallsensor JSN-SR04T / HC-SR04                                       |
| **Füllstand Echo**     | `waterLevel`                          |   **GPIO 32**    | Digital In      | Echo-Pin (Achtung: 5 V Echo-Signal über Spannungsteiler 10 kΩ / 20 kΩ auf 3.3 V begrenzen!) |
| **Licht PWM**          | `light`                               |   **GPIO 25**    | PWM Out (5 kHz) | An 0–10 V Konverter für dimmbaren LED-Treiber (0–100 %)                                     |
| **Abluft PWM**         | `exhaust`                             |   **GPIO 26**    | PWM Out (5 kHz) | EC-Lüfter Steuereingang (0–100 %)                                                           |
| **Zuluft PWM**         | `intake`                              |   **GPIO 27**    | PWM Out (5 kHz) | EC-Lüfter Steuereingang (0–100 %)                                                           |
| **Umluft PWM**         | `circulation`                         |   **GPIO 14**    | PWM Out (5 kHz) | Umluft-Ventilator PWM (0–100 %)                                                             |
| **Relais Heizung**     | `heater`                              |   **GPIO 16**    | Digital Out     | Schaltet Heizung (0 / 100)                                                                  |
| **Relais Kühlung**     | `cooler`                              |   **GPIO 17**    | Digital Out     | Schaltet Klimagerät (0 / 100)                                                               |
| **Relais Befeuchter**  | `humidifier`                          |   **GPIO 18**    | Digital Out     | Schaltet Luftbefeuchter (0 / 100)                                                           |
| **Relais Entfeuchter** | `dehumidifier`                        |   **GPIO 19**    | Digital Out     | Schaltet Luftentfeuchter (0 / 100)                                                          |
| **Relais CO₂-Ventil**  | `co2`                                 |   **GPIO 23**    | Digital Out     | Stromlos geschlossenes (NC) Magnetventil                                                    |
| **Relais Pumpe**       | `pump`                                |   **GPIO 13**    | Digital Out     | Bewässerungspumpe (zeitgesteuert, max. 600 s)                                               |
| **Doser Dünger A**     | `doser` (`nutrientA`)                 |   **GPIO 15**    | Digital Out     | MOSFET für Peristaltikpumpe 1                                                               |
| **Doser Dünger B**     | `doser` (`nutrientB`)                 |    **GPIO 2**    | Digital Out     | MOSFET für Peristaltikpumpe 2                                                               |
| **Doser Blüte**        | `doser` (`bloom`)                     |    **GPIO 0**    | Digital Out     | MOSFET für Peristaltikpumpe 3                                                               |
| **Doser Cal-Mag**      | `doser` (`calmag`)                    |    **GPIO 5**    | Digital Out     | MOSFET für Peristaltikpumpe 4                                                               |
| **Doser pH minus**     | `doser` (`phDown`)                    |   **GPIO 33**    | Digital Out     | MOSFET für Peristaltikpumpe 5                                                               |
| **Doser pH plus**      | `doser` (`phUp`)                      |   **GPIO 20**    | Digital Out     | MOSFET für Peristaltikpumpe 6 (je nach Board ggf. freien Pin wählen)                        |

---

## 4. Konfiguration & Geräte-Token aus der App eintragen

1. Öffne in der **GrowMaster App** den Bereich **Smart Grow** und lege ein neues Gerät vom Typ **Eigenes Gerät (HTTP / ESP32)** an.
2. Wähle die am ESP32 angeschlossenen Sensoren und Aktoren aus und kopiere das angezeigte **Geräte-Token** (Format `gmd_...` – es wird aus Sicherheitsgründen nur einmalig beim Anlegen im Klartext angezeigt!).
3. Kopiere im Firmware-Ordner die Beispielkonfiguration nach `src/config.h`:
   ```bash
   cd firmware/esp32-growmaster
   cp src/config.example.h src/config.h
   ```
4. Passe in `src/config.h` folgende Werte an:
   - `WIFI_SSID` und `WIFI_PASSWORD`
   - `SERVER_URL` (z. B. `https://dein-growmaster-server.de/api/device/v1/report`)
   - `DEVICE_TOKEN` (dein `gmd_...` Token aus der App)
   - Aktiviere/deaktiviere nicht verbaute Sensoren über `#define USE_... 0`
   - Kalibrierwerte für pH, EC, Bodenfeuchte und Förderrate der Dosierpumpen (`DOSER_MLS_...` in ml/s)

> [!IMPORTANT]
> Committe `src/config.h` niemals in ein öffentliches Git-Repository!

---

### TLS-Zertifikat (Pflicht)

Die Firmware prüft das https-Zertifikat des Servers. Trage in `config.h` unter `ROOT_CA_PEM` das Root-Zertifikat ein:

```bash
openssl s_client -connect <dein-server>:443 -showcerts </dev/null
```

Das **letzte** Zertifikat der Kette (Root-CA) inkl. `-----BEGIN/END CERTIFICATE-----` übernehmen (jede Zeile als `"…\n"`).
Ohne Prüfung könnte jemand im WLAN den Server vortäuschen und Heizung, Pumpe oder CO₂ schalten. `WIFI_TLS_INSECURE 1` geht nur zusammen mit `ALLOW_INSECURE_TLS 1` – ausschließlich zum Testen.

## 5. Kompilieren & Flashen mit PlatformIO

Stelle sicher, dass [PlatformIO Core (CLI)](https://docs.platformio.org/en/latest/core/installation/index.html) oder die VS Code PlatformIO IDE installiert ist.

```bash
cd firmware/esp32-growmaster

# 1. Projekt kompilieren (Abhängigkeiten werden automatisch geladen)
pio run

# 2. Firmware per USB auf den ESP32 flashen
pio run --target upload

# 3. Seriellen Monitor öffnen (115200 Baud)
pio device monitor
```

---

## 6. Vorab-Test der Server-Schnittstelle mit `curl`

Bevor der ESP32 im Zelt verbaut wird, kannst du das Geräte-Token und die Server-Verbindung direkt vom Terminal aus mit `curl` testen:

```bash
curl -X POST "https://dein-growmaster-server.de/api/device/v1/report" \
  -H "Authorization: Bearer gmd_dein_geraete_token_aus_der_app" \
  -H "Content-Type: application/json" \
  -d '{
    "readings": {
      "airTemp": 24.8,
      "airRh": 61,
      "co2": 620,
      "leafTemp": 23.6,
      "waterTemp": 20.4,
      "waterEc": 1.65,
      "waterPh": 5.85,
      "waterLevel": 78,
      "soilMoisture": 54,
      "leak": 0
    },
    "state": {
      "light": 80,
      "exhaust": 45,
      "intake": 35,
      "circulation": 60,
      "heater": 0,
      "cooler": 0,
      "humidifier": 0,
      "dehumidifier": 0,
      "co2": 0,
      "pump": 0,
      "doser": 0
    },
    "acks": [],
    "firmware": "gm-esp32 0.1"
  }'
```

Erwartete Antwort (`200 OK`):

```json
{
  "ok": true,
  "serverTime": 1731400000000,
  "pollSeconds": 30,
  "accepted": 10,
  "ignored": 0,
  "commands": [],
  "failsafe": {
    "afterSeconds": 300,
    "set": {
      "pump": 0,
      "doser": 0,
      "co2": 0,
      "heater": 0,
      "humidifier": 0,
      "exhaust": 50,
      "intake": 40
    },
    "light": "keep-schedule"
  }
}
```
