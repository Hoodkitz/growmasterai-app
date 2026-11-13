# GrowMaster „Smart Grow“ – Ausbildungs-Projekthandbuch (12 Einzel-Projektarbeiten)

**Berufsbild:** Elektroniker/-in für Betriebstechnik (IHK)  
**Konzept:** Arbeitsteiliges Gruppenprojekt – **jeder Auszubildende erhält genau ein abgeschlossenes Bauteil-Modul (Projektarbeit 1 bis 12)** mit eigenem Schaltplan, eigener Stückliste, verständlicher Schritt-für-Schritt-Anleitung und eigenem VDE-/Funktions-Abnahmeprotokoll. Am Ende werden alle 12 Module im Hauptschaltschrank zusammengesteckt.

---

## Übersicht der 12 Azubi-Projektarbeiten (Zuteilungsliste für den Dozenten)

|  Projekt-Nr.   |   Modul    | Thema / Bauteil                                                                               |     Empf. Lehrjahr      |           Dauer            | Auszubildende/r (Name)               |
| :------------: | :--------: | :-------------------------------------------------------------------------------------------- | :---------------------: | :------------------------: | :----------------------------------- |
| **Projekt 1**  | `Modul A1` | Netzspannungseinspeisung (230 V AC), Schutzorgane (RCD/LS) & SELV-Netzteile (12 V / 5 V DC)   | 2. / 3. Ausbildungsjahr | ca. 4–6 Unterrichtsstunden | \***\*\*\*\*\***\_\_\***\*\*\*\*\*** |
| **Projekt 2**  | `Modul A2` | Zentrale Steuereinheit ESP32-WROOM-32, Schraubklemmen-Breakout & I²C-Port-Expander            | 1. / 2. Ausbildungsjahr | ca. 3–4 Unterrichtsstunden | \***\*\*\*\*\***\_\_\***\*\*\*\*\*** |
| **Projekt 3**  | `Modul A3` | 230 V AC Lastschaltgruppe (6× Schütz/Relais), RC-Löschglieder & Hardware-Not-Aus-Kette        | 2. / 3. Ausbildungsjahr | ca. 5–6 Unterrichtsstunden | \***\*\*\*\*\***\_\_\***\*\*\*\*\*** |
| **Projekt 4**  | `Modul A4` | 4-Kanal PWM-zu-0–10 V-Analogwandler für LED-Dimmung & EC-Lüfterregelung                       | 2. / 3. Ausbildungsjahr |  ca. 4 Unterrichtsstunden  | \***\*\*\*\*\***\_\_\***\*\*\*\*\*** |
| **Projekt 5**  | `Modul A5` | 6-Kanal 12 V DC Dosierpumpen-Leistungsplatine (MOSFET-Treiber & Schlauchpumpen)               | 1. / 2. Ausbildungsjahr | ca. 4–5 Unterrichtsstunden | \***\*\*\*\*\***\_\_\***\*\*\*\*\*** |
| **Projekt 6**  | `Modul S1` | I²C-Klimamesskopf „Blätterdach-Sonde“ (Lufttemperatur, Luftfeuchte, CO₂ & IR-Blatttemperatur) | 1. / 2. Ausbildungsjahr | ca. 3–4 Unterrichtsstunden | \***\*\*\*\*\***\_\_\***\*\*\*\*\*** |
| **Projekt 7**  | `Modul S2` | Nährstofftank-Messbox: pH-Sonde, EC-Sonde (galvanisch getrennt!) & DS18B20 Wassertemperatur   | 2. / 3. Ausbildungsjahr | ca. 4–5 Unterrichtsstunden | \***\*\*\*\*\***\_\_\***\*\*\*\*\*** |
| **Projekt 8**  | `Modul S3` | Wasserdichter Ultraschall-Tankfüllstandssensor (JSN-SR04T) mit 5V→3,3V Pegelwandler           |   1. Ausbildungsjahr    | ca. 2–3 Unterrichtsstunden | \***\*\*\*\*\***\_\_\***\*\*\*\*\*** |
| **Projekt 9**  | `Modul S4` | Kapazitiver Substratfeuchte-Sensor (v2.0) mit Feuchteschutz-Versiegelung & Kalibrierung       |   1. Ausbildungsjahr    | ca. 2–3 Unterrichtsstunden | \***\*\*\*\*\***\_\_\***\*\*\*\*\*** |
| **Projekt 10** | `Modul S5` | Sicherheits- & Überwachungsmodul: Leckage-Bodensonde, Rauchmelder-Relais & Tür-Reedkontakt    | 1. / 2. Ausbildungsjahr |  ca. 3 Unterrichtsstunden  | \***\*\*\*\*\***\_\_\***\*\*\*\*\*** |
| **Projekt 11** | `Modul K1` | Optisches KI-Kameramodul (ESP32-CAM AI-Thinker) mit 160°-Weitwinkel & Stützelko               | 1. / 2. Ausbildungsjahr | ca. 2–3 Unterrichtsstunden | \***\*\*\*\*\***\_\_\***\*\*\*\*\*** |
| **Projekt 12** | `Modul G1` | Systemintegration („Schaltschrank-Hochzeit“), VDE-Prüfung & Gesamt-Inbetriebnahme             |   3. Ausbildungsjahr    | ca. 4–6 Unterrichtsstunden | \***\*\*\*\*\***\_\_\***\*\*\*\*\*** |

---

## Projektarbeit 1 (Modul A1): Netzspannungseinspeisung (230 V AC), Schutzorgane (RCD/LS) & SELV-Netzteile (12 V / 5 V DC)

- **Empfohlenes Ausbildungsjahr:** 2. / 3. Ausbildungsjahr (oder 1. Lehrjahr unter direkter Aufsicht des Ausbilders)
- **Richtzeit:** ca. 4–6 Unterrichtsstunden
- **Ziel des Arbeitsauftrags:** Aufbau der sicheren Stromversorgung des gesamten Schaltschranks auf einer 35-mm-Hutschiene mit strikter Trennung zwischen 230 V Netzspannung und berührungssicherer Schutzkleinspannung (SELV 12 V DC und 5 V DC).

### Warum bauen wir dieses Bauteil? (Einfach erklärt)

Im Grow-Zelt arbeiten wir mit Wasser, Nährlösung und elektrischem Strom auf engstem Raum. Deshalb schreibt die DIN VDE 0100-410 zwingend zwei Schutzmaßnahmen vor: Erstens einen Fehlerstrom-Schutzschalter (RCD / FI mit 30 mA), der bei einem Erdschluss in Millisekunden abschaltet. Zweitens arbeiten alle Sensoren, Dosierpumpen und der Mikrocontroller mit ungefährlicher Schutzkleinspannung (SELV: 12 V, 5 V und 3,3 V Gleichspannung).

### benötigte Bauteile (Stückliste für deinen Arbeitsplatz)

| Menge  |    BMK    | Bauteil / genaue Bezeichnung                                                                                                    |
| :----: | :-------: | :------------------------------------------------------------------------------------------------------------------------------ |
| 1 Stk. |   `-F1`   | Fehlerstrom-Schutzschalter (RCD) 2-polig, 25 A, I_Δn = 30 mA, Typ A                                                             |
| 1 Stk. |   `-F2`   | Leitungsschutzschalter (LS) 1-polig B16A (für den 230 V-Laststromkreis)                                                         |
| 1 Stk. |   `-F3`   | Leitungsschutzschalter (LS) 1-polig B2A (für das Steuergeräte-Netzteil)                                                         |
| 1 Stk. |   `-T1`   | Hutschienen-Schaltnetzteil MeanWell HDR-60-12 (Eingang 230 V AC, Ausgang 12 V DC / 4,5 A, SELV)                                 |
| 1 Stk. |   `-T2`   | Hutschienen-DC/DC-Wandler MeanWell DDR-15G-5 (Eingang 12 V DC, Ausgang 5 V DC / 3 A)                                            |
| 1 Stk. |   `-F4`   | Hutschienen-Sicherungsklemme mit Feinsicherung 5×20 mm, 4 A träge (Absicherung 12 V-Schiene)                                    |
| 1 Satz |   `X1`    | Hutschienen-Reihenklemmen (WAGO TOPJOB S 2,5 mm²): 2× Grau (L1, N), 3× Grün-Gelb (PE), 4× Rot (+12V/+5V), 4× Blau/Schwarz (GND) |
|  div.  | `Leitung` | H07V-K 2,5 mm² (Braun, Blau, Grün-Gelb für 230 V), H05V-K 1,0 mm² (Rot, Schwarz für 12 V/5 V) + Aderendhülsen                   |

### Schaltplan & Klemmenanschluss

```
  [Klemme X1: Netz 230V AC]
   X1:L1 (Braun, 2,5mm²) ──────► [1] -F1 (RCD 25A / 30mA) [2] ──┬──► [1] -F2 (LS B16A) [2] ──► L1_LAST (an Projekt 3)
   X1:N  (Blau,  2,5mm²) ──────► [3]                      [4] ──┼──► N_LAST (Sammelklemme Blau für Projekt 3)
   X1:PE (Grün/Gelb)     ──────► PE-Sammelschiene (Hutschiene)  │
                                                                ├──► [1] -F3 (LS B2A)  [2] ──► [L] -T1 (Netzteil 12V)
                                                                └────────────────────────────► [N] -T1 (MeanWell HDR-60-12)

  [Kleinspannungsseite SELV (strikt räumlich getrennt mit Trennplatte!)]
   -T1 [+V 12V DC] ──► [-F4: 4A T] ──┬──► Klemme +12V_DC (Rot)  ──► für Projekt 4 (0–10V) & Projekt 5 (Dosierpumpen)
                                     └──► [+VIN] -T2 (Buck 12V→5V) [+VOUT] ──► Klemme +5V_DC (Rot) ──► für Projekt 2 & 11
   -T1 [-V 0V GND] ──────────────────┴──► [-VIN]                   [-VOUT] ──► Klemme GND (Schwarz) ──► gemeinsame Masse SELV
```

### Schritt-für-Schritt-Bauanleitung

