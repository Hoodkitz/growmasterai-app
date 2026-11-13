# Technisches Datenblatt & Schaltungsunterlagen: GrowMaster „Smart Grow“ Steuerungs- und Sensorschrank (Prototyp v1.0)

**Projekt:** GrowMaster AI – Smart Grow Mess-, Steuer- und Regelungstechnik (MSR)  
**Zielgruppe:** Ausbilder / Dozenten & Auszubildende im Beruf **Elektroniker/-in für Betriebstechnik (IHK)**  
**Dokumentenart:** Pflichtenheft, Klemmen- & Schaltplan, Schnittstellenspezifikation, Stückliste (BOM) und Prüfprotokoll nach DIN VDE  
**Stand:** 12.11.2026 · **Firmware-/Protokoll-Version:** `gm-esp32 v1.0` (`/api/device/v1/report` & `/api/device/v1/snapshot`)

---

## 1. Systemübersicht & Ausbildungsrelevanz (Elektroniker für Betriebstechnik)

Das **GrowMaster Smart-Grow-System** ist eine modular aufgebaute, industrienahe **Mess-, Steuer- und Regelungseinheit (MSR)** zur vollautomatischen Klimatisierung, Beleuchtungssteuerung, Bewässerung und präzisen Nährstoffdosierung in geschlossenen Pflanzenkultursystemen.

Für den Prototypenbau im Rahmen der Ausbildung **Elektroniker/-in für Betriebstechnik** vereint das Projekt sämtliche Kernkompetenzen der Ausbildungsordnung:

1. **Trennung von Haupt- und Steuerstromkreis** (230 V AC Netzspannung vs. 12 V / 5 V / 3,3 V DC SELV-Schutzkleinspannung gemäß **DIN VDE 0100-410** und **DIN EN 60204-1**).
2. **Schutzmaßnahmen in feuchten/nassen Betriebsstätten** (Fehlerstrom-Schutzschalter **RCD Typ A/B $I_{\Delta n} \le 30\,\text{mA}$**, Leitungs- und Geräteschutz, Schutzart **IP54/IP65**, Potenzialausgleich).
3. **Industrielle Aktor-Schnittstellen:**
   - **0–10 V DC Analog- bzw. 10 V PWM-Steuersignale** (5 kHz) für dimmbare LED-Treiber (z. B. MeanWell) und EC-Rohrlüfter.
   - **Schütz-/Koppelrelais- und Halbleiterrelais-Ansteuerung (SSR)** mit Optokoppler-Trennung und Entstörbeschaltung (RC-Snubber / Freilaufdioden).
   - **Gleichstrom-Leistungselektronik (MOSFET-Low-Side-Schalter)** für 6 peristaltische Dosierpumpen (12 V DC).
4. **Sensorik & Signalaufbereitung:**
   - **Digitale Feldbusse:** I²C (3,3 V) und OneWire.
   - **Analoge Messtechnik (0–3,3 V ADC):** Elektrochemische pH- und Leitfähigkeitssonden (EC) inkl. **galvanischer Trennung** (Vermeidung von Masseschleifen/Elektrolyse im Tank) sowie kapazitive Substratfeuchte.
   - **Laufzeit-/Impulsmessung:** Ultraschall-Füllstandsmessung mit Pegelanpassung (5 V → 3,3 V Spannungsteiler).
5. **Mehrstufiges Sicherheits- und Failsafe-Konzept:**
   - Hardwareseitige Verriegelung (Not-Aus / Rauchmelder / Leckage-Überwachung / stromlos geschlossene NC-Magnetventile).
   - Autonomer Mikrocontroller-Notbetrieb (Failsafe + Watchdog) bei Netzwerk- oder Serverausfall.

---

## 2. Gesamtarchitektur & Blockschaltbild

```
+===================================================================================================+
|                        SCHALTSCHRANK / HUTSCHIENENVERTEILER (IP54 / IP65)                         |
|                                                                                                   |
|  [230V AC / 50Hz Einspeisung L1, N, PE]                                                           |
|         |                                                                                         |
|    [-F1: RCD 25A / 30mA (Typ A)]                                                                  |
|         |                                                                                         |
|         +---> [-F2: LS B16A] ---> Hauptstromkreis 230V AC ---> Schütze/Relais -K1..-K6 (Steckd.)  |
|         |                                                                                         |
|         +---> [-F3: LS B2A] ----> [-T1: Hutschienen-NT 12V DC / 5A (60W, SELV)]                   |
|                                         |                                                         |
|                                         +---> 12V DC Rail: 6x Dosierpumpen (-M1..-M6),            |
|                                         |                  0-10V OpAmp-Versorgung (-U2)           |
|                                         |                                                         |
|                                         +---> [-T2: Step-Down Buck 12V -> 5V DC / 3A]             |
|                                                    |                                              |
|                                                    +---> 5V DC Rail: ESP32 (-A1), ESP32-CAM (-A2),|
|                                                                      Relaisspulen, pH/EC-Isolator,|
|                                                                      JSN-SR04T Ultraschall        |
|                                                                      |                            |
|                                                                [3.3V LDO auf ESP32]               |
|                                                                      |                            |
|                                                                3.3V Sensorbus (I2C, OneWire, ADC) |
+===================================================================================================+
```

---

## 3. Vollständige Übersicht aller unterstützten Sensoren & Aktoren

Das GrowMaster-Protokoll v1 (`shared/smartgrow/types.ts`) unterstützt **20 Sensormetriken**, **14 Aktortypen** (davon 1 Mehrkanal-Dosierer mit **6 Dosierkanälen**) sowie **1 optisches Kameramodul**.

### 3.1 Unterstützte Sensoren (`METRICS`)