1. **Bauteile aufrasten:** Raste auf der oberen 35-mm-Hutschiene von links nach rechts auf: Einspeiseklemmen `X1` (L1, N, PE) → RCD `-F1` → LS `-F2 (B16A)` → LS `-F3 (B2A)` → Trennwand → Netzteil `-T1 (12 V)` → Sicherungsklemme `-F4` → Wandler `-T2 (5 V)` → Kleinspannungsklemmen (`+12 V`, `+5 V`, `GND`).
2. **Aderendhülsen aufpressen:** Schneide die flexiblen Leitungen (`H07V-K 2,5 mm²` für 230 V; `H05V-K 1,0 mm²` für 12 V/5 V) passend zu, isoliere 8–10 mm ab und presse mit der Crimpzange passende Aderendhülsen mit Kunststoffkragen auf.
3. **230 V-Seite verdrahten (SPANNUNGSFREI!):** Verbinde `X1:L1` (Braun) mit Klemme `1` am RCD `-F1` und `X1:N` (Blau) mit Klemme `3` am RCD. Führe den Ausgang `2` des RCD auf die Eingänge von `-F2 (B16A)` und `-F3 (B2A)` (oder nutze eine 1-phasige Phasenschiene).
4. **Netzteil `-T1` anschließen:** Verbinde den Ausgang von `-F3 (B2A)` mit dem Eingang `L` des 12 V-Netzteils `-T1` und den Neutralleiter nach dem RCD (`4`) mit `N` am Netzteil `-T1`.
5. **SELV-Kleinspannung verdrahten:** Führe den `+V`-Ausgang (12 V) von `-T1` über die Feinsicherungsklemme `-F4 (4 A)` auf den `+12 V`-Verteilerblock und parallel auf den Eingang `+VIN` des 5 V-Wandlers `-T2`. Verbinde `-V` (0 V) von `-T1` und `-VOUT` von `-T2` gemeinsam mit dem `GND`-Verteilerblock.

### Typische Azubi-Fehler – darauf musst du unbedingt achten!

- ⚠️ **WICHTIG:** Niemals den Neutralleiter (`N`, Blau) der 230 V-Seite mit der Minus-Masse (`GND`, Schwarz) der 12 V/5 V-Seite verbinden! Dadurch ginge die sichere galvanische Trennung (SELV) verloren.
- ⚠️ Immer die Zugprobe an jeder Klemme machen: Nach dem Festziehen kräftig an der Einzelader ziehen.
- ⚠️ Vor dem ersten Anlegen von 230 V AC zwingend mit dem Ausbilder die Schutzleiter- und Isolationsmessung durchführen!

### Prüf- & Abnahmecheckliste (vor Übergabe an den Dozenten)

- [ ] Sichtprüfung: Kein blankes Kupfer außerhalb der Klemmen sichtbar (< 1 mm), alle Aderendhülsen fest?
- [ ] Widerstandsmessung (ohne Spannung!): Durchgang von `X1:PE` zur Hutschiene < 0,1 Ω?
- [ ] Isolationsmessung (500 V DC): Zwischen `L1/N` und `GND` (12 V-Seite) > 20 MΩ?
- [ ] Spannungsmessung (mit Ausbilder): Liegen an der 12 V-Klemme exakt 12,0 V DC (±0,2 V) und an der 5 V-Klemme 5,05 V DC (±0,1 V) an?

**Unterschrift Auszubildende/r:** **\*\*\*\***\_\_\_**\*\*\*\*** &nbsp;&nbsp; **Abnahme Dozent/Ausbilder:** **\*\*\*\***\_\_\_**\*\*\*\***

---

## Projektarbeit 2 (Modul A2): Zentrale Steuereinheit ESP32-WROOM-32, Schraubklemmen-Breakout & I²C-Port-Expander

- **Empfohlenes Ausbildungsjahr:** 1. / 2. Ausbildungsjahr
- **Richtzeit:** ca. 3–4 Unterrichtsstunden
- **Ziel des Arbeitsauftrags:** Aufbau der Mikrocontroller-Zentrale (-A1) auf Hutschienen-Schraubklemmen inkl. Stützkondensator, Status-LED und I²C-Port-Expander MCP23017 zur sauberen Entkopplung der Boot-Strapping-Pins.

### Warum bauen wir dieses Bauteil? (Einfach erklärt)

Der ESP32 ist das Gehirn der Anlage: Er liest alle 30 Sekunden sämtliche Sensoren aus, überwacht lokal die Sicherheitsgrenzen (z. B. Wasserleck oder CO₂ > 2000 ppm) und kommuniziert per verschlüsseltem HTTPS mit dem GrowMaster-Server. Damit alle 11 Kollegen aus den anderen Projektgruppen ihre Sensoren und Aktoren einfach per Schraubendreher anschließen können, setzen wir den ESP32 auf ein Hutschienen-Schraubklemmen-Board.

### benötigte Bauteile (Stückliste für deinen Arbeitsplatz)

| Menge  |   BMK   | Bauteil / genaue Bezeichnung                                                              |
| :----: | :-----: | :---------------------------------------------------------------------------------------- |
| 1 Stk. |  `-A1`  | ESP32-WROOM-32 DevKitC (38-Pin Version)                                                   |
| 1 Stk. |  `-U1`  | Hutschienen-Schraubklemmen-Breakoutboard für 38-Pin ESP32                                 |
| 1 Stk. | `-U1.2` | Optional (Empfehlung für Bestnote): I²C-Port-Expander MCP23017 Modul (Adresse 0x20)       |
| 1 Stk. | `C_BUF` | Elektrolytkondensator 470 µF / 16 V (als Puffer direkt an 5V und GND)                     |
| 2 Stk. | `R_I2C` | Metallfilmwiderstand 4,7 kΩ (Pull-up-Widerstände für den I²C-Bus SDA und SCL nach +3,3 V) |
| 1 Stk. | `R_OW`  | Metallfilmwiderstand 4,7 kΩ (Pull-up-Widerstand für den OneWire-Bus GPIO 4 nach +3,3 V)   |

### Schaltplan & Klemmenanschluss

```
  [Vom Netzteil Projekt 1]
   +5V_DC (Rot)     ──────┬──────────────► Klemme "5V / VIN" am ESP32-Breakout
                         ─┴─ C_BUF (470µF / 16V, Minus-Streifen an GND!)
                         ─┬─
   GND    (Schwarz) ──────┴──────────────► Klemme "GND"      am ESP32-Breakout

  [Pull-up-Widerstände direkt am ESP32-Breakout (nach +3,3V Klemme)]
   Klemme "3V3" (+3,3V) ──┬──[ 4,7 kΩ ]──► GPIO 21 (I²C SDA)  ──► zu Klemme X5:3
                          ├──[ 4,7 kΩ ]──► GPIO 22 (I²C SCL)  ──► zu Klemme X5:4
                          └──[ 4,7 kΩ ]──► GPIO 4  (OneWire)  ──► zu Klemme X5:6
```

### Schritt-für-Schritt-Bauanleitung

1. **Pin-Anzahl & Orientierung prüfen:** Prüfe vor dem Einstecken des ESP32 in das Schraubklemmen-Board, dass die Beschriftung der Pins (`3V3`, `GND`, `GPIO 21`, `5V`) auf dem ESP32 exakt mit dem Aufdruck auf der Trägerplatine übereinstimmt.
2. **Stützkondensator `470 µF` montieren:** Wenn das WLAN-Modul des ESP32 funkt, zieht es kurzzeitig bis zu 400 mA Strom. Klemme deshalb den `470 µF`-Elko direkt zwischen die Schraubklemme `5V` (Pluspol, langes Bein) und `GND` (Minuspol, weißer Streifen am Gehäuse).
3. **Die drei `4,7 kΩ`-Pull-up-Widerstände einbauen:** Digitale Busleitungen wie I²C (`GPIO 21` & `GPIO 22`) und OneWire (`GPIO 4`) haben sogenannte _Open-Drain_-Ausgänge – sie können die Leitung nur nach `GND` ziehen, brauchen aber einen Widerstand nach `+3,3 V` für ein sauberes HIGH-Signal. Klemme je einen `4,7 kΩ`-Widerstand zwischen `3V3` und `GPIO 21`, zwischen `3V3` und `GPIO 22` sowie zwischen `3V3` und `GPIO 4`.
4. **Klemmenleisten `X3` bis `X6` beschriften:** Beschrifte alle Abgänge sauber nach dem Pinbelegungsplan (Bild 2), damit die anderen Azubi-Gruppen bei der Endmontage ihre Module fehlerfrei auflegen können.

### Typische Azubi-Fehler – darauf musst du unbedingt achten!

- ⚠️ **NIEMALS +5 V oder +12 V an einen GPIO-Pin des ESP32 anlegen!** Die Pins des ESP32 vertragen maximal **3,3 V**. Höhere Spannungen zerstören den Chip sofort.
- ⚠️ **Achtung bei `GPIO 34, 35, 36, 39`:** Diese vier Pins auf der linken Seite sind **reine Eingänge** (Input-Only) und besitzen keine internen Pull-up-Widerstände.
- ⚠️ **Elko-Polung beachten:** Ein falsch herum gepolter Elektrolytkondensator wird heiß und kann platzen (weißer Streifen = Minus = `GND`).

### Prüf- & Abnahmecheckliste (vor Übergabe an den Dozenten)

- [ ] Ruhespannung an den Bus-Pins messen: Liegen an `GPIO 21 (SDA)`, `GPIO 22 (SCL)` und `GPIO 4 (OneWire)` ohne angeschlossene Sensoren saubere 3,30 V DC gegen `GND` an?
- [ ] USB-Verbindung zum PC testen: Meldet sich der ESP32 im Gerätemanager / unter `/dev/ttyUSB0` und gibt im Seriellen Monitor (115200 Baud) Startmeldungen aus?

**Unterschrift Auszubildende/r:** **\*\*\*\***\_\_\_**\*\*\*\*** &nbsp;&nbsp; **Abnahme Dozent/Ausbilder:** **\*\*\*\***\_\_\_**\*\*\*\***

---

## Projektarbeit 3 (Modul A3): 230 V AC Lastschaltgruppe (6× Schütz/Relais), RC-Löschglieder & Hardware-Not-Aus-Kette

- **Empfohlenes Ausbildungsjahr:** 2. / 3. Ausbildungsjahr
- **Richtzeit:** ca. 5–6 Unterrichtsstunden
- **Ziel des Arbeitsauftrags:** Aufbau der galvanisch getrennten 230 V AC Schaltgruppe für Heizung (-K1), Kühlung (-K2), Luftbefeuchter (-K3), Entfeuchter (-K4), CO₂-Magnetventil (-K5) und Bewässerungspumpe (-K6) inkl. RC-Entstörgliedern und Hardware-Sicherheitskette.

### Warum bauen wir dieses Bauteil? (Einfach erklärt)

Der ESP32 arbeitet mit 3,3 V und wenigen Milliampere – ein Heizlüfter oder Klimakompressor benötigt dagegen 230 V Wechselspannung und bis zu 10 A Strom. Deshalb schaltet der ESP32 über Lichtschranken-Chips (Optokoppler) Koppelrelais bzw. Hutschienen-Schütze, die ihrerseits die 230 V-Schuko-Steckdosen (`X2:1` bis `X2:6`) schalten.

### benötigte Bauteile (Stückliste für deinen Arbeitsplatz)

| Menge  |    BMK    | Bauteil / genaue Bezeichnung                                                                                                                               |
| :----: | :-------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Stk. |   `-U3`   | 6- oder 8-Kanal Optokoppler-Relaismodul (5 V Spulenspannung, Active-LOW) ODER 6× Hutschienen-Koppelrelais Finder Serie 38/48 + 2× Installationsschütz 16 A |
| 6 Stk. | `RC1..6`  | Fertiges RC-Löschglied (Snubber-Modul 100 Ω + 100 nF / 275 V AC X2-Kondensator)                                                                            |
| 6 Stk. | `X2:1..6` | Schuko-Einbausteckdosen IP54 mit Klappdeckel (für die Schaltschrank-Seitenwand)                                                                            |
| 1 Stk. |   `-S0`   | Not-Halt-Schlagknopf (Öffnerkontakt NC) zum Einbau in die Schaltschranktür                                                                                 |

### Schaltplan & Klemmenanschluss

```
  [Steuerseite (Kleinspannung 3,3V / 5V DC)]
   ESP32 +3,3V ──────────────► VCC    (am Optokoppler-Relaisboard, Versorgungs-Pin der LEDs)
   Netzteil -T2 +5V (über -S0 Öffner & Rauchmelder-Öffner!) ──► JD-VCC (Spulenversorgung der Relais!)
   Netzteil -T2 GND ─────────► GND    (am Relaisboard)
   ESP32 GPIO 16..19, 23, 13 ► IN1..6 (Active-LOW: 0V = Relais zieht an, 3,3V = Relais fällt ab)

  [Lastseite (230V AC aus Sicherung -F2 B16A)]
   L1_LAST (230V) ──┬──► Schließerkontakt (COM) von Relais/Schütz -K1..K6
                    │         │
                    │    Schaltausgang (NO) ──┬──► Schuko-Steckdose X2:1..6 (Pol L)
                    │                         │
                    └─── [ R=100Ω + C=100nF X2 ] (RC-Snubber parallel zum Schaltkontakt!)
   N_LAST  (Blau) ───────────────────────────────► Schuko-Steckdose X2:1..6 (Pol N)
   PE      (Grün/Gelb) ──────────────────────────► Schuko-Steckdose X2:1..6 (Schutzkontakt PE!)
```

### Schritt-für-Schritt-Bauanleitung

1. **Jumper `JD-VCC / VCC` am Relaismodul abziehen (WICHTIG!):** Auf dem Relaismodul sitzt eine kleine Steckbrücke zwischen `VCC` und `JD-VCC`. Ziehe diese Brücke ab! Schließe `+3,3 V` vom ESP32 an `VCC` an und `+5 V` vom Netzteil `-T2` (geführt über den Öffnerkontakt des Not-Aus-Tasters `-S0`) an `JD-VCC` an. Nur so sind ESP32 und Relaisspulen echt optisch getrennt!
2. **Steuerleitungen auflegen:** Verbinde `GPIO 16` → `IN1 (Heizung)`, `GPIO 17` → `IN2 (Kühlung)`, `GPIO 18` → `IN3 (Befeuchter)`, `GPIO 19` → `IN4 (Entfeuchter)`, `GPIO 23` → `IN5 (CO₂-Ventil)` und `GPIO 13` → `IN6 (Bewässerungspumpe)`.
3. **230 V-Schuko-Steckdosen (`X2:1..6`) verdrahten:** Führe den Schutzleiter `PE` (Grün-Gelb, 2,5 mm²) und den Neutralleiter `N` (Blau, 2,5 mm²) durchgehend an alle 6 Steckdosen. Führe den geschalteten Außenleiter (`NO` von Relais 1 bis 6) auf den jeweiligen `L`-Kontakt der Steckdosen 1 bis 6.
4. **RC-Löschglieder (Snubber) einbauen:** Klemme parallel zu jedem Relais-/Schützkontakt (`COM` und `NO`) ein RC-Löschglied (`100 Ω + 100 nF X2`, siehe Bild 3 links). Wenn ein Kompressor oder Magnetventil abschaltet, entsteht sonst ein Lichtbogen am Kontakt, der über elektromagnetische Störung den ESP32 abstürzen lässt.

### Typische Azubi-Fehler – darauf musst du unbedingt achten!

- ⚠️ **Keine normalen Keramikkondensatoren an 230 V AC verwenden!** Für das RC-Löschglied dürfen ausschließlich zugelassene **X2-Funkentstörkondensatoren (mind. 275 V~ AC)** verwendet werden.
- ⚠️ **Jumper `JD-VCC` vergessen:** Bleibt der Jumper gesteckt, liegen 5 V rückwärts am 3,3 V-Pin des ESP32 an.

### Prüf- & Abnahmecheckliste (vor Übergabe an den Dozenten)

- [ ] Durchgangsprüfung Schutzleiter: Hat jeder Schutzkontakt der 6 Schuko-Steckdosen `X2:1..6` niederohmigen Durchgang (< 0,2 Ω) zur `PE`-Hauptklemme?
- [ ] Not-Aus-Test (mit 5 V Steuerspannung, ohne 230 V): Ziehen die Relais an, wenn `IN1..6` kurz mit `GND` verbunden wird, und fallen **alle** Relais sofort ab, sobald der Not-Aus `-S0` gedrückt wird?

**Unterschrift Auszubildende/r:** **\*\*\*\***\_\_\_**\*\*\*\*** &nbsp;&nbsp; **Abnahme Dozent/Ausbilder:** **\*\*\*\***\_\_\_**\*\*\*\***

---

## Projektarbeit 4 (Modul A4): 4-Kanal PWM-zu-0–10 V-Analogwandler für LED-Dimmung & EC-Lüfterregelung

- **Empfohlenes Ausbildungsjahr:** 2. / 3. Ausbildungsjahr
- **Richtzeit:** ca. 4 Unterrichtsstunden
- **Ziel des Arbeitsauftrags:** Aufbau und Abgleich einer 4-kanaligen Operationsverstärker-Schaltung (2× LM358), die das 3,3 V-PWM-Signal (5 kHz) des ESP32 in vier stufenlose 0–10 V DC Steuerspannungen für Licht, Abluft, Zuluft und Umluft umwandelt.

### Warum bauen wir dieses Bauteil? (Einfach erklärt)

Moderne Pflanzen-LEDs (z. B. MeanWell-Treiber) und energiesparende EC-Rohrlüfter werden nicht hart ein- und ausgeschaltet, sondern über einen analogen `0–10 V`-Steuereingang stufenlos von 0 % bis 100 % geregelt (z. B. für sanften Sonnenaufgang und leise Nacht-Lüftung). Da der ESP32 nur 3,3 V-Rechteckimpulse (PWM) ausgeben kann, glätten wir das Signal mit einem RC-Tiefpass und verstärken es exakt um den Faktor 3 auf 0 bis 10,0 V.

### benötigte Bauteile (Stückliste für deinen Arbeitsplatz)

|  Menge  |     BMK      | Bauteil / genaue Bezeichnung                                                                          |
| :-----: | :----------: | :---------------------------------------------------------------------------------------------------- |
| 2 Stk.  |  `IC1, IC2`  | Operationsverstärker LM358N im DIP-8 Gehäuse + 2× 8-poliger IC-Sockel (je 2 Kanäle pro IC = 4 Kanäle) |
| 4 Stk.  |     `R0`     | Widerstand 100 kΩ (Pulldown am Eingang, hält Ausgang beim Booten auf 0 V)                             |
| 12 Stk. | `R1, R2, R3` | Metallfilmwiderstand 10 kΩ (1 % Toleranz: je 2× für Tiefpass + 1× für Verstärkerteiler pro Kanal)     |
| 4 Stk.  |     `R4`     | Metallfilmwiderstand 20 kΩ (1 % Toleranz: Gegenkopplungswiderstand für Verstärkung G = 3,0)           |
| 4 Stk.  |     `R5`     | Widerstand 100 Ω (Ausgangs-Schutzwiderstand vor Klemme X3)                                            |
| 8 Stk.  |   `C1, C2`   | Folien- oder Keramikkondensator 1 µF / 50 V (2-stufiger Tiefpass je Kanal)                            |
| 2 Stk.  |   `C_DEC`    | Keramikkondensator 100 nF (Abblockkondensator direkt an Pin 8 und Pin 4 jedes LM358)                  |
| 4 Stk.  |   `ZD1..4`   | Zener-Diode 11 V / 0,5 W (Überspannungsschutz am Ausgang)                                             |
| 1 Stk.  |    `PCB`     | Streifenraster- oder Lochrasterplatine im Hutschienengehäuse + 4× Buchse GX12-2 / RJ12 (X3:1..4)      |

### Schaltplan & Klemmenanschluss

```
  [Pro Kanal (4x identisch aufbauen für GPIO 25=Licht, GPIO 26=Abluft, GPIO 27=Zuluft, GPIO 14=Umluft)]

   ESP32 GPIO ──┬──[ R1 = 10 kΩ ]──┬──[ R2 = 10 kΩ ]──┬──► Pin 3 (+IN, bzw. Pin 5 für Kanal 2) am LM358
   (3,3V PWM)   │                  │                  │
               [R0]               [C1]               [C2]   (Versorgung LM358: Pin 8 = +12V DC, Pin 4 = GND)
              100kΩ               1µF                1µF
                │                  │                  │
               GND                GND                GND

   LM358 Ausgang Pin 1 (bzw. Pin 7) ──┬──[ R5 = 100 Ω ]──┬──► Klemme X3:DIM+ (0,0 .. 10,0 V DC)
                                      │                  │
                                     [R4 = 20 kΩ]      [ZD1 = 11V Z-Diode, Ring an DIM+]
                                      │                  │
   LM358 Eingang Pin 2 (-IN, Pin 6) ──┴──[ R3 = 10 kΩ ]──┴──► Klemme X3:DIM- (GND)
```

### Schritt-für-Schritt-Bauanleitung

1. **IC-Sockel einlöten (ohne gesteckten Chip!):** Löte zuerst die beiden 8-poligen IC-Sockel auf die Lochrasterplatine. Achte auf die Kerbe oben (siehe Bild 3 Mitte). Verbinde Pin 8 mit `+12 V DC` und Pin 4 mit `GND` und löte direkt daneben den `100 nF` Keramikkondensator.
2. **2-stufigen RC-Tiefpass für Kanal 1–4 aufbauen:** Löte für jeden der 4 Kanäle vom Eingang den `100 kΩ`-Widerstand nach `GND`, danach `R1 (10 kΩ)` in Reihe, `C1 (1 µF)` nach `GND`, `R2 (10 kΩ)` in Reihe und `C2 (1 µF)` nach `GND`. Der Knotenpunkt nach `R2/C2` geht auf den nicht-invertierenden Eingang (`+IN`, Pin 3 bzw. Pin 5).
3. **Verstärkung $G = 3{,}0$ einstellen:** Verbinde vom Ausgang (`OUT`, Pin 1 bzw. Pin 7) den Widerstand `R4 (20 kΩ)` zurück zum invertierenden Eingang (`-IN`, Pin 2 bzw. Pin 6), und von dort `R3 (10 kΩ)` nach `GND`. Nach der Formel $G = 1 + \frac{20\,\text{k}\Omega}{10\,\text{k}\Omega} = 3{,}0$ wird aus $3{,}3\,\text{V}$ am Eingang exakt $9{,}9 \dots 10{,}0\,\text{V}$ am Ausgang.
4. **Ausgangsschutz & Buchsen (`X3:1..4`):** Löte `R5 (100 Ω)` in die Ausgangsleitung und die 11 V-Zenerdiode (schwarzer Ring Richtung Ausgang, andere Seite an `GND`) zum Schutz gegen Fremdspannung.
5. **LM358 einsetzen:** Stecke erst nach abgeschlossener Löt- und Sichtkontrolle die beiden `LM358N`-Chips mit der Kerbe in die richtige Richtung in die Sockel.