| BMK    | Protokoll-Key     | Messgröße                         |        Messbereich (Plausibilität)         |       Auflösung / Einheit       | Schnittstelle / Pegel                       | Referenz-Bauteil (Prototyp)              |            ESP32-Pin (Referenz)            |
| :----- | :---------------- | :-------------------------------- | :----------------------------------------: | :-----------------------------: | :------------------------------------------ | :--------------------------------------- | :----------------------------------------: |
| `-B1`  | `airTemp`         | Lufttemperatur Blätterdach        |      $-10 \dots +60\,^\circ\text{C}$       |     $0{,}1\,^\circ\text{C}$     | I²C (`0x44`), 3,3 V                         | Sensirion SHT31-D / SHT40                |          GPIO 21 (SDA) / 22 (SCL)          |
| `-B1`  | `airRh`           | Relative Luftfeuchte              |             $0 \dots 100\,\%$              |             $1\,\%$             | I²C (`0x44`), 3,3 V                         | Sensirion SHT31-D / SHT40                |          GPIO 21 (SDA) / 22 (SCL)          |
| `-B2`  | `co2`             | CO₂-Konzentration                 |      $150 \dots 10\,000\,\text{ppm}$       |         $1\,\text{ppm}$         | I²C (`0x62`), 3,3 V                         | Sensirion SCD40 / SCD41 (NDIR)           |          GPIO 21 (SDA) / 22 (SCL)          |
| `-B3`  | `leafTemp`        | IR-Blattoberflächentemperatur     |      $-10 \dots +60\,^\circ\text{C}$       |     $0{,}1\,^\circ\text{C}$     | I²C (`0x5A`), 3,3 V                         | Melexis MLX90614ESF-BAA                  |          GPIO 21 (SDA) / 22 (SCL)          |
| `-B4`  | `waterTemp`       | Wassertemperatur Nährstofftank    |       $0 \dots +45\,^\circ\text{C}$        |     $0{,}1\,^\circ\text{C}$     | OneWire, 3,3 V                              | Maxim DS18B20 (V4A-Hülse)                | GPIO 4 (+ $4{,}7\,\text{k}\Omega$ Pull-up) |
| `-B5`  | `waterPh`         | pH-Wert Nährstofftank             |     $0{,}00 \dots 14{,}00\,\text{pH}$      |            $0{,}01$             | Analog $0 \dots 3{,}0\,\text{V}$ (ADC1)     | DFRobot Gravity pH V2 + BNC-Sonde        |             GPIO 34 (ADC1_CH6)             |
| `-B6`  | `waterEc`         | Leitwert (EC) Nährstofftank       |    $0{,}00 \dots 10{,}00\,\text{mS/cm}$    |     $0{,}01\,\text{mS/cm}$      | Analog $0 \dots 3{,}0\,\text{V}$ (ADC1)     | DFRobot Gravity EC V2 ($K=1$) + Isolator |             GPIO 35 (ADC1_CH7)             |
| `-B7`  | `soilMoisture`    | Substrat-/Bodenfeuchte            |             $0 \dots 100\,\%$              |             $1\,\%$             | Analog $1{,}2 \dots 3{,}0\,\text{V}$ (ADC1) | Kapazitiver Sensor v2.0 (TLC555)         |          GPIO 36 / VP (ADC1_CH0)           |
| `-B8`  | `waterLevel`      | Füllstand Nährstofftank           |             $0 \dots 100\,\%$              |             $1\,\%$             | Ultraschall Trigger/Echo                    | JSN-SR04T (wasserdicht) / Schwimmer      |       Trig: GPIO 12 / Echo: GPIO 32        |
| `-B9`  | `leak`            | Leckage-/Wassermelder Boden       |         $0$ (trocken) / $1$ (nass)         |         Digital (1 Bit)         | Digital In (Active-LOW)                     | LM393-Komparator + Bodensonde            |                GPIO 39 / VN                |
| `-B10` | `ppfd`            | Photosynthetische Lichtstärke     | $0 \dots 3000\,\mu\text{mol/m}^2\text{/s}$ | $1\,\mu\text{mol/m}^2\text{/s}$ | I²C (`0x23` / `0x10` / RS485)               | VEML7700 / AS7341 / Apogee PAR           |              I²C (GPIO 21/22)              |
| `-B11` | `soilEc`          | Substrat-Leitfähigkeit            |    $0{,}00 \dots 10{,}00\,\text{mS/cm}$    |     $0{,}01\,\text{mS/cm}$      | RS485 Modbus RTU                            | 3-in-1 FDR Boden-Sensor (RS485)          |         UART2 / MAX485 (optional)          |
| `-B12` | `soilTemp`        | Substrattemperatur                |      $-10 \dots +50\,^\circ\text{C}$       |     $0{,}1\,^\circ\text{C}$     | OneWire / RS485                             | DS18B20 (Bus-Adresse 2) / FDR            |            GPIO 4 (OneWire-Bus)            |
| `-B13` | `soilPh`          | Substrat-pH                       |     $0{,}00 \dots 14{,}00\,\text{pH}$      |            $0{,}01$             | RS485 Modbus RTU                            | Bodensonde RS485                         |         UART2 / MAX485 (optional)          |
| `-B14` | `runoffEc`        | Drainwasser-EC (Salzstau)         |    $0{,}00 \dots 15{,}00\,\text{mS/cm}$    |     $0{,}01\,\text{mS/cm}$      | Analog / I²C (ADS1115)                      | EC-Messzelle im Drain-Auffang            |         I²C-ADC `0x48` (optional)          |
| `-B15` | `runoffPh`        | Drainwasser-pH                    |     $0{,}00 \dots 14{,}00\,\text{pH}$      |            $0{,}01$             | Analog / I²C (ADS1115)                      | pH-Messzelle im Drain-Auffang            |         I²C-ADC `0x48` (optional)          |
| `-B16` | `dissolvedOxygen` | Gelöster Sauerstoff ($O_2$ Hydro) |     $0{,}0 \dots 25{,}0\,\text{mg/l}$      |      $0{,}1\,\text{mg/l}$       | Analog / I²C                                | Galvanische DO-Sonde                     |         I²C-ADC `0x48` (optional)          |
| `-B17` | `smoke`           | Rauch-/Brandmelder Zelt           |           $0$ (OK) / $1$ (Alarm)           |         Digital (1 Bit)         | Potenzialfreier Relaiskontakt               | Rauchwarnmelder mit Koppelrelais         |         Hardware-Interlock + GPIO          |
| `-B18` | `door`            | Zelt-Türkontakt                   |           $0$ (zu) / $1$ (offen)           |         Digital (1 Bit)         | Reed-Magnetschalter (NC)                    | Magnetkontakt an Reißverschluss/Tür      |            GPIO / I²C-Expander             |
| `-B19` | `power`           | Elektrische Wirkleistung          |        $0 \dots 10\,000\,\text{W}$         |          $1\,\text{W}$          | Modbus / WLAN / Impuls                      | Shelly Pro 1PM / PZEM-004T v3            |           Home Assistant / UART            |

---

### 3.2 Unterstützte Aktoren (`ACTUATORS`) & Dosierkanäle (`DOSER_CHANNELS`)