### Typische Azubi-Fehler – darauf musst du unbedingt achten!

- ⚠️ **R3 (10 kΩ) und R4 (20 kΩ) vertauschen:** Werden die beiden Widerstände vertauscht, beträgt die Verstärkung nur $1 + \frac{10}{20} = 1{,}5$ (Ausgang erreicht dann nur ca. 4,95 V statt 10 V!).
- ⚠️ **12 V statt 5 V für Pin 8 verwenden:** Der `LM358` braucht zwingend die **+12 V DC**-Schiene an Pin 8, da seine Ausgangsspannung immer ca. 1,5 V unter seiner Versorgungsspannung bleibt (mit 5 V Versorgung kämen maximal 3,5 V heraus!).

### Prüf- & Abnahmecheckliste (vor Übergabe an den Dozenten)

- [ ] Nullpunkt-Test: Bei offenem Eingang (oder GPIO auf 0 %) muss das Multimeter an `X3:1..4` zwischen `0,00 V` und `0,05 V DC` anzeigen.
- [ ] Vollaussteuerungs-Test: Verbinde den Eingang des Tiefpasses testweise mit `+3,3 V` vom ESP32 → Am Ausgang `X3` müssen `9,8 V bis 10,0 V DC` anliegen!
- [ ] Halblast-Test (50 % PWM vom ESP32): Am Ausgang müssen exakt `4,9 V bis 5,0 V DC` ohne starkes Schwanken anliegen.

**Unterschrift Auszubildende/r:** **\*\*\*\***\_\_\_**\*\*\*\*** &nbsp;&nbsp; **Abnahme Dozent/Ausbilder:** **\*\*\*\***\_\_\_**\*\*\*\***

---

## Projektarbeit 5 (Modul A5): 6-Kanal 12 V DC Dosierpumpen-Leistungsplatine (MOSFET-Treiber & Schlauchpumpen)

- **Empfohlenes Ausbildungsjahr:** 1. / 2. Ausbildungsjahr
- **Richtzeit:** ca. 4–5 Unterrichtsstunden
- **Ziel des Arbeitsauftrags:** Bau der 6-kanaligen Gleichstrom-Leistungsendstufe mit Logic-Level-MOSFETs (IRLZ44N), Freilaufdioden und 6 selbstansaugenden 12 V-Peristaltikpumpen zur millilitergenauen Dosierung von Dünger A/B, Blüte, CalMag, pH- und pH+.

### Warum bauen wir dieses Bauteil? (Einfach erklärt)

Relais verschleißen bei häufigem, sekundengenauem Takten mechanisch. Deshalb schalten wir die sechs 12 V-Gleichstrommotoren der Schlauchpumpen verschleißfrei mit Halbleiter-Transistoren (Logic-Level N-Kanal-MOSFETs). Da jede Pumpe ca. 1,2 ml Flüssigkeit pro Sekunde fördert, kann der ESP32 durch exaktes Einschalten für z. B. 2500 Millisekunden genau 3,0 ml Dünger in den Tank dosieren.

### benötigte Bauteile (Stückliste für deinen Arbeitsplatz)

| Menge  |    BMK     | Bauteil / genaue Bezeichnung                                                                                           |
| :----: | :--------: | :--------------------------------------------------------------------------------------------------------------------- |
| 6 Stk. | `-M1..-M6` | 12 V DC Peristaltik-Dosierpumpe (selbstansaugend, mit säurebeständigem Santoprene-/Silikonschlauch & Rückschlagventil) |
| 6 Stk. |  `Q1..Q6`  | Logic-Level N-Kanal-MOSFET IRLZ44N (TO-220 Gehäuse, schaltet schon bei 3,3 V Gate-Spannung voll durch!)                |
| 6 Stk. |  `D1..D6`  | Gleichrichterdiode 1N4007 (1000 V / 1 A, als Freilaufdiode parallel zu jedem Pumpenmotor)                              |
| 6 Stk. |   `R_G`    | Widerstand 100 Ω (Gate-Vorwiderstand zum Schutz des ESP32-Pins vor Umladeströmen)                                      |
| 6 Stk. |   `R_PD`   | Widerstand 10 kΩ (Gate-Pulldown-Widerstand nach GND – verhindert Pumpenlauf beim Einschalten!)                         |
| 6 Stk. | `LED1..6`  | Grüne 3 mm oder 5 mm LED + 6× Vorwiderstand 1 kΩ (zeigt optisch an, welche Pumpe gerade fördert)                       |

### Schaltplan & Klemmenanschluss

```
  [Pro Dosierkanal (6x identisch für M1=Dünger A, M2=Dünger B, M3=Blüte, M4=CalMag, M5=pH-, M6=pH+)]

                                         +12V_PWR (aus Sicherung -F4 von Projekt 1)
                                             │
                                     ┌───────┼───────┬───────────────┐
                                     │       │       │               │
                                    ─┴─     ┌┴┐     ┌┴┐             │
                           D1:      ╱▲╲     │M│     │ │ 1kΩ          │ (Ring/Kathode der 1N4007
                          1N4007    ─┬─     │=│12V  └┬┘              │  MUSS an +12V liegen!)
                         (Freilauf)  │      └┬┘      ▼ [LED grün]    │
                                     └───────┼───────┘               │
                                             │                       │
                                             ├──► Pin 2: Drain (D)   │
                                           ┌─┴─┐
   ESP32 GPIO ───────┬──[ R_G = 100 Ω ]───►│1:G│  Q1: IRLZ44N (TO-220 von vorne: 1=Gate, 2=Drain, 3=Source)
   (3,3V = EIN)      │                     └─┬─┘
                    ┌┴┐                      ├──► Pin 3: Source (S)
                    │ │ R_PD = 10 kΩ         │
                    └┬┘ (Pulldown!)          │
                     │                       │
                    GND ─────────────────────┴──► GND (Gemeinsame Masse 12V / ESP32)
```

### Schritt-für-Schritt-Bauanleitung

1. **Pinbelegung des `IRLZ44N` verstehen (siehe Bild 3 rechts):** Lege den MOSFET mit der schwarzen beschrifteten Vorderseite zu dir und den drei Beinchen nach unten: **Links (Pin 1) = Gate (Steuereingang)**, **Mitte (Pin 2) = Drain (Lastausgang zum Minuspol des Motors)**, **Rechts (Pin 3) = Source (fest an Masse `GND`)**.
2. **Gate-Beschaltung (`100 Ω` + `10 kΩ`) löten:** Löte an jedes linke Beinchen (Gate) einen `10 kΩ`-Widerstand direkt nach `GND` (Source, rechtes Beinchen). Dieser Widerstand ist lebenswichtig für die Pflanzen: Ohne ihn wirkt das Gate beim Einschalten wie eine Antenne und schaltet unkontrolliert pH-Säure in den Tank! Löte außerdem den `100 Ω`-Vorwiderstand vom Gate zur Steuereingangsklemme.
3. **Freilaufdiode `1N4007` einbauen (POLUNG PRÜFEN!):** Ein Elektromotor wirkt beim Abschalten wie eine Spule und erzeugt eine hohe Spannungsspitze von über 100 V, die den MOSFET sofort durchschießen würde. Löte deshalb je eine Diode `1N4007` zwischen `+12 V` (Seite mit dem **silbernen Ring / Kathode!**) und `Pin 2 (Drain)`.
4. **Pumpen einbauen & beschriften:** Montiere die 6 Peristaltikpumpen in eine Reihe in die Gehäusefront, verbinde alle Pluspole mit `+12 V` und jeden Minuspol mit dem jeweiligen `Drain (Pin 2)` von Kanal 1 bis 6. Beschrifte Saug- und Druckschlauch eindeutig mit Pfeilen (`▲ Ansaugung aus Flasche` / `▼ Druckleitung zum Tank`).

### Typische Azubi-Fehler – darauf musst du unbedingt achten!

- ⚠️ **Freilaufdiode falsch herum eingelötet:** Zeigt der silberne Ring der `1N4007` nach Drain statt nach `+12 V`, entsteht beim ersten Einschalten ein voller Kurzschluss über den MOSFET und die 4 A-Sicherung `-F4` löst aus!
- ⚠️ **Normalen `IRFZ44N` (ohne „L“) statt `IRLZ44N` verwendet:** Das **„L“** steht für _Logic-Level_ (schaltet schon bei 3,3 V vom ESP32 durch). Ein `IRFZ44N` braucht 10 V am Gate und wird bei 3,3 V kaum leitend.

### Prüf- & Abnahmecheckliste (vor Übergabe an den Dozenten)

- [ ] Diodentest mit Multimeter (spannungslos!): Von `Drain (Pin 2)` nach `+12 V` muss ca. `0,6 V` Flussspannung messbar sein; in Gegenrichtung `OL` (gesperrt).
- [ ] Funktionstest (mit 12 V): Bei offenem Steuereingang müssen alle 6 Pumpen stillstehen. Berührt man den Steuereingang mit `+3,3 V`, muss die jeweilige grüne LED leuchten und die Pumpe kräftig anlaufen.
- [ ] Kalibrierlauf (mit Messzylinder & Stoppuhr): Jede Pumpe 60 Sekunden lang klares Wasser pumpen lassen → Milliliter durch 60 teilen (Soll: ca. `0,85 bis 1,30 ml/s`) und Wert auf dem Pumpengehäuse notieren!

**Unterschrift Auszubildende/r:** **\*\*\*\***\_\_\_**\*\*\*\*** &nbsp;&nbsp; **Abnahme Dozent/Ausbilder:** **\*\*\*\***\_\_\_**\*\*\*\***

---

## Projektarbeit 6 (Modul S1): I²C-Klimamesskopf „Blätterdach-Sonde“ (Lufttemperatur, Luftfeuchte, CO₂ & IR-Blatttemperatur)

- **Empfohlenes Ausbildungsjahr:** 1. / 2. Ausbildungsjahr
- **Richtzeit:** ca. 3–4 Unterrichtsstunden
- **Ziel des Arbeitsauftrags:** Bau eines spritzwassergeschützten, belüfteten Sensor-Messkopfes für das Blätterdach im Zelt, der drei digitale I²C-Sensoren (SHT31, SCD41 und MLX90614) über ein einziges 4-adriges geschirmtes Kabel (GX12-4 Stecker) mit dem Schaltschrank verbindet.

### Warum bauen wir dieses Bauteil? (Einfach erklärt)

Um den sogenannten Blatt-VPD (Dampfdruckdefizit – der wichtigste Wert für optimales Pflanzenwachstum) exakt zu berechnen, muss die Steuerung gleichzeitig die Lufttemperatur, die Luftfeuchtigkeit, den CO₂-Gehalt und per Infrarot die echte Temperatur der Blattoberfläche messen. Da alle drei Sensoren den digitalen I²C-Bus sprechen und unterschiedliche Hausnummern (Bus-Adressen `0x44`, `0x62` und `0x5A`) haben, können wir alle drei einfach parallel an dieselben vier Adern hängen!

### benötigte Bauteile (Stückliste für deinen Arbeitsplatz)

| Menge  |    BMK    | Bauteil / genaue Bezeichnung                                                                                                |
| :----: | :-------: | :-------------------------------------------------------------------------------------------------------------------------- |
| 1 Stk. |   `-B1`   | Sensirion SHT31-D oder SHT40 Breakout-Board (I²C-Adresse 0x44: Lufttemperatur & Luftfeuchte)                                |
| 1 Stk. |   `-B2`   | Sensirion SCD40 oder SCD41 Breakout-Board (I²C-Adresse 0x62: Echter NDIR-CO₂-Sensor in ppm)                                 |
| 1 Stk. |   `-B3`   | Melexis MLX90614ESF-BAA Breakout-Board (I²C-Adresse 0x5A, 3,3 V Version: Infrarot-Blatttemperatur)                          |
| 1 Stk. | `Gehäuse` | Kleines Kunststoff-Leergehäuse (z. B. 80×50×30 mm) mit seitlichen Lüftungsschlitzen + 12 mm Bohrung unten für den IR-Sensor |
| 2,5 m  | `Leitung` | Geschirmte Steuerleitung LiYCY 4×0,25 mm² (Farben: Rot/Weiß = +3,3V, Braun/Schwarz = GND, Grün = SDA, Gelb = SCL)           |
| 1 Paar | `X5:1..4` | Rundsteckverbinder GX12-4 (4-poliger Luftfahrtstecker + Einbaubuchse für den Schaltschrank)                                 |

### Schaltplan & Klemmenanschluss

```
  [Schaltschrank-Buchse GX12-4 (X5)]          [Geschirmtes Kabel LiYCY 4x0,25]          [Im Klimamesskopf parallel verdrahtet]
   Pin 1 (+3,3V vom ESP32) ────────────────────── Ader 1 (Rot) ──────────────────────┬──► VIN / VCC an SHT31   (Adresse 0x44)
                                                                                     ├──► VIN / VCC an SCD41   (Adresse 0x62)
                                                                                     └──► VIN / VCC an MLX90614(Adresse 0x5A)

   Pin 2 (GND + Kabelschirm!) ─────────────────── Ader 2 (Schwarz) ──────────────────┬──► GND an SHT31, SCD41 & MLX90614
   (Schirmgeflecht NUR im Schaltschrank an GND!)                                     │
                                                                                    ─┴─ 100nF Keramikkondensator (Stützung im Kopf)
                                                                                    ─┬─ (zwischen +3,3V und GND im Messkopf)
   Pin 3 (GPIO 21 / SDA) ──────────────────────── Ader 3 (Grün) ─────────────────────┴──► SDA an SHT31, SCD41 & MLX90614
   Pin 4 (GPIO 22 / SCL) ──────────────────────── Ader 4 (Gelb) ────────────────────────► SCL an SHT31, SCD41 & MLX90614
```

### Schritt-für-Schritt-Bauanleitung

1. **Gehäuse bearbeiten:** Bohre an der Unterseite des kleinen Sensorgehäuses ein passendes Loch (ca. 9 mm) für die Metallkappe des Infrarot-Sensors `MLX90614`, sodass er später im Zelt schräg nach unten auf ein Blatt blicken kann. Bringe seitlich Lüftungsbohrungen für `SHT31` und `SCD41` an (oben geschlossen lassen gegen Tropfwasser!).
2. **Alle 3 Sensoren im Kopf parallel verdrahten:** Verbinde auf einer kleinen Streifenrasterplatine im Gehäuse alle drei `VCC`-Pins miteinander, alle drei `GND`-Pins miteinander, alle drei `SDA`-Pins miteinander und alle drei `SCL`-Pins miteinander. Löte im Messkopf einen `100 nF`-Kondensator zwischen `VCC` und `GND`.
3. **Geschirmtes Kabel & GX12-4 Stecker anlöten (siehe Bild 4 links):** Schiebe vor dem Löten die Überwurfmutter und einen kurzen Schrumpfschlauch auf das Kabel! Löte am GX12-4 Stecker: **Pin 1 = +3,3 V**, **Pin 2 = GND**, **Pin 3 = SDA**, **Pin 4 = SCL**.
4. **Schirmung einseitig auflegen (EMV-Regel der Betriebstechnik!):** Verbinde das Kupfer-Schirmgeflecht des `LiYCY`-Kabels **nur auf der Schaltschrankseite** mit `GND (Pin 2)`. Im Messkopf wird der Schirm sauber isoliert und nicht angeschlossen (verhindert Brummschleifen).

### Typische Azubi-Fehler – darauf musst du unbedingt achten!

- ⚠️ **SDA und SCL vertauscht:** Werden Pin 3 (`SDA`) und Pin 4 (`SCL`) verwechselt, geht nichts kaputt, aber der ESP32 findet keinen der drei Sensoren auf dem Bus.
- ⚠️ **Schrumpfschlauch oder Steckerhülse vor dem Anlöten vergessen:** Klassiker in jeder Elektroniker-Prüfung – erst Überwurfmutter aufs Kabel fädeln, dann löten!

### Prüf- & Abnahmecheckliste (vor Übergabe an den Dozenten)

- [ ] Kurzschlusstest mit Multimeter: Zwischen allen 4 Pins des GX12-Steckers messen → Zwischen Pin 1 (`+3,3 V`) und Pin 2 (`GND`) darf kein Kurzschluss sein!
- [ ] I²C-Scanner-Test am ESP32: Melden sich beim Einstecken des Messkopfes sofort alle drei Adressen `0x44` (SHT31), `0x5A` (MLX90614) und `0x62` (SCD41)?

**Unterschrift Auszubildende/r:** **\*\*\*\***\_\_\_**\*\*\*\*** &nbsp;&nbsp; **Abnahme Dozent/Ausbilder:** **\*\*\*\***\_\_\_**\*\*\*\***

---

## Projektarbeit 7 (Modul S2): Nährstofftank-Messbox: pH-Sonde, EC-Sonde (galvanisch getrennt!) & DS18B20 Wassertemperatur

- **Empfohlenes Ausbildungsjahr:** 2. / 3. Ausbildungsjahr
- **Richtzeit:** ca. 4–5 Unterrichtsstunden
- **Ziel des Arbeitsauftrags:** Aufbau der elektrochemischen Wassermessstrecke für pH-Wert (waterPh), elektrische Leitfähigkeit (waterEc) und Wassertemperatur (waterTemp) inkl. galvanischer Trennung des EC-Messkreises zur Vermeidung von Erdschleifen im Tank.

### Warum bauen wir dieses Bauteil? (Einfach erklärt)

Im Nährstofftank müssen wir wissen, wie viel Dünger im Wasser gelöst ist (Leitwert EC in mS/cm) und wie sauer das Wasser ist (pH-Wert, optimal 5,8–6,3). Weil die EC-Sonde einen kleinen Wechselstrom durchs Wasser schickt und die pH-Glaselektrode extrem empfindliche Millivolt-Spannungen misst, würden sich beide Sonden im selben Wasser gegenseitig stören. Mit einem galvanischen Trennbaustein (`B0505S-1W` / `DFR0504`) trennen wir die Stromkreise komplett voneinander!

### benötigte Bauteile (Stückliste für deinen Arbeitsplatz)

| Menge  |   BMK    | Bauteil / genaue Bezeichnung                                                                                          |
| :----: | :------: | :-------------------------------------------------------------------------------------------------------------------- |
| 1 Stk. |  `-B4`   | Wasserdichter Temperaturfühler DS18B20 in V4A-Edelstahlhülse (OneWire: Rot=3,3V, Gelb=Daten GPIO 4, Schwarz=GND)      |
| 1 Stk. |  `-B5`   | DFRobot Gravity Analog pH Sensor Pro V2 (Signalwandlerplatine + BNC-Glaselektrode)                                    |
| 1 Stk. |  `-B6`   | DFRobot Gravity Analog Electrical Conductivity Sensor V2 (K=1.0 Messzelle + Signalwandlerplatine)                     |
| 1 Stk. |  `-U4`   | Galvanischer Analog-Signal-Isolator (DFRobot Gravity Analog Signal Isolator DFR0504 mit B0505S-1W DC/DC-Trennwandler) |
| 1 Satz | `Kalib.` | Kalibrierlösungen: pH 7,00 Pufferlösung, pH 4,00 Pufferlösung und EC 1,413 mS/cm Kalibrierlösung                      |

### Schaltplan & Klemmenanschluss

```
  [1. Wassertemperatur (-B4: DS18B20 OneWire an Klemme X5:5..7)]
   Rot     ──────────────────────────────► X5:5 (+3,3V DC)
   Gelb    ──────────────────────────────► X5:6 (GPIO 4 am ESP32, dort sitzt der 4,7kΩ Pull-up nach +3,3V)
   Schwarz ──────────────────────────────► X5:7 (GND)

  [2. pH-Messstrecke (-B5: direkt am 3,3V-Kreis an Klemme X6:1)]
   pH-BNC-Sonde ──► [pH V2 Platine] ──┬──► "+" an +3,3V DC
                                      ├──► "-" an GND
                                      └──► "A" (Analog Out 0..3,0V) ──► X6:1 (GPIO 34 / ADC1_CH6)

  [3. EC-Messstrecke (-B6: ZWINGEND über galvanischen Isolator -U4 an Klemme X6:2!)]
   EC-BNC-Sonde ──► [EC V2 Platine] ══► (Isolierte Seite) [Galvanischer Isolator -U4] (ESP32-Seite) ──┬──► "+" an +5V DC
                    (KEINE direkte Masseverbindung!)                                                  ├──► "-" an GND
                                                                                                      └──► "A" ──► X6:2 (GPIO 35)
```

### Schritt-für-Schritt-Bauanleitung