| BMK    | Protokoll-Key         | Funktion / Aggregat          |  Befehlsart (`kind`)   |        Stellbereich         | Elektrische Ansteuerung                         | Lasttyp & Schutzbeschaltung                                          | ESP32-Pin (Referenz) |
| :----- | :-------------------- | :--------------------------- | :--------------------: | :-------------------------: | :---------------------------------------------- | :------------------------------------------------------------------- | :------------------: |
| `-E1`  | `light`               | LED-Hauptbeleuchtung         |        `"set"`         |      $0 \dots 100\,\%$      | PWM 5 kHz → **0–10 V DC** (oder 10 V PWM)       | Dimmeingang LED-Treiber ($I < 2\,\text{mA}$) + Schütz bei $0\,\%$    |  GPIO 25 (LEDC CH0)  |
| `-M7`  | `exhaust`             | Abluft-EC-Rohrlüfter         |        `"set"`         |      $0 \dots 100\,\%$      | PWM 5 kHz → **0–10 V DC / 10 V PWM**            | EC-Motor Steuereingang (RJ45 / 3,5 mm / Klemme)                      |  GPIO 26 (LEDC CH1)  |
| `-M8`  | `intake`              | Zuluft-EC-Lüfter             |        `"set"`         |      $0 \dots 100\,\%$      | PWM 5 kHz → **0–10 V DC / 10 V PWM**            | EC-Motor Steuereingang                                               |  GPIO 27 (LEDC CH2)  |
| `-M9`  | `circulation`         | Umluft-Ventilator            |        `"set"`         |      $0 \dots 100\,\%$      | PWM 5 kHz → **10 V PWM / 5 V PWM**              | DC/EC-Clipventilator PWM-Eingang                                     |  GPIO 14 (LEDC CH3)  |
| `-K1`  | `heater`              | Zelt-Heizung                 |        `"set"`         |       $0$ / $100\,\%$       | Digital Out → Optokoppler → **Schütz 16 A**     | 230 V AC / max. 2000 W (ohmsche Last, AC-1)                          |       GPIO 16        |
| `-K2`  | `cooler`              | Klimagerät / Kühlung         |        `"set"`         |       $0$ / $100\,\%$       | Digital Out → Optokoppler → **Schütz 16 A**     | 230 V AC Kompressor (induktiv, AC-3, Snubber!)                       |       GPIO 17        |
| `-K3`  | `humidifier`          | Luftbefeuchter (Ultraschall) |        `"set"`         |       $0$ / $100\,\%$       | Digital Out → Optokoppler → **Relais 10 A**     | 230 V AC / 24 V DC Ultraschallvernebler                              |       GPIO 18        |
| `-K4`  | `dehumidifier`        | Luftentfeuchter              |        `"set"`         |       $0$ / $100\,\%$       | Digital Out → Optokoppler → **Schütz 16 A**     | 230 V AC Kompressor (AC-3, RC-Snubber!)                              |       GPIO 19        |
| `-Y1`  | `co2`                 | CO₂-Magnetventil             |        `"set"`         |       $0$ / $100\,\%$       | Digital Out → Optokoppler → **Relais / MOSFET** | 12 V DC oder 230 V AC **NC-Magnetventil (stromlos zu!)**             |       GPIO 23        |
| `-M10` | `pump`                | Bewässerungspumpe            |   `"run"` ($t$ in s)   |   $1 \dots 600\,\text{s}$   | Digital Out → Optokoppler → **Relais / MOSFET** | 12 V / 24 V DC oder 230 V AC Tauch-/Membranpumpe                     |       GPIO 13        |
| `-M1`  | `doser` (`nutrientA`) | Dosierpumpe 1: Dünger A      | `"dose"` ($\text{ml}$) | $0{,}5 \dots 50\,\text{ml}$ | Digital Out → **N-MOSFET Low-Side (12 V DC)**   | 12 V DC Peristaltikpumpe ($\approx 0{,}4\,\text{A}$) + Freilaufdiode |       GPIO 15        |
| `-M2`  | `doser` (`nutrientB`) | Dosierpumpe 2: Dünger B      | `"dose"` ($\text{ml}$) | $0{,}5 \dots 50\,\text{ml}$ | Digital Out → **N-MOSFET Low-Side (12 V DC)**   | 12 V DC Peristaltikpumpe ($\approx 0{,}4\,\text{A}$) + Freilaufdiode |        GPIO 2        |
| `-M3`  | `doser` (`bloom`)     | Dosierpumpe 3: Blütedünger   | `"dose"` ($\text{ml}$) | $0{,}5 \dots 50\,\text{ml}$ | Digital Out → **N-MOSFET Low-Side (12 V DC)**   | 12 V DC Peristaltikpumpe ($\approx 0{,}4\,\text{A}$) + Freilaufdiode |        GPIO 0        |
| `-M4`  | `doser` (`calmag`)    | Dosierpumpe 4: Cal-Mag       | `"dose"` ($\text{ml}$) | $0{,}5 \dots 50\,\text{ml}$ | Digital Out → **N-MOSFET Low-Side (12 V DC)**   | 12 V DC Peristaltikpumpe ($\approx 0{,}4\,\text{A}$) + Freilaufdiode |        GPIO 5        |
| `-M5`  | `doser` (`phDown`)    | Dosierpumpe 5: pH Minus      | `"dose"` ($\text{ml}$) | $0{,}5 \dots 50\,\text{ml}$ | Digital Out → **N-MOSFET Low-Side (12 V DC)**   | 12 V DC Peristaltikpumpe (Säurebeständig: Santoprene/Viton)          |       GPIO 33        |
| `-M6`  | `doser` (`phUp`)      | Dosierpumpe 6: pH Plus       | `"dose"` ($\text{ml}$) | $0{,}5 \dots 50\,\text{ml}$ | Digital Out → **N-MOSFET Low-Side (12 V DC)**   | 12 V DC Peristaltikpumpe + Freilaufdiode                             |  GPIO 20 / MCP23017  |
| `-Y2`  | `waterValve`          | Frischwasser-Zulaufventil    |        `"set"`         |       $0$ / $100\,\%$       | Digital Out → Relais / MOSFET                   | 12 V DC **NC-Magnetventil** (nur mit Füllstandsensor!)               |   Erweiterungs-Pin   |
| `-K5`  | `chiller`             | Durchlaufkühler Nährlösung   |        `"set"`         |       $0$ / $100\,\%$       | Digital Out → Schütz                            | 230 V AC Aggregat                                                    |   Erweiterungs-Pin   |
| `-K6`  | `airPump`             | Belüftungspumpe (Hydro-O₂)   |        `"set"`         |       $0$ / $100\,\%$       | Digital Out → Relais                            | 230 V AC Membranluftpumpe                                            |   Erweiterungs-Pin   |

> **Praxis-Tipp für den Prototypenbau mit dem Dozenten (Strapping-Pins des ESP32):**  
> Die Pins **GPIO 0, GPIO 2, GPIO 5, GPIO 12 und GPIO 15** sind beim ESP32-WROOM-32 sogenannte _Boot-Strapping-Pins_.
>
> - **GPIO 0** darf beim Einschalten **nicht auf LOW** gezogen werden (sonst startet der ESP32 im Flash-Bootloader-Modus).
> - **GPIO 12** darf beim Booten **nicht auf HIGH** gezogen werden (setzt sonst die interne Flash-Spannung auf 1,8 V statt 3,3 V).
> - **GPIO 20** ist auf Standard-ESP32-WROOM-32-Modulen nicht herausgeführt.  
>   **Empfehlung für den sauberen Schaltschrank-Prototypen:** Entweder einen **I²C-Port-Expander (`MCP23017` oder `PCF8575` auf Adresse `0x20`)** an den bestehenden I²C-Bus (`GPIO 21 / 22`) hängen, der alle 6 Relais + 6 Dosier-MOSFETs völlig rückwirkungsfrei schaltet, oder bei direkter GPIO-Nutzung Gate-Pulldown-Widerstände ($10\,\text{k}\Omega$ nach GND) an GPIO 2, 5, 15, 33 verwenden und Kanal 6 (`phUp`) auf **GPIO 4** (falls OneWire entfällt) bzw. über den I²C-Expander führen.

---

## 4. Schaltpläne & Schaltungstechnik (Detailzeichnungen)

### 4.1 Schaltplan 1: 230 V AC Einspeisung, Schutzorgane & SELV-Spannungsversorgung

```
L1 (230V AC, 50Hz) ───┬───────────────────────────────────────────────────────────┐
N  (Neutralleiter) ───┼──┬─────────────────────────────────────────────────────┐  │
PE (Schutzleiter)  ───┼──┼──┬───────────────────────────────────────────────┐  │  │
                      │  │  │                                               │  │  │
                     ┌┴──┴┐ │  -F1: Fehlerstromschutzschalter (RCD)         │  │  │
                     │RCD │ │       2-polig, 25A, I_Δn = 30 mA, Typ A       │  │  │
                     │30mA│ │       (Pflicht nach DIN VDE 0100-410)         │  │  │
                     └┬──┬┘ │                                               │  │  │
                      │  │  ├───► PE-Sammelschiene (Hutschiene, grün/gelb) ◄┘  │  │
         ┌────────────┴──┼──┐                                                  │  │
         │               │  └───────────────┬──────────────────────┐           │  │
        ┌┴─┐            ┌┴─┐               ┌┴─┐                   ┌┴─┐         │  │
   -F2  │LS│ B16A       │N │          -F3  │LS│ B2A               │N │         │  │
        └┬─┘ (Last)     └┬─┘               └┬─┘ (Steuerung)       └┬─┘         │  │
         │               │                  │                      │           │  │
         ▼               ▼                  ▼                      ▼           │  │
  [Zu den Schaltkontakten der        ┌────────────────────────────────────┐    │  │
   Lastschütze -K1 bis -K6]          │ -T1: Hutschienen-Schaltnetzteil    │    │  │
                                     │      MeanWell HDR-60-12 (SELV)     │    │  │
                                     │      In: 230V AC | Out: 12V DC, 5A │    │  │
                                     └──────┬──────────────────────┬──────┘    │  │
                                            │ +12V DC              │ 0V (GND)  │  │
                                           ┌┴┐                     │           │  │
                                      -F4  │ │ Feinsicherung 4A T  │           │  │
                                           └┬┘                     │           │  │
                                            ├──► +12V_PWR (Dosierpumpen -M1..6)│  │
                                            ├──► +12V_OPAMP (0-10V Wandler)    │  │
                                            │                      │           │  │
                                     ┌──────┴──────────────────────┴──────┐    │  │
                                     │ -T2: DC/DC Buck-Converter          │    │  │
                                     │      In: 12V DC  | Out: 5V DC, 3A  │    │  │
                                     └──────┬──────────────────────┬──────┘    │  │
                                            │ +5V DC               │ GND       │  │
                                            ├──► ESP32 (-A1) VIN / 5V-Pin      │  │
                                            ├──► ESP32-CAM (-A2) 5V-Pin        │  │
                                            ├──► Relaisplatine JD-VCC (Spulen) │  │
                                            └──► B0505S-1W (Isolator EC-Sonde) │  │
```

---

### 4.2 Schaltplan 2: PWM-zu-0–10 V-Analogwandler (4 Kanäle: `light`, `exhaust`, `intake`, `circulation`)

Professionelle LED-Vorschaltgeräte (MeanWell ELG/HLG-AB-Serie, Lumatek, Sanlight) und EC-Rohrlüfter erwarten ein **0–10 V DC Steuersignal** (oder 10 V PWM). Da der ESP32 nur **3,3 V PWM (5 kHz, 10 Bit)** ausgibt, wandelt ein zweistufiger RC-Tiefpass mit nachgeschaltetem nicht-invertierendem Operationsverstärker (`LM358` oder `TLV2374`, Verstärkungsfaktor $G = 1 + \frac{R_4}{R_3} = 1 + \frac{20\,\text{k}\Omega}{10\,\text{k}\Omega} = 3{,}03$) das 3,3 V-PWM-Signal präzise in $0{,}0 \dots 10{,}0\,\text{V DC}$ um:

```
                                    +12V DC (aus -T1)
                                          │
                                          ├───┬───────────┐
                                         ─┴─  │ 100nF     │
                                         ─┬─  │ Keramik   │ V+ (Pin 8)
                                         GND  │         ┌─┴──────┐
ESP32 GPIO 25/26/27/14                        │         │        │
(3,3V PWM, f = 5 kHz)    R1 = 10 kΩ    R2 = 10 kΩ      │  1/2   │     R5 = 100 Ω
─────────────────────────┬──[10k]──┬──────[10k]──┬─────►│+ LM358 │──────[100Ω]────┬──► 0–10V OUT (DIM+)
                         │         │             │      │        │                │    (an Klemme X3)
                        R0        ─┴─ C1        ─┴─ C2 ┌┤-       │               ─┴─
                       100kΩ      ─┬─ 1µF       ─┬─ 1µF│└─┬──────┘               ╱▲╲  ZD1: Z-Diode 11V
                      (Pulldown    │  Folienk.   │     │  │ V- (Pin 4)           ─┬─  (Überspannungsschutz)
                       bei Boot)  GND           GND    │ GND                      │
                         │                             │                         GND (DIM-)
                        GND                            ├────[ R4 = 20 kΩ (1%) ]───┘
                                                       │
                                                      ┌┴┐
                                                      │ │ R3 = 10 kΩ (1%)
                                                      └┬┘
                                                       │
                                                      GND
```

- **Funktionsweise:**
  - `R0 (100 kΩ)` zieht den Eingang während des ESP32-Resets definiert auf `0 V` (verhindert kurzes Aufblitzen der Lampe / Hochlaufen der Lüfter beim Einschalten).
  - `R1/C1` und `R2/C2` ($f_g = \frac{1}{2\pi \cdot 10\,\text{k}\Omega \cdot 1\,\mu\text{F}} \approx 15{,}9\,\text{Hz} \ll 5\,\text{kHz}$) glätten das 5-kHz-PWM-Signal zu einer restwelligkeitsfreien Gleichspannung von $0 \dots 3{,}30\,\text{V}$.
  - Der Operationsverstärker `LM358` verstärkt mit $G = 3{,}03$ auf $0{,}00 \dots 10{,}00\,\text{V DC}$.

---

### 4.3 Schaltplan 3: 6-Kanal MOSFET-Endstufe für 12 V DC Peristaltik-Dosierpumpen (`-M1` bis `-M6`)

Für die millimetergenaue Förderung von `nutrientA`, `nutrientB`, `bloom`, `calmag`, `phDown` und `phUp` werden 6 selbstansaugende 12 V-Peristaltikpumpen über **Logic-Level N-Kanal-MOSFETs** (z. B. `IRLZ44N` im TO-220-Gehäuse oder `AOD4184` SMD, $U_{GS(\text{th})} < 2{,}0\,\text{V}$, voll durchgesteuert bei $3{,}3\,\text{V}$) im Low-Side-Betrieb geschaltet:

```
                                              +12V_PWR (abgesichert über -F4: 4A T)
                                                     │
                                             ┌───────┴───────┐
                                             │               │
                                            ─┴─             ┌┴┐
                                            ╱▲╲ D1: 1N4007  │M│ -M1..M6: Peristaltikpumpe
                                            ─┬─ (Freilauf-  │=│          12V DC / 0,4 A
                                             │   diode!)    └┬┘          (Förderrate ~1,2 ml/s)
                                             └───────┬───────┘
                                                     │
                                                     ├─── Drain (D)
                                                   ┌─┴─┐
ESP32 GPIO (oder MCP23017)      R_G = 100 Ω        │   │  Q1: IRLZ44N / AOD4184
(Active-HIGH, 3,3V) ───────────┬───[100Ω]─────────►│ G │      (Logic-Level N-MOSFET)
                               │                   │   │
                              ┌┴┐                  └─┬─┘
                              │ │ R_PD = 10 kΩ       ├─── Source (S)
                              └┬┘ (Gate-Pulldown!)   │
                               │                     │
                              GND                   GND (Gemeinsame Masse 12V / ESP32)
```

- **Wichtige Details für die Betriebstechnik-Praxis:**
  1. **`R_PD (10 kΩ)` zwischen Gate und GND ist zwingend erforderlich**, damit die Pumpen beim Einschalten des Schaltschranks (solange die ESP32-Pins hochohmig sind) garantiert **ausgeschaltet** bleiben (verhindert unkontrollierte Säure-/Düngerdosierung beim Booten!).
  2. **`D1 (1N4007)` in Sperrrichtung parallel zum Pumpenmotor** schließt die Induktionsspannung ($U = -L \cdot \frac{\text{d}i}{\text{d}t}$) beim Abschalten kurz und schützt den MOSFET vor Zerstörung.

---

### 4.4 Schaltplan 4: Galvanisch getrennte 230 V AC Lastschaltung (`heater`, `cooler`, `humidifier`, `dehumidifier`, `co2`, `pump`) inkl. Hardware-Sicherheitsverriegelung