1. **BNC-Einbaubuchsen isoliert montieren:** Baue die beiden BNC-Buchsen der pH- und EC-Platine in die Gehäusewand ein. **Wichtig:** Falls du ein Metallgehäuse verwendest, dürfen sich die metallenen Außenringe der beiden BNC-Buchsen nicht über das Gehäuse berühren (Kunststoff-Isolierscheiben verwenden!).
2. **pH-Modul (`-B5`) anschließen:** Verbinde den Versorgungseingang des pH-Moduls mit `+3,3 V` und `GND` und führe den Analogausgang (`A`) auf Klemme `X6:1` (`GPIO 34` am ESP32).
3. **EC-Modul (`-B6`) über den galvanischen Isolator (`-U4`) anschließen (siehe Bild 4 Mitte):** Stecke das 3-polige Kabel des EC-Moduls in die **isolierte Ausgangsseite (`PH2.0 / Sensor`)** des Isolator-Bausteins `-U4`. Verbinde die **Eingangsseite (`Controller`)** des Isolators mit `+5 V`, `GND` und den Analogausgang mit Klemme `X6:2` (`GPIO 35`).
4. **Temperatursensor `DS18B20` (`-B4`) anschließen:** Lege die drei Adern (`Rot = +3,3 V`, `Gelb/Weiß = Daten GPIO 4`, `Schwarz = GND`) über einen 3-poligen `GX12-3`-Stecker auf `X5:5..7`.

### Typische Azubi-Fehler – darauf musst du unbedingt achten!

- ⚠️ **Schutzkappe der pH-Sonde austrocknen lassen:** In der Schutzkappe der pH-Glaselektrode befindet sich 3-molare Kaliumchlorid-Lösung (`3M KCl`). Die Glaskugel an der Spitze darf **niemals trocken gelagert** oder in destilliertem Wasser aufbewahrt werden!
- ⚠️ **EC-Modul ohne Isolator direkt angeschlossen:** Sobald beide Sonden gleichzeitig ins selbe Gefäß getaucht werden, springt der pH-Wert um mehrere Punkte weg.

### Prüf- & Abnahmecheckliste (vor Übergabe an den Dozenten)

- [ ] Isolationsprüfung der BNC-Massen: Mit dem Multimeter auf Durchgang zwischen dem Außenring der pH-BNC-Buchse und dem Außenring der EC-BNC-Buchse messen → Es darf **kein Durchgang (`OL`)** bestehen!
- [ ] 2-Punkt-Kalibrierung der pH-Sonde: Sonde in Pufferlösung `pH 7,00` tauchen → Spannung an `X6:1` messen (Soll: ca. `1500 mV`) und Wert für `PH_MV_AT_7_0` notieren. Mit Wasser abspülen, in `pH 4,00` tauchen → Spannung messen (Soll: ca. `2030 mV`) und für `PH_MV_AT_4_0` notieren.

**Unterschrift Auszubildende/r:** **\*\*\*\***\_\_\_**\*\*\*\*** &nbsp;&nbsp; **Abnahme Dozent/Ausbilder:** **\*\*\*\***\_\_\_**\*\*\*\***

---

## Projektarbeit 8 (Modul S3): Wasserdichter Ultraschall-Tankfüllstandssensor (JSN-SR04T) mit 5V→3,3V Pegelwandler

- **Empfohlenes Ausbildungsjahr:** 1. Ausbildungsjahr (perfektes Einsteigerprojekt zum Ohmschen Gesetz & Spannungsteiler!)
- **Richtzeit:** ca. 2–3 Unterrichtsstunden
- **Ziel des Arbeitsauftrags:** Aufbau der berührungslosen Füllstandsmessung für den Nährstofftank mit dem Ultraschallsensor JSN-SR04T und Berechnung/Aufbau eines resistiven Spannungsteilers (10 kΩ / 20 kΩ) zur Anpassung des 5 V-Echo-Signals an den 3,3 V-Eingang des ESP32.

### Warum bauen wir dieses Bauteil? (Einfach erklärt)

Die Bewässerungspumpe darf niemals trockenlaufen (sonst brennt sie durch). Der Ultraschallsensor sitzt oben im Tankdeckel, sendet einen kurzen Schallimpuls nach unten auf die Wasseroberfläche und misst die Zeit bis zum Echo. Da das Sensormodul mit 5,0 V arbeitet und am `ECHO`-Pin 5,0 V ausgibt, der ESP32 an `GPIO 32` aber nur 3,3 V verträgt, bauen wir einen klassischen Spannungsteiler aus zwei Widerständen!

### benötigte Bauteile (Stückliste für deinen Arbeitsplatz)

| Menge  |    BMK     | Bauteil / genaue Bezeichnung                                                                             |
| :----: | :--------: | :------------------------------------------------------------------------------------------------------- |
| 1 Stk. |   `-B8`    | Wasserdichter Ultraschall-Abstandssensor JSN-SR04T (Sensorkopf mit 2,5 m Koaxialkabel + Auswerteplatine) |
| 1 Stk. |    `R1`    | Metallfilmwiderstand 10 kΩ (oberer Widerstand des Spannungsteilers)                                      |
| 1 Stk. |    `R2`    | Metallfilmwiderstand 20 kΩ (unterer Widerstand des Spannungsteilers nach GND)                            |
| 1 Paar | `X5:8..11` | 4-poliger Rundsteckverbinder GX12-4 + kleines Gehäuse für die JSN-SR04T-Platine                          |

### Schaltplan & Klemmenanschluss

```
  [Berechnung des Spannungsteilers (Formel für die Berufsschule):]
   U_GPIO32 = U_ECHO * (R2 / (R1 + R2)) = 5,0 V * (20 kΩ / (10 kΩ + 20 kΩ)) = 5,0 V * (20 / 30) = 3,33 V  (PERFEKT!)

  [Schaltbild auf der kleinen Sensorplatine (siehe auch Bild 4 rechts):]
   Klemme X5:8  (+5V DC aus -T2) ─────────────────────────────► Pin "5V"   am JSN-SR04T Modul
   Klemme X5:9  (GPIO 12 vom ESP32, 3,3V reicht als HIGH!) ───► Pin "TRIG" am JSN-SR04T Modul

   Pin "ECHO" am JSN-SR04T (5,0V Ausgang!) ──► [ R1 = 10 kΩ ] ──┬──► Klemme X5:10 (geht an GPIO 32 am ESP32, max. 3,33V!)
                                                                │
                                                           [ R2 = 20 kΩ ]
                                                                │
   Klemme X5:11 (GND) ──────────────────────────────────────────┴──► Pin "GND"  am JSN-SR04T Modul
```

### Schritt-für-Schritt-Bauanleitung

1. **Widerstände mit dem Multimeter nachmessen:** Miss vor dem Einlöten beide Widerstände im $\Omega$-Bereich nach (`R1 = 10,0 kΩ`, `R2 = 20,0 kΩ`), damit sie nicht verwechselt werden.
2. **Spannungsteiler aufbauen (siehe Bild 4 rechts):** Löte `R1 (10 kΩ)` an den `ECHO`-Pin des `JSN-SR04T`-Moduls. Verbinde das andere Ende von `R1` mit einem Bein von `R2 (20 kΩ)` und führe genau diesen Mittelabgriff auf den Ausgangspin für `GPIO 32 (X5:10)`. Das freie Bein von `R2` lötest du an `GND`.
3. **Sensorkopf für den Tankdeckel vorbereiten:** Der runde Ultraschall-Sensorkopf braucht im Tankdeckel eine Bohrung von ca. `22 mm` Durchmesser. Wichtig: Der `JSN-SR04T` hat einen Mindestabstand (Totzone) von ca. **20 cm** – montiere ihn also oben auf einem kleinen Distanzrohr auf dem Tankdeckel oder stelle `TANK_DIST_FULL_CM` passend ein.

### Typische Azubi-Fehler – darauf musst du unbedingt achten!

- ⚠️ **`R1 (10 kΩ)` und `R2 (20 kΩ)` vertauschen:** Sitzt der `20 kΩ` oben und der `10 kΩ` unten nach `GND`, kommt am ESP32 nur noch $5\,\text{V} \cdot \frac{10}{30} = 1{,}67\,\text{V}$ an – das reicht dem ESP32 nicht mehr sicher als HIGH-Pegel!
- ⚠️ **Echo-Pin ohne Spannungsteiler direkt an GPIO 32 anschließen:** 5,0 V schädigen auf Dauer den Schutzdioden-Eingang des ESP32.

### Prüf- & Abnahmecheckliste (vor Übergabe an den Dozenten)

- [ ] Widerstandsmessung (spannungslos): Vom `ECHO`-Pin des Moduls nach `GND` müssen $R_1 + R_2 = 30\,\text{k}\Omega$ messbar sein; vom Ausgang `X5:10 (GPIO 32)` nach `GND` exakt $20\,\text{k}\Omega$.
- [ ] Abstandstest am ESP32: Halte ein Buch in 30 cm und danach in 45 cm Abstand vor den Sensor → Zeigt der Serielle Monitor den korrekten Füllstand in Prozent an?

**Unterschrift Auszubildende/r:** **\*\*\*\***\_\_\_**\*\*\*\*** &nbsp;&nbsp; **Abnahme Dozent/Ausbilder:** **\*\*\*\***\_\_\_**\*\*\*\***

---

## Projektarbeit 9 (Modul S4): Kapazitiver Substratfeuchte-Sensor (v2.0) mit Feuchteschutz-Versiegelung & Kalibrierung

- **Empfohlenes Ausbildungsjahr:** 1. Ausbildungsjahr
- **Richtzeit:** ca. 2–3 Unterrichtsstunden
- **Ziel des Arbeitsauftrags:** Aufbau, Kantenversiegelung und 2-Punkt-Kalibrierung des korrosionsfreien kapazitiven Bodenfeuchtesensors (soilMoisture) für die automatische Bewässerungssteuerung.

### Warum bauen wir dieses Bauteil? (Einfach erklärt)

Billige Bodenfeuchtesensoren mit zwei blanken Metallgabeln messen den Widerstand der Erde und lösen sich durch Elektrolyse innerhalb weniger Wochen im feuchten Boden auf (Grünspan und Metallionen im Substrat!). Unser kapazitiver Sensor v2.0 hat überhaupt kein offenes Metall: Er bildet mit der feuchten Erde einen elektrischen Kondensator, dessen Kapazität sich je nach Wassergehalt ändert, und gibt eine saubere Gleichspannung von ca. 1,1 V (nass) bis 2,8 V (trocken) aus.

### benötigte Bauteile (Stückliste für deinen Arbeitsplatz)

|  Menge   |    BMK    | Bauteil / genaue Bezeichnung                                                                            |
| :------: | :-------: | :------------------------------------------------------------------------------------------------------ |
| 1–2 Stk. |   `-B7`   | Kapazitiver Bodenfeuchtesensor v1.2 / v2.0 (mit integriertem TLC555 Timer-IC und 3,3 V Spannungsregler) |
|  2,5 m   | `Leitung` | 3-adrige flexible Sensorleitung LiYY 3×0,25 mm² + Schrumpfschlauch mit Innenkleber                      |
|  1 Paar  | `X6:3..5` | 3-poliger Rundsteckverbinder GX12-3                                                                     |
|  etwas   |  `Lack`   | Platinen-Schutzlack (Urethan/Acryl) oder 2K-Epoxidharz zur Versiegelung der Schnittkante                |