Im professionellen Aufbau nach **DIN EN 60204-1** schalten die Printrelais des Mikrocontrollers **nicht** direkt 2000-W-Heizlüfter oder Kompressoren, sondern steuern **Hutschienen-Installationsschütze** (`-K1` bis `-K6`, z. B. Finder Serie 22 / Hager ESC225 mit 230 V- oder 12 V/24 V-Spule). Zusätzlich sind **Rauchmelder (`-B17`)** und **Not-Halt (`-S0`)** direkt hardwareseitig in den Spulenstromkreis eingeschleift:

```
=== STEUERSTROMKREIS (SELV 3,3V / 5V DC) ===          === HAUPTSTROMKREIS (230V AC / 16A) ===

+3,3V (ESP32)                                          L1 (von LS-Schalter -F2: B16A)
  │                                                      │
 ┌┴┐ R = 330 Ω                                     ┌─────┴─────┐ (Hardware-Freigabe:
 │ │                                               │  -S0      │  Not-Halt / Rauchmelder -B17
 └┬┘       Optokoppler PC817                       │  Öffner   │  unterbricht alle Schützspulen!)
  │      ┌───────────────────┐                     └─────┬─────┘
  ▼      │  1             4  │      +5V (JD-VCC)         │
 [LED]───┤►├─┐           ┌───├──────────┐                │      L1 (Last)
         │   │   ≈≈≈     │ C │          │                │        │
         │  2├───────────┼─E │          ├───┐            │      ──┴── -K1 (Hauptkontakt Schütz)
         └───┼───┐       └─┬─┘         ─┴─  │            │       /
             └───┼─────────┼────────┐  ╱▲╲ ┌┴┐ Spule     │      ──┬──
                 │         │        │  ─┬─ │/│ Koppel-   │        ├───┬──────────────► Steckdose L'
ESP32 GPIO 16..23│        ┌┴┐       │   ├──┴─┘ relais    │       ┌┴┐  │                (z.B. Heizung)
(Active-LOW) ────┘        │ │ 1kΩ   │   │                │  100Ω │ │ ─┴─ 100nF X2
                          └┬┘       │   ▼                │  Snub.└┬┘ ─┬─ (RC-Löschglied)
                           │      ┌─┴───┴─┐              │        └───┤
                           └─────►│B  Q2  │ NPN (S8050)  │            ▼
                                  └───┬───┘              │        N (Neutralleiter)
                                      │                  │        PE (Schutzleiter durchgehend!)
                                     GND (5V)
```

- **Hardware-Interlocks (unabhängig von Software/WLAN):**
  1. **Rauchmelder (`-B17`) / Thermoschalter ($\vartheta > 45\,^\circ\text{C}$):** Öffnerkontakt liegt in Reihe zur Schütz-Steuerspannung für Heizung (`-K1`), Licht (`-E1`) und Lüftung → schaltet bei Rauchentwicklung oder Übertemperatur **sofort stromlos**.
  2. **CO₂-Magnetventil (`-Y1`):** Zwingend **NC (Normally Closed / stromlos geschlossen)**. Optional: Tür-Reedkontakt (`-B18`, Schließer bei geschlossener Tür) in Reihe zur Ventilspule, sodass bei geöffneter Zelttür technisch kein CO₂ ausströmen kann.
  3. **Schwimmerschalter-Trockenlaufschutz (Hardware-Backup zu `-B8`):** Ein einfacher Reed-Schwimmerschalter am Tankboden kann direkt in die Masseleitung des Pumpenrelais (`-M10`) eingeschleift werden.

---

### 4.5 Schaltplan 5: Sensor-Frontends (I²C, OneWire, Ultraschall-Pegelwandler & Galvanisch getrennte pH/EC-Messung)

```
A) I²C-KLIMABUS (3,3V)                        B) ONEWIRE-WASSERTEMPERATUR (-B4: DS18B20)
======================                        ==========================================
+3,3V ──┬──────┬──────┬───────► VCC           +3,3V ──────────┬────────────────► Rot (VCC)
       ┌┴┐    ┌┴┐     │                                      ┌┴┐
  4,7kΩ│ │    │ │4,7kΩ│                                 4,7kΩ│ │ Pull-up
       └┬┘    └┬┘     │  ┌─────────────┐                     └┬┘
GPIO 21─┴──────┼──────┼─►│ SHT31 (0x44)│      GPIO 4 ─────────┴────────────────► Gelb (DQ)
(SDA)          │      │  │ SCD41 (0x62)│      GND ─────────────────────────────► Schwarz (GND)
GPIO 22────────┴──────┼─►│ MLX90 (0x5A)│
(SCL)                 │  └──────┬──────┘
GND ──────────────────┴─────────┴──► GND

C) ULTRASCHALL-FÜLLSTAND (-B8: JSN-SR04T)     D) GALVANISCHE TRENNUNG EC-/pH-SONDEN IM TANK!
=========================================     ==============================================
+5V DC ─────────────────────────► VCC         Warum? pH- und EC-Sonde tauchen gleichzeitig in
GPIO 12 (Out) ──────────────────► TRIG        dieselbe leitfähige Nährlösung. Ohne Isolator
                                              verfälscht der EC-Wechselstrom das mV-Signal der
JSN-SR04T ECHO (5,0V Pegel!)                  hochohmigen pH-Glaselektrode!
  │
 ┌┴┐ R_A = 10 kΩ                              +5V ──► [B0505S-1W DC/DC-Isolator] ──► +5V_ISO
 │ │                                          GND ──► [  (1000V DC Trennung)   ] ──► GND_ISO
 └┬┘                                                                                    │
  ├─────────────────────────────► GPIO 32     [EC-Sonde -B6] ──► [EC-Board] ──► [Trennverstärker]
 ┌┴┐                              (3,3V In!)                                            │
 │ │ R_B = 20 kΩ                                                                        ▼
 └┬┘   (U_GPIO32 = 5V * 20k/30k = 3,33V)                                         GPIO 35 (ADC1)
  │
 GND
```

---

### 4.6 Schaltplan 6: Kameramodul (`-A2`: AI-Thinker ESP32-CAM mit OV2640)

```
+5V DC (aus Buck-Converter -T2, mind. 500 mA Spitzenstrom bei WLAN-TX!)
  │
  ├───┬──────────────────► Pin "5V"  am ESP32-CAM (AI-Thinker)
 ─┴─  │ C_Puffer
 ─┬─  │ 470 µF / 10V Elko (direkt an 5V/GND gegen Brownout-Reset!)
  │   │
 GND ─┴──────────────────► Pin "GND" am ESP32-CAM

Interne Belegung (bereits auf dem ESP32-CAM-Modul verdrahtet):
- Kamera OV2640 (SCCB/I²C: SIOD=GPIO26, SIOC=GPIO27; Daten: Y2..Y9=GPIO 5,18,19,21,36,39,34,35)
- PSRAM (4 MB, zwingend für SXGA 1280x1024 JPEG-Aufnahme)
- Sendet alle 30 Min. (nur während der Lichtphase, ohne erste/letzte 20 Min. Dimmrampe)
  ein JPEG per HTTPS POST an /api/device/v1/snapshot.
```

---

## 5. Klemmenplan für den Schaltschrank-Aufbau (`X1` bis `X6`)

Damit der Schaltschrank übersichtlich auf einer Hutschiene (z. B. mit **WAGO TOPJOB S Reihenklemmen** oder **Phoenix Contact Push-in-Klemmen**) aufgebaut werden kann, ist folgende Klemmleisten-Aufteilung vorgesehen:

| Klemmleiste             |       Klemme       | Bezeichnung / Signal                  |             Potenzial / Spannung             | Zielgerät im Feld (Zelt / Tank)               | Steckverbinder am Gehäuse        |
| :---------------------- | :----------------: | :------------------------------------ | :------------------------------------------: | :-------------------------------------------- | :------------------------------- |
| **`X1` (Netz)**         | `X1:L1`, `N`, `PE` | Netzeinspeisung                       |          $230\,\text{V AC / 50 Hz}$          | Zuleitung über CEE 7/7 / Festanschluss        | M20 Kabelverschraubung IP68      |
| **`X2` (230V Last)**    | `X2:1` (L, N, PE)  | Heizung (`heater`)                    |    $230\,\text{V AC}$ (geschaltet `-K1`)     | Schuko-Einbausteckdose 1 (Rot)                | Schuko-Flanschsteckdose IP54     |
| **`X2` (230V Last)**    | `X2:2` (L, N, PE)  | Kühlung (`cooler`)                    |    $230\,\text{V AC}$ (geschaltet `-K2`)     | Schuko-Einbausteckdose 2 (Blau)               | Schuko-Flanschsteckdose IP54     |
| **`X2` (230V Last)**    | `X2:3` (L, N, PE)  | Luftbefeuchter (`humidifier`)         |    $230\,\text{V AC}$ (geschaltet `-K3`)     | Schuko-Einbausteckdose 3                      | Schuko-Flanschsteckdose IP54     |
| **`X2` (230V Last)**    | `X2:4` (L, N, PE)  | Luftentfeuchter (`dehumidifier`)      |    $230\,\text{V AC}$ (geschaltet `-K4`)     | Schuko-Einbausteckdose 4                      | Schuko-Flanschsteckdose IP54     |
| **`X2` (230V Last)**    | `X2:5` (L, N, PE)  | CO₂-Magnetventil (`co2`)              | $230\,\text{V AC}$ / $12\,\text{V DC}$ (NC)  | Magnetventil an CO₂-Druckminderer             | Schuko / GX16-2                  |
| **`X2` (230V Last)**    | `X2:6` (L, N, PE)  | Bewässerungspumpe (`pump`)            |    $230\,\text{V AC}$ / $24\,\text{V DC}$    | Tauch-/Membranpumpe im Nährstofftank          | Schuko / GX16-2                  |
| **`X3` (0–10V / PWM)**  | `X3:1+` / `X3:1-`  | Licht Dimmung (`light`)               |     $0 \dots 10\,\text{V DC}$ (GPIO 25)      | LED-Treiber Dimmeingang (`DIM+ / DIM-`)       | RJ12 / GX12-2                    |
| **`X3` (0–10V / PWM)**  | `X3:2+` / `X3:2-`  | Abluft (`exhaust`)                    |     $0 \dots 10\,\text{V DC}$ (GPIO 26)      | EC-Abluftventilator Steuereingang             | RJ45 / 3,5 mm Klinke / GX12      |
| **`X3` (0–10V / PWM)**  | `X3:3+` / `X3:3-`  | Zuluft (`intake`)                     |     $0 \dots 10\,\text{V DC}$ (GPIO 27)      | EC-Zuluftventilator Steuereingang             | RJ45 / GX12                      |
| **`X3` (0–10V / PWM)**  | `X3:4+` / `X3:4-`  | Umluft (`circulation`)                |     $0 \dots 10\,\text{V PWM}$ (GPIO 14)     | Umluftventilator Steuereingang                | GX12 / JST-XH                    |
| **`X4` (Dosierer)**     | `X4:1+` / `X4:1-`  | Dosierpumpe 1 (`nutrientA`)           |    $12\,\text{V DC}$ PWM/Schalt (GPIO 15)    | Peristaltikpumpe 1 (im Gehäuse verbaut)       | Flachsteckhülse 2,8 mm / JST     |
| **`X4` (Dosierer)**     | `X4:2+` / `X4:2-`  | Dosierpumpe 2 (`nutrientB`)           |          $12\,\text{V DC}$ (GPIO 2)          | Peristaltikpumpe 2                            | Flachsteckhülse 2,8 mm / JST     |
| **`X4` (Dosierer)**     | `X4:3+` / `X4:3-`  | Dosierpumpe 3 (`bloom`)               |          $12\,\text{V DC}$ (GPIO 0)          | Peristaltikpumpe 3                            | Flachsteckhülse 2,8 mm / JST     |
| **`X4` (Dosierer)**     | `X4:4+` / `X4:4-`  | Dosierpumpe 4 (`calmag`)              |          $12\,\text{V DC}$ (GPIO 5)          | Peristaltikpumpe 4                            | Flachsteckhülse 2,8 mm / JST     |
| **`X4` (Dosierer)**     | `X4:5+` / `X4:5-`  | Dosierpumpe 5 (`phDown`)              |         $12\,\text{V DC}$ (GPIO 33)          | Peristaltikpumpe 5 (Säurefest!)               | Flachsteckhülse 2,8 mm / JST     |
| **`X4` (Dosierer)**     | `X4:6+` / `X4:6-`  | Dosierpumpe 6 (`phUp`)                |      $12\,\text{V DC}$ (GPIO 20 / Exp.)      | Peristaltikpumpe 6                            | Flachsteckhülse 2,8 mm / JST     |
| **`X5` (I²C & Tank)**   |     `X5:1..4`      | I²C-Klimabus (`+3,3V, GND, SDA, SCL`) |      $3{,}3\,\text{V DC}$ (GPIO 21/22)       | Klimasonde im Zelt (SHT31 + SCD41 + MLX90614) | GX12-4 (geschirmtes Kabel LiYCY) |
| **`X5` (I²C & Tank)**   |     `X5:5..7`      | OneWire (`+3,3V, DQ, GND`)            |        $3{,}3\,\text{V DC}$ (GPIO 4)         | DS18B20 Wassertemperaturfühler                | GX12-3                           |
| **`X5` (I²C & Tank)**   |     `X5:8..11`     | Ultraschall (`+5V, TRIG, ECHO, GND`)  | $5\,\text{V} / 3{,}3\,\text{V}$ (GPIO 12/32) | JSN-SR04T im Tankdeckel                       | GX12-4                           |
| **`X6` (Analog/Sich.)** |  `X6:1` / `X6:2`   | pH-Sonde / EC-Sonde                   |    $0 \dots 3{,}0\,\text{V}$ (GPIO 34/35)    | pH-Elektrode & EC-Messzelle im Tank           | 2× BNC-Einbaubuchse (isoliert)   |
| **`X6` (Analog/Sich.)** |     `X6:3..5`      | Bodenfeuchte (`+3,3V, AOUT, GND`)     |     $0 \dots 3{,}0\,\text{V}$ (GPIO 36)      | Kapazitiver Substratfühler                    | GX12-3                           |
| **`X6` (Analog/Sich.)** |     `X6:6..7`      | Leck-Sensor (`IN, GND`)               |    $3{,}3\,\text{V}$ Active-LOW (GPIO 39)    | Bodensonde in der Zeltwanne                   | GX12-2                           |
| **`X6` (Analog/Sich.)** |     `X6:8..9`      | Rauchmelder / Not-Aus (`NC`)          |            Potenzialfreier Öffner            | Rauchmelder an Zeltdecke                      | M12-Steckverbinder               |

---

## 6. Regelungstechnik, Sicherheitsgrenzen & Failsafe-Matrix

Die Software- und Firmware-Architektur arbeitet mit **drei unabhängigen Sicherheitsebenen**, sodass selbst bei Fehlfunktionen der KI, falschen Nutzereingaben oder vollständigem WLAN-/Serverausfall kein gefährlicher Zustand eintreten kann:

### Ebene 1: Lokale Echtzeit-Schutzschicht auf dem ESP32 (`firmware/esp32-growmaster/src/main.cpp`)

- **Hardware-Watchdog (`esp_task_wdt`, 30 s):** Startet den Controller neu, falls eine I²C- oder TLS-Operation blockiert.
- **Leckage-Sofortabschaltung (`leak == 1`):** Schaltet innerhalb von $< 50\,\text{ms}$ die Bewässerungspumpe (`pump`) und alle 6 Dosierpumpen (`doser`) ab und lehnt neue Befehle mit `acks: [{ ok: false, result: "Blockiert: Wasserleck aktiv" }]` ab.
- **Pumpen-Laufzeitbegrenzung:** `SAFETY_MAX_PUMP_SECONDS = 600.0` (10 Min. absolutes Hardware-Limit pro Lauf).
- **Dosier-Mengenbegrenzung:** `SAFETY_MAX_DOSE_ML = 50.0` (max. 50 ml pro Befehl, umgerechnet über Kalibrierfaktor `ml/s`).
- **CO₂-Notabschaltung:** `SAFETY_MAX_CO2_PPM = 2000.0` (schließt das NC-Magnetventil sofort bei Überschreitung).
- **Failsafe-Notbetrieb nach 300 s ohne Server-Antwort (`failsafe.afterSeconds`):**
  - `pump = 0`, `doser = 0`, `co2 = 0`, `heater = 0`, `humidifier = 0` (alle Zuführungen sicher aus).
  - `exhaust = 50 %`, `intake = 40 %` (definierter Unterdruck & Wärmeabfuhr).
  - `light = "keep-schedule"` (lokale NTP-Echtzeituhr `CET-1CEST` führt den 18/6- oder 12/12-Lichtzyklus autonom weiter).

### Ebene 2: Serverseitige Sicherheitswächter (`shared/smartgrow/safety.ts` – `guard()`)

Jeder Befehl (egal ob vom PID/Hysterese-Regler, von der 6-Stunden-KI oder manuell vom Nutzer) durchläuft zwingend `guard()`:

- **Ausgefallene Sicherheitssensoren (`missing`):** Fällt der Leck- oder Füllstandssensor aus (oder liefert unplausible Werte), wertet das System dies fehlersicher (_fail-safe_) wie „Leck erkannt“ bzw. „Tank leer“ und sperrt Pumpe, Dosierer und Frischwasserzulauf (`waterValve`).
- **Verriegelungsmatrix:**
  - `heater` wird nur freigegeben, wenn ein gültiger `airTemp`-Messwert vorliegt und `airTemp < airTempMax - 2 °C` ist.
  - `co2` wird nur freigegeben, wenn Tagphase (`isDay == true`) ist, die Zelttür geschlossen ist (`door == 0`), ein `co2`-Sensor aktiv ist (`co2 < co2Max`, Standard $1300\,\text{ppm}$) und die Abluft nicht hoch läuft (`exhaust <= 40 %`).
  - `light` wird automatisch auf $\le 50\,\%$ gedimmt, falls die Blatttemperatur `leafTemp > leafTempMax + 2 °C` übersteigt.
  - `doser` (Dünger & pH) ist gesperrt bei `leak == 1`, `waterLevel < waterLevelMin` (Standard $10\,\%$), fehlendem `waterEc`/`waterPh`-Sensor sowie bei Erreichen des Tageslimits (`doseMaxMlPerDay`, Standard $60\,\text{ml/Tag}$).

---

## 7. Komplette Stückliste (BOM) für den Ausbildungs-Prototypen

| Pos. |     BMK      | Menge  | Bezeichnung / Spezifikation                                                                                                                                                                                 | Zweck im Prototyp                                | Richtpreis (netto) |
| :--: | :----------: | :----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------- | :----------------: |
|  1   |    `-U0`     | 1 Stk. | Schaltschrank / Industriegehäuse IP65 (ca. $400 \times 300 \times 170\,\text{mm}$) mit 2× 35-mm-Hutschiene & Montageplatte                                                                                  | Berührungsschutz, Spritzwasserschutz             |    ca. 45,00 €     |
|  2   |    `-F1`     | 1 Stk. | Fehlerstrom-Schutzschalter (RCD) 2-polig, $25\,\text{A}$, $I_{\Delta n} = 30\,\text{mA}$, Typ A                                                                                                             | Personenschutz nach DIN VDE 0100-410             |    ca. 28,00 €     |
|  3   | `-F2`, `-F3` | 2 Stk. | Leitungsschutzschalter (LS) 1-polig: 1× **B16A** (Lastkreis), 1× **B2A** (Steuerkreis)                                                                                                                      | Leitungs- und Kurzschlussschutz                  |     ca. 8,00 €     |
|  4   |    `-T1`     | 1 Stk. | Hutschienen-Schaltnetzteil **MeanWell HDR-60-12** ($230\,\text{V AC} \to 12\,\text{V DC}$, $4{,}5\,\text{A}$, SELV, Schutzklasse II)                                                                        | 12 V-Hauptversorgung (Pumpen, OpAmps)            |    ca. 18,00 €     |
|  5   |    `-T2`     | 1 Stk. | DC/DC Step-Down-Wandler $12\,\text{V} \to 5\,\text{V DC}$, $3\,\text{A}$ (z. B. MeanWell DDR-15G-5 oder LM2596S-Modul)                                                                                      | 5 V-Versorgung (ESP32, Kamera, Logik)            |     ca. 8,00 €     |
|  6   |    `-A1`     | 1 Stk. | Mikrocontroller **ESP32-WROOM-32 DevKitC** (38-Pin) + Hutschienen-Schraubklemmen-Breakout                                                                                                                   | Zentrale MSR-Steuereinheit                       |    ca. 14,00 €     |
|  7   |    `-A2`     | 1 Stk. | Kameramodul **ESP32-CAM (AI-Thinker, OV2640, 4 MB PSRAM)** + USB-Programmer `ESP32-CAM-MB` + $160^\circ$-Linse                                                                                              | Optische Blatt-/Phasenüberwachung                |    ca. 12,00 €     |
|  8   |  `-K1..-K6`  | 6 Stk. | Koppelrelais / Hutschienen-Installationsschütze (oder 6/8-Kanal Optokoppler-Relaisboard + 2× Leistungsschütz 16 A + 6× RC-Snubber $100\,\Omega / 100\,\text{nF}$ X2)                                        | Schalten der 230 V AC Laststeckdosen             |    ca. 35,00 €     |
|  9   |    `-U2`     | 1 Stk. | 4-Kanal **PWM-zu-0–10 V-Wandlermodul** (oder Eigenbau auf Lochraster/PCB mit 1× `LM324` / 2× `LM358`, $10\,\text{k}\Omega / 20\,\text{k}\Omega$ 1%-Metallfilmwiderständen & $1\,\mu\text{F}$ Kondensatoren) | Dimmung LED-Treiber & 3× EC-Lüfter               |    ca. 12,00 €     |
|  10  |  `-M1..-M6`  | 6 Stk. | **12 V DC Peristaltik-Dosierpumpen** (Schlauch: Santoprene/PharMed BPT für Säurebeständigkeit) + 6× Logic-Level-MOSFET `IRLZ44N` / `AOD4184` + 6× Freilaufdiode `1N4007`                                    | Dosierung Dünger A/B, Blüte, CalMag, pH-/+       |    ca. 55,00 €     |
|  11  |    `-B1`     | 1 Stk. | I²C Temperatur- & Feuchtesensor **Sensirion SHT31-D** oder **SHT40** (im gesinterten PE-Schutzgehäuse)                                                                                                      | Erfassung `airTemp` & `airRh`                    |    ca. 10,00 €     |
|  12  |    `-B2`     | 1 Stk. | I²C CO₂-Sensor **Sensirion SCD40 / SCD41** (photoakustisches NDIR-Messprinzip)                                                                                                                              | Erfassung `co2` ($400 \dots 5000\,\text{ppm}$)   |    ca. 32,00 €     |
|  13  |    `-B3`     | 1 Stk. | I²C IR-Thermometer **Melexis MLX90614ESF-BAA** (3,3 V-Version)                                                                                                                                              | Berührungslose Blatttemperatur `leafTemp`        |    ca. 12,00 €     |
|  14  |    `-B4`     | 1 Stk. | OneWire-Temperaturfühler **DS18B20** in wasserdichter V4A-Edelstahlhülse (2 m Kabel) + $4{,}7\,\text{k}\Omega$ Widerstand                                                                                   | Tanktemperatur `waterTemp` (für EC-Kompensation) |     ca. 4,00 €     |
|  15  |    `-B5`     | 1 Stk. | **DFRobot Gravity Analog pH Sensor Pro V2** inkl. Industrie-BNC-Glaselektrode + Pufferlösungen pH 4,00 / 7,00                                                                                               | Tank-pH-Messung `waterPh`                        |    ca. 38,00 €     |
|  16  |    `-B6`     | 1 Stk. | **DFRobot Gravity Analog EC Sensor V2 ($K=1$)** + **Galvanischer Trennbaustein** (DC/DC-Isolator `B0505S-1W` / Gravity Analog Signal Isolator `DFR0504`)                                                    | Störungsfreie Tank-EC-Messung `waterEc`          |    ca. 55,00 €     |
|  17  |    `-B7`     | 1 Stk. | Kapazitiver Bodenfeuchtesensor **v2.0** (korrosionsfrei, vergossene Elektronik)                                                                                                                             | Substratfeuchte `soilMoisture`                   |     ca. 4,00 €     |
|  18  |    `-B8`     | 1 Stk. | Wasserdichter Ultraschall-Abstandssensor **JSN-SR04T** + Spannungsteiler ($10\,\text{k}\Omega + 20\,\text{k}\Omega$)                                                                                        | Tankfüllstand `waterLevel`                       |     ca. 9,00 €     |
|  19  |    `-B9`     | 1 Stk. | Leckage-Wassersensor mit **LM393-Komparator** (oder Edelstahl-Bodenelektroden)                                                                                                                              | Wasserschutz `leak`                              |     ca. 3,00 €     |
|  20  |   `X1..X6`   | 1 Satz | Hutschienen-Durchgangs- & Schutzleiterklemmen (1,5–2,5 mm²), Aderendhülsen, Schuko-Flanschsteckdosen IP54, GX12-Rundsteckverbinder, BNC-Buchsen                                                             | Industriegerechte Verdrahtung & Steckbarkeit     |    ca. 35,00 €     |