### Schaltplan & Klemmenanschluss

```
  [Kapazitiver Bodenfeuchtesensor v2.0 (-B7) an Klemme X6:3..5]
   Kabel Rot     (VCC)  ──────────────────► X6:3 (+3,3V DC oder +5V DC)
   Kabel Gelb    (AOUT) ──────────────────► X6:4 (GPIO 36 / VP am ESP32, Analogeingang ADC1_CH0)
   Kabel Schwarz (GND)  ──────────────────► X6:5 (GND)

  [Kennlinie des Sensors (umgekehrt proportional / invertiert!):]
   • Sensor trocken an der Luft (0 % Feuchte)  ──► Hohe Spannung (~2,7 V) ──► Hoher ADC-Rohwert (~3100)
   • Sensor im Wasserglas     (100 % Feuchte) ──► Niedrige Spg. (~1,1 V) ──► Niedriger ADC-Rohwert (~1350)
```

### Schritt-für-Schritt-Bauanleitung

1. **Schnittkante der Sensorplatine versiegeln (WICHTIGSTER SCHRITT!):** Schau dir die seitliche Kante der Sensorzunge genau an (siehe Bild 5 links): Dort liegt das Glasfaser-Gewebe (`FR4`) der Leiterplatte offen. Wenn du den Sensor unversiegelt in nasse Erde steckst, saugt sich die Kante im Lauf der Wochen mit Wasser voll. Bestreiche deshalb die gesamte Seitenkante und den oberen Elektronikteil dünn mit **Platinen-Schutzlack oder Epoxidharz** und ziehe über den oberen Elektronik-Kopf ein Stück **Schrumpfschlauch mit Heißkleber**!
2. **Verlängerungskabel & GX12-3 Stecker anlöten:** Verlängere das kurze Originalkabel mit der 3-adrigen Steuerleitung (`Pin 1 = VCC`, `Pin 2 = AOUT`, `Pin 3 = GND`).
3. **Trocken- und Nass-Kalibrierung durchführen:** Lies am Seriellen Monitor (oder mit dem Multimeter an `X6:4`) einmal den Wert an trockener Raumluft ab (`SOIL_ADC_DRY`, ca. `3100` bzw. `2,7 V`) und tauche die Sensorzunge danach **nur bis zur weißen Warnlinie** in ein Glas Wasser (`SOIL_ADC_WET`, ca. `1350` bzw. `1,1 V`).

### Typische Azubi-Fehler – darauf musst du unbedingt achten!

- ⚠️ **Sensor zu tief eingetaucht:** Die kleinen SMD-Bauteile (`TLC555` Chip) am oberen Ende des Sensors dürfen niemals unter Wasser oder unter die Erdoberfläche geraten – immer nur bis zur aufgedruckten weißen Linie einstechen!

### Prüf- & Abnahmecheckliste (vor Übergabe an den Dozenten)

- [ ] Spannungstest Trocken vs. Nass mit Multimeter an `X6:4` gegen `GND`: Sinkt die Spannung sofort von ca. `2,6–2,8 V` (in der Luft) auf ca. `1,0–1,3 V`, sobald man die Sensorzunge in ein Glas Wasser hält?

**Unterschrift Auszubildende/r:** **\*\*\*\***\_\_\_**\*\*\*\*** &nbsp;&nbsp; **Abnahme Dozent/Ausbilder:** **\*\*\*\***\_\_\_**\*\*\*\***

---

## Projektarbeit 10 (Modul S5): Sicherheits- & Überwachungsmodul: Leckage-Bodensonde, Rauchmelder-Relais & Tür-Reedkontakt

- **Empfohlenes Ausbildungsjahr:** 1. / 2. Ausbildungsjahr
- **Richtzeit:** ca. 3 Unterrichtsstunden
- **Ziel des Arbeitsauftrags:** Aufbau der drei Sicherheits-Überwachungssensoren: Elektronischer Wassermelder für die Zelt-Bodenwanne (leak), Rauchmelder mit potenzialfreiem Öffnerkontakt (smoke) und magnetischer Türkontakt (door) zur Hardware-Verriegelung des CO₂-Ventils.

### Warum bauen wir dieses Bauteil? (Einfach erklärt)

In der Betriebstechnik gilt der Grundsatz: _Sicherheit darf niemals allein von einem Computerprogramm abhängen!_ Deshalb bauen wir drei unabhängige Wächter: 1. Einen Lecksensor am Zeltboden, der bei auslaufendem Wasser sofort Pumpen und Dosierer stoppt. 2. Einen Rauchmelder an der Zeltdecke, der bei Rauchentwicklung über einen Öffnerkontakt direkt den Strom für Heizung und Licht kappt. 3. Einen Magnetkontakt am Zelt-Reißverschluss, der verhindert, dass CO₂-Gas einströmt, während jemand das Zelt öffnet.

### benötigte Bauteile (Stückliste für deinen Arbeitsplatz)

| Menge  |    BMK    | Bauteil / genaue Bezeichnung                                                                                    |
| :----: | :-------: | :-------------------------------------------------------------------------------------------------------------- |
| 1 Stk. |   `-B9`   | Wassermelder-Auswertemodul (LM393-Komparator, Active-LOW) + rostfreie Bodensonde mit 2× V4A-Edelstahl-Kontakten |
| 1 Stk. |  `-B17`   | Rauchwarnmelder mit integriertem Koppelrelais-Sockel (potenzialfreier Wechslerkontakt NO/NC/COM)                |
| 1 Stk. |  `-B18`   | Magnetischer Reed-Türkontakt (Aufbau-Gehäuse mit Kabel, Schließer/Öffner)                                       |
| 3 Paar | `Stecker` | Rundsteckverbinder GX12-2 / M12 für Klemmenleiste X6:6..9                                                       |

### Schaltplan & Klemmenanschluss

```
  [1. Leckage-Sensor (-B9) an Klemme X6:6..7 (Active-LOW: Trocken = 3,3V HIGH, Wasser = 0V LOW)]
   X6 (+3,3V) ──► VCC  [LM393 Komparator-Modul]  Sonde+ ──► Edelstahl-Stift 1 (am tiefsten Punkt der Zeltwanne)
   X6:7 (GND) ──► GND  [                      ]  Sonde- ──► Edelstahl-Stift 2 (Abstand ~5 mm)
   X6:6       ◄── DO   (Digital Out ──► GPIO 39 / VN am ESP32: Schaltet bei Wasser sofort auf 0V LOW!)

  [2. Rauchmelder (-B17) Hardware-Abschaltung in der Schütz-Steuerleitung (Projekt 3)]
   +5V (aus Not-Aus -S0) ──► [COM] Rauchmelder-Relais [NC (Öffner)] ──► JD-VCC der Lastrelais (Projekt 3)
   (Im Normalbetrieb geschlossen = 5V liegt an. Bei Rauch öffnet der Kontakt = alle 230V-Schütze fallen ab!)

  [3. Zelt-Türkontakt (-B18) Hardware-Freigabe für CO₂-Magnetventil (-Y1)]
   Relais-Ausgang CO₂ (-K5) ──► [Reed-Kontakt Tür (geschlossen wenn Tür ZU)] ──► Spule CO₂-Magnetventil (-Y1, NC)
```

### Schritt-für-Schritt-Bauanleitung

1. **Leckage-Bodensonde (`-B9`) bauen:** Baue für die Zelt-Bodenwanne einen kleinen flachen Kunststoffblock, aus dem nach unten zwei Schrauben aus rostfreiem Edelstahl (`V4A`) im Abstand von ca. 5 mm genau 1 mm über dem Zeltboden stehen. Verbinde sie mit dem Eingang des `LM393`-Komparatormoduls.
2. **Schaltschwelle am `LM393` einstellen:** Verbinde `VCC` mit `+3,3 V`, `GND` mit `GND` und `DO` mit `GPIO 39 (X6:6)`. Drehe das kleine blaue Potentiometer auf dem `LM393`-Modul so ein, dass die Schalt-LED im trockenen Zustand **aus** ist (`DO = 3,3 V`) und sofort **angeht** (`DO = 0 V`), sobald du beide Edelstahl-Schrauben mit einem feuchten Finger oder feuchten Tuch berührst.
3. **Rauchmelder-Öffner (`NC`) und Türkontakt (`-B18`) verdrahten:** Schließe an der Relaisklemme des Rauchmelders die Klemmen `COM` und `NC (Normally Closed / Öffner)` an Klemme `X6:8..9` an. Drahtbruch-Vorteil: Selbst wenn jemand das Kabel zum Rauchmelder durchschneidet, öffnet der Stromkreis und die Anlage geht in den sicheren Zustand (Ruhestromprinzip!).

### Typische Azubi-Fehler – darauf musst du unbedingt achten!

- ⚠️ **Schließer (`NO`) statt Öffner (`NC`) am Rauchmelder verwendet:** In der Sicherheitstechnik arbeitet man immer nach dem **Ruhestromprinzip (drahtbruchsicher)** – im Normalbetrieb fließt Strom über den geschlossenen Öffnerkontakt; bei Gefahr oder Kabelbruch wird unterbrochen!

### Prüf- & Abnahmecheckliste (vor Übergabe an den Dozenten)

- [ ] Leckage-Test: Feuchtes Papiertuch unter die Sonde legen → Springt `GPIO 39` sofort von `3,3 V` auf `0,0 V` und stoppt der ESP32 laufende Pumpen?
- [ ] Drahtbruch-Test am Rauchmelder-Stecker `X6:8..9`: Stecker abziehen → Fallen sofort die Freigaberelais der 230 V-Lastgruppe (Projekt 3) ab?

**Unterschrift Auszubildende/r:** **\*\*\*\***\_\_\_**\*\*\*\*** &nbsp;&nbsp; **Abnahme Dozent/Ausbilder:** **\*\*\*\***\_\_\_**\*\*\*\***

---

## Projektarbeit 11 (Modul K1): Optisches KI-Kameramodul (ESP32-CAM AI-Thinker) mit 160°-Weitwinkel & Stützelko

- **Empfohlenes Ausbildungsjahr:** 1. / 2. Ausbildungsjahr
- **Richtzeit:** ca. 2–3 Unterrichtsstunden
- **Ziel des Arbeitsauftrags:** Aufbau, Stromversorgungs-Stabilisierung (470 µF Elko), Programmierung und Gehäuseeinbau des ESP32-CAM-Moduls (-A2) für die automatische KI-Blattdiagnose alle 30 Minuten.

### Warum bauen wir dieses Bauteil? (Einfach erklärt)

Unser GrowMaster-Server besitzt eine Bilderkennungs-KI, die auf Fotos automatisch Blattmängel, Schimmel, Wachstumsphase und Pflanzenhöhe erkennt. Dafür nimmt ein kleines `ESP32-CAM`-Modul im Zelt alle 30 Minuten (nur solange das Licht an ist!) ein hochauflösendes Foto (`1280×1024 Pixel`) auf und schickt es per WLAN an `/api/device/v1/snapshot`.