---

## 8. Prüf- und Inbetriebnahmeprotokoll (für die Ausbildungswerkstatt)

Vor dem ersten Einschalten unter 230 V AC ist der aufgebaute Prototyp gemeinsam mit dem Ausbilder/Dozenten gemäß **DIN VDE 0100-600** bzw. **DIN VDE 0701-0702 (DGUV Vorschrift 3)** zu prüfen:

1. **Sichtprüfung (im spannungsfreien Zustand):**
   - [ ] Strikte räumliche Trennung und Isolierung zwischen 230 V AC Hauptstromkreis (`X1`, `X2`, `-F1..-F3`, `-K1..-K6`) und SELV-Kleinspannungskreis (`12 V / 5 V / 3,3 V`).
   - [ ] Alle flexiblen Leitungen (`H05VV-F` / `LiYY` / `LiYCY`) mit passenden Aderendhülsen verpresst und zugentlastet.
   - [ ] Freilaufdioden (`1N4007`) an allen 6 Dosierpumpen-Ausgängen (`X4:1..6`) auf korrekte Polarität (Kathode/Ring an `+12 V`) geprüft.
   - [ ] Spannungsteiler ($10\,\text{k}\Omega / 20\,\text{k}\Omega$) am Echo-Pin des `JSN-SR04T` (`GPIO 32`) bestückt.
2. **Messungen nach DIN VDE 0100-600 / 0701-0702:**
   - [ ] **Durchgängigkeit des Schutzleiters ($R_{\text{PE}}$):** Von Einspeisung `X1:PE` zu allen Schuko-Steckdosen `X2:1..6` und geerdeten Gehäuseteilen ($R_{\text{PE}} < 0{,}3\,\Omega$).
   - [ ] **Isolationswiderstand ($R_{\text{iso}}$ mit $500\,\text{V DC}$):**
     - Zwischen `L/N` (230 V-Seite) und `PE`: $R_{\text{iso}} \ge 1{,}0\,\text{M}\Omega$ (Soll: $> 100\,\text{M}\Omega$).
     - Zwischen `L/N` (230 V-Seite) und `GND` (SELV-Kleinspannungsseite, Nachweis der sicheren Trennung!): $R_{\text{iso}} \ge 2{,}0\,\text{M}\Omega$.
   - [ ] **Funktionsprüfung RCD (`-F1`, $I_{\Delta n} = 30\,\text{mA}$):** Auslösezeit $t_A < 300\,\text{ms}$ (typisch $\approx 20\,\text{ms}$), Auslösestrom $15 \dots 30\,\text{mA}$.
3. **Funktions- und Kalibrierprüfung Kleinspannung (SELV):**
   - [ ] Spannungen an `-T1` ($12{,}0\,\text{V DC} \pm 0{,}2\,\text{V}$), `-T2` ($5{,}05\,\text{V DC} \pm 0{,}1\,\text{V}$) und ESP32-3,3V-Pin ($3{,}30\,\text{V DC} \pm 0{,}05\,\text{V}$) messen.
   - [ ] **0–10 V Kennlinie prüfen:** In der GrowMaster-App Licht (`light`) nacheinander auf $0\,\%, 25\,\%, 50\,\%, 75\,\%, 100\,\%$ stellen → mit Multimeter an `X3:1` nachmessen ($0{,}0\,\text{V} / 2{,}5\,\text{V} / 5{,}0\,\text{V} / 7{,}5\,\text{V} / 10{,}0\,\text{V} \pm 0{,}15\,\text{V}$).
   - [ ] **pH-/EC-Kalibrierung:** pH-Sonde in Pufferlösung $\text{pH } 7{,}00$ und $\text{pH } 4{,}00$ messen → Millivoltwerte in `PH_MV_AT_7_0` / `PH_MV_AT_4_0` eintragen. EC-Sonde in $1{,}413\,\text{mS/cm}$ Kalibrierlösung abgleichen.
   - [ ] **Gravimetrischer/volumetrischer Abgleich der Dosierpumpen (`-M1..-M6`):** Jede Pumpe exakt $60\,\text{s}$ mit Wasser in einen Messzylinder fördern lassen → gemessenes Volumen geteilt durch $60$ ergibt den exakten Kalibrierwert `DOSER_MLS_...` in $\text{ml/s}$.
   - [ ] **Hardware-Sicherheitstest:**
     - Leck-Sensor (`-B9`) mit feuchtem Tuch überbrücken → Laufende Bewässerungs- und Dosierpumpen müssen sofort abschalten; Alarm erscheint in der App.
     - WLAN-Router testweise ausschalten → Nach $300\,\text{s}$ wechselt der ESP32 autonom in den Failsafe-Modus (Heizung/Pumpen/CO₂ aus, Abluft $50\,\%$, Licht nach internem Zeitplan).