### benötigte Bauteile (Stückliste für deinen Arbeitsplatz)

| Menge  |    BMK    | Bauteil / genaue Bezeichnung                                                                                 |
| :----: | :-------: | :----------------------------------------------------------------------------------------------------------- |
| 1 Stk. |   `-A2`   | ESP32-CAM Modul (AI-Thinker mit OV2640 Kamera und 4 MB PSRAM)                                                |
| 1 Stk. |  `Prog.`  | ESP32-CAM-MB Aufsteck-Programmieradapter (Micro-USB / USB-C mit CH340C Chip)                                 |
| 1 Stk. |  `Linse`  | Optional: 160°-Weitwinkel-Kameramodul OV2640 (erfasst auch in niedrigen Zelten das ganze Blätterdach)        |
| 1 Stk. |  `C_CAM`  | Elektrolytkondensator 470 µF / 10 V (direkt an 5V und GND gegen Brownout-Abstürze!)                          |
| 1 Stk. | `Gehäuse` | Kleines spritzwassergeschütztes Kameragehäuse mit Kabelverschraubung und Halteclip für Zeltstange (16–22 mm) |

### Schaltplan & Klemmenanschluss

```
  [Spannungsversorgung des ESP32-CAM (-A2) über 2-polige Leitung aus dem Schaltschrank (+5V / GND)]

   Schaltschrank +5V_DC (aus -T2, Rot, 0,75mm²) ──────┬──────► Pin "5V"  am ESP32-CAM (oben links)
                                                     ─┴─
                                                     ─┬─ C_CAM = 470 µF / 10 V (Elko direkt am Modul!)
                                                      │  (Weißer Minus-Streifen zwingend an GND!)
   Schaltschrank GND    (Schwarz, 0,75mm²)      ──────┴──────► Pin "GND" am ESP32-CAM (daneben)
```

### Schritt-für-Schritt-Bauanleitung

1. **Flachbandkabel der Kamera (`OV2640`) vorsichtig einrasten:** Öffne am kleinen schwarzen Steckverbinder des `ESP32-CAM` die braune Verriegelungsklappe vorsichtig nach oben, schiebe das goldene Flachbandkabel der Kamera gerade bis zum Anschlag hinein und drücke die Klappe wieder herunter.
2. **Den `470 µF`-Stützkondensator anlöten (siehe Bild 5 rechts):** Das `ESP32-CAM`-Board ist berüchtigt für die Fehlermeldung _„Brownout detector was triggered“_, weil Kamera + WLAN beim Senden eines Fotos kurzzeitig hohe Stromspitzen ziehen. Löte deshalb den `470 µF`-Elko mit kurzen Beinchen direkt an den `5V`-Pin (Plus) und den `GND`-Pin (Minus-Streifen) auf der Rückseite des Boards!
3. **Firmware mit dem `ESP32-CAM-MB` flashen:** Stecke das `ESP32-CAM` auf das `ESP32-CAM-MB` USB-Unterteil, trage in `firmware/esp32cam-growmaster/src/config.h` WLAN, Server-URL und Geräte-Token (`gmd_...`) ein und flashe das Board mit `pio run -t upload`.
4. **Einbau ins Zelt-Gehäuse:** Setze die Kamera in das Schutzgehäuse und richte sie später schräg von oben auf das Blätterdach, sodass auch der Topfrand oder eine Zeltstange als Größenmaßstab im Bild zu sehen ist.

### Typische Azubi-Fehler – darauf musst du unbedingt achten!

- ⚠️ **ESP32-CAM über den `3V3`-Pin statt über den `5V`-Pin versorgt:** Bei längerer Zuleitung ins Zelt fällt auf einer 3,3 V-Leitung zu viel Spannung ab – immer mit **5,0 V DC** an den `5V`-Pin gehen (auf dem Modul sitzt ein eigener Spannungsregler)!
- ⚠️ **Flachbandkabel der Kamera stark geknickt:** Die feinen Leiterbahnen im Kamerakabel brechen bei scharfen Knicken.

### Prüf- & Abnahmecheckliste (vor Übergabe an den Dozenten)

- [ ] Serieller Monitor (115200 Baud) prüfen: Meldet das Board beim Start `PSRAM gefunden`, verbindet sich mit dem WLAN und antwortet der Server beim ersten Testbild mit `HTTP 200: {"ok":true,"analyzed":true}`?

**Unterschrift Auszubildende/r:** **\*\*\*\***\_\_\_**\*\*\*\*** &nbsp;&nbsp; **Abnahme Dozent/Ausbilder:** **\*\*\*\***\_\_\_**\*\*\*\***

---

## Projektarbeit 12 (Modul G1): Systemintegration („Schaltschrank-Hochzeit“), VDE-Prüfung & Gesamt-Inbetriebnahme

- **Empfohlenes Ausbildungsjahr:** 3. Ausbildungsjahr (oder gemeinsame Abschlussarbeit der gesamten Azubi-Gruppe mit dem Dozenten)
- **Richtzeit:** ca. 4–6 Unterrichtsstunden
- **Ziel des Arbeitsauftrags:** Zusammenbau aller 11 Einzelmodule im Schaltschrank, normgerechte Erstprüfung nach DIN VDE 0100-600 / DGUV V3 mit dem Installationstester sowie vollständiger System- und Failsafe-Test mit der GrowMaster-App.

### Warum bauen wir dieses Bauteil? (Einfach erklärt)

Wie im echten Berufsleben eines Elektronikers für Betriebstechnik wurden die Baugruppen arbeitsteilig gefertigt. Jetzt werden alle Module im Schaltschrank zusammengeführt, nach den fünf Sicherheitsregeln und DIN VDE 0100-600 messtechnisch abgenommen und mit der echten Cloud-/App-Steuerung in Betrieb genommen.

### benötigte Bauteile (Stückliste für deinen Arbeitsplatz)

| Menge  |   BMK    | Bauteil / genaue Bezeichnung                                                                               |
| :----: | :------: | :--------------------------------------------------------------------------------------------------------- |
| 1 Stk. |  `-U0`   | Hauptschaltschrank IP65 mit Hutschienen, Kabelkanälen und Kabelverschraubungen M16/M20                     |
|  Alle  | `M1..11` | Die 11 fertig aufgebauten und einzelgeprüften Azubi-Module (Projektarbeiten 1 bis 11)                      |
| 1 Stk. | `Messg.` | VDE-Installationstester / Gerätetester (z. B. Benning IT 115 / Fluke 1664 FC / Gossen Metrawatt Profitest) |
| 1 Stk. |  `App`   | Smartphone oder Tablet mit installierter GrowMaster AI App (Smart Grow Add-on aktiv)                       |

### Schaltplan & Klemmenanschluss

```
  [Ablauf der 5-stufigen Endabnahme nach DIN VDE 0100-600 & DGUV Vorschrift 3]

   [1. Sichtprüfung] ──► [2. Schutzleiter R_PE < 0,3 Ω] ──► [3. Isolation R_iso > 2 MΩ]
                                                                        │
   [5. Live- & Failsafe-Test in GrowMaster App] ◄── [4. RCD-Auslösetest I_Δn = 30mA (< 300ms)]
```

### Schritt-für-Schritt-Bauanleitung

1. **Mechanischer Einbau & Verkabelung im Schaltschrank:** Setze alle Hutschienenmodule (Projekt 1 bis 5) in den Schaltschrank ein, verlege die Leitungen sauber getrennt im Verdrahtungskanal (230 V AC links/unten, SELV-Kleinspannung 12 V/5 V/3,3 V rechts/oben) und stecke die Außenmodule (Projekt 6 bis 11) an die Buchsen `X3` bis `X6`.
2. **VDE-Pflichtprüfung 1 – Schutzleiterwiderstand ($R_{\text{PE}}$):** Miss mit dem VDE-Prüfgerät (Prüfstrom $\ge 200\,\text{mA}$) vom Schutzkontakt des 230 V-Zuleitungssteckers (`X1:PE`) zu allen 6 Schuko-Steckdosen (`X2:1..6`) sowie zur Hutschiene. **Grenzwert: $R_{\text{PE}} < 0{,}3\,\Omega$.**
3. **VDE-Pflichtprüfung 2 – Isolationswiderstand ($R_{\text{iso}}$ mit $500\,\text{V DC}$):** Miss zwischen `L1+N` (230 V-Seite) und `PE` (Grenzwert $\ge 1{,}0\,\text{M}\Omega$) sowie zwischen `L1+N` (230 V-Seite) und `GND` der SELV-Kleinspannungsseite (**Nachweis der sicheren Trennung, Grenzwert $\ge 2{,}0\,\text{M}\Omega$!**).
4. **VDE-Pflichtprüfung 3 – RCD-Auslöseprüfung (`-F1`, $30\,\text{mA}$):** Erst nach bestandener Isolationsprüfung darf der Dozent die 230 V-Versorgung zuschalten. Prüftaste am RCD drücken (mechanischer Test) und anschließend mit dem Installationstester Auslösezeit ($t_A < 300\,\text{ms}$) und Auslösestrom ($15 \dots 30\,\text{mA}$) messen.
5. **End-to-End-Systemtest mit der GrowMaster-App:** Verbinde den ESP32 mit der App, prüfe alle Live-Messwerte (`airTemp`, `airRh`, `co2`, `leafTemp`, `waterTemp`, `waterPh`, `waterEc`, `waterLevel`, `soilMoisture`, `leak`), schalte jeden Aktor im Modus „Vorschläge“ testweise an und führe abschließend den **Notfall-Test** durch (Leck-Sensor befeuchten → Pumpen stoppen; WLAN ausschalten → Failsafe nach 300 s).

### Typische Azubi-Fehler – darauf musst du unbedingt achten!

- ⚠️ **Isolationsmessung mit 500 V DC direkt an den GPIO-Pins des ESP32 durchführen:** Bei der 500 V-Isolationsmessung wird ausschließlich **zwischen dem 230 V-Kreis (`L/N`) und `PE` bzw. zwischen dem 230 V-Kreis (`L/N`) und dem gesamten `GND`-Block der Kleinspannung** gemessen – niemals 500 V zwischen zwei Pins des ESP32 anlegen!

### Prüf- & Abnahmecheckliste (vor Übergabe an den Dozenten)

- [ ] Alle VDE-Messwerte ($R_{\text{PE}}$, $R_{\text{iso}}$, $t_A$, $I_{\Delta}$) im Abnahmeprotokoll eingetragen und vom Ausbilder/Dozenten gegengezeichnet?
- [ ] Empfängt die GrowMaster-App alle 30 Sekunden grüne Status-Reports (`200 OK`) und alle 30 Minuten ein Kamerabild?

**Unterschrift Auszubildende/r:** **\*\*\*\***\_\_\_**\*\*\*\*** &nbsp;&nbsp; **Abnahme Dozent/Ausbilder:** **\*\*\*\***\_\_\_**\*\*\*\***

---
