# GrowMaster Smart-Grow Geräte-Protokoll v1 – Spezifikation

Das **GrowMaster Smart-Grow Geräte-Protokoll v1** ist ein zustandsloses, fehlertolerantes HTTP/JSON-Polling-Protokoll zur Anbindung eigener Hardware (z. B. ESP32, Raspberry Pi) sowie lokaler Smart-Home-Brücken an GrowMaster.

Maßgebliche Referenzimplementierung im Server:

- [`server/smartgrow/device-api.ts`](file:///home/administrator/projects/growmasterai-app/server/smartgrow/device-api.ts)
- [`shared/smartgrow/types.ts`](file:///home/administrator/projects/growmasterai-app/shared/smartgrow/types.ts)

---

## 1. Überblick & Kommunikationsablauf

1. Das Gerät sendet periodisch (Standard: alle **`pollSeconds = 30` Sekunden**) einen `POST`-Request mit seinen aktuellen Sensormesswerten (`readings`), den aktuellen Aktor-Stellungen (`state`) und den Bestätigungen zuvor ausgeführter Befehle (`acks`).
2. Der Server prüft das Geräte-Token, speichert plausible Messwerte angeschlossener Sensoren und antwortet mit einer Liste ausstehender Steuerbefehle (`commands`), der aktuellen Serverzeit (`serverTime`), dem gewünschten Abfrageintervall (`pollSeconds`) sowie den Vorgaben für den Notbetrieb (`failsafe`).
3. Das Gerät führt die empfangenen Befehle aus und bestätigt sie beim nächsten regulären Report im Feld `acks`.
4. Bleibt eine erfolgreiche Server-Antwort länger als `failsafe.afterSeconds` (Standard: **300 Sekunden**) aus, wechselt das Gerät eigenständig in den sicheren **Notbetrieb (Failsafe)**.

---

## 2. Endpunkt, Authentifizierung & Rate-Limit

| Eigenschaft                | Wert                                                             |
| :------------------------- | :--------------------------------------------------------------- |
| **Methode & Pfad**         | `POST /api/device/v1/report`                                     |
| **Header `Content-Type`**  | `application/json` (maximale Payload-Größe: `64kb`)              |
| **Header `Authorization`** | `Bearer gmd_<token>`                                             |
| **Token-Format (Regex)**   | `^Bearer (gmd_[A-Za-z0-9_-]{20,80})$`                            |
| **Rate-Limit**             | **Maximal 30 Anfragen pro Minute (60 s)** pro Gerät (`dev:<id>`) |

> [!NOTE]
> Das Geräte-Token (`gmd_...`) wird beim Anlegen eines HTTP-Geräts in der GrowMaster-App generiert, dem Nutzer nur einmalig angezeigt und auf dem Server ausschließlich als SHA-256-Hash gespeichert.

---

## 3. Request-Format (`POST /api/device/v1/report`)

Alle Felder auf oberster Ebene sind optional, sodass ein Gerät auch reine Heartbeats oder reine Befehlsbestätigungen senden kann.

```json
{
  "readings": {
    "airTemp": 24.8,
    "airRh": 61,
    "co2": 640,
    "leafTemp": 23.5,
    "waterTemp": 20.2,
    "waterEc": 1.62,
    "waterPh": 5.84,
    "waterLevel": 75,
    "soilMoisture": 52,
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
  "acks": [
    { "id": 42, "ok": true, "result": "ok" },
    { "id": 43, "ok": true, "result": "nutrientA: 5.0ml (4.2s)" }
  ],
  "firmware": "gm-esp32 0.1"
}
```

### Beschreibung der Request-Felder

| Feld       | Typ                                                               | Beschreibung                                                                                                                                                                              |
| :--------- | :---------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `readings` | `Record<Metric, number>` **oder** `Array<{ metric, value, ts? }>` | Aktuelle Sensormesswerte. Unterstützt entweder ein kompaktes Schlüssel-Wert-Objekt oder ein Array von bis zu 100 Messwert-Objekten mit optionalem Unix-Zeitstempel `ts` in Millisekunden. |
| `state`    | `Record<Actuator, number>`                                        | Aktuelle Stellung jedes Aktors (`0` bis `100`). Werte außerhalb von `0..100` werden serverseitig auf `[0, 100]` begrenzt.                                                                 |
| `acks`     | `Array<{ id: number, ok: boolean, result?: string }>`             | Bestätigungen für zuvor vom Server empfangene Befehle (max. 50 Einträge pro Request, `result` max. 200 Zeichen).                                                                          |
| `firmware` | `string`                                                          | Versionskennung der Geräte-Firmware (max. 40 Zeichen, z. B. `"gm-esp32 0.1"`).                                                                                                            |

#### Alternative Array-Darstellung für `readings` (mit Zeitstempel)

Falls ein Gerät mehrere Messpunkte puffert, kann `readings` als Array übergeben werden. Liegt `ts` mehr als ±10 Minuten von der aktuellen Serverzeit entfernt (oder fehlt `ts`), verwendet der Server automatisch seine eigene Empfangszeit (`now`):

```json
{
  "readings": [
    { "metric": "airTemp", "value": 24.8, "ts": 1731400000000 },
    { "metric": "airRh", "value": 61, "ts": 1731400000000 }
  ]
}
```

---

## 4. Unterstützte Sensormetriken (`METRICS`)

Der Server akzeptiert nur Metriken, die:

1. in `METRICS` (`shared/smartgrow/types.ts`) definiert sind,
2. in den Fähigkeiten (`caps.sensors`) des jeweiligen Geräts angemeldet sind und
3. innerhalb des physikalisch plausiblen Messbereichs `[min, max]` liegen. Alle anderen Werte werden ignoriert und im Antwortfeld `ignored` gezählt.

| Metric-Name    | Bezeichnung        |      Einheit      |  Min  |   Max   | Dezimalstellen | Beschreibung                                                           |
| :------------- | :----------------- | :---------------: | :---: | :-----: | :------------: | :--------------------------------------------------------------------- |
| `airTemp`      | Lufttemperatur     |       `°C`        | `-10` |  `60`   |      `1`       | Lufttemperatur auf Höhe des Blätterdachs                               |
| `airRh`        | Luftfeuchte        |        `%`        |  `0`  |  `100`  |      `0`       | Relative Luftfeuchtigkeit im Zelt                                      |
| `co2`          | CO₂                |       `ppm`       | `150` | `10000` |      `0`       | CO₂-Konzentration der Zeltluft                                         |
| `leafTemp`     | Blatttemperatur    |       `°C`        | `-10` |  `60`   |      `1`       | Infrarot-Blattoberflächentemperatur (für präzise Blatt-VPD-Berechnung) |
| `waterTemp`    | Wassertemperatur   |       `°C`        |  `0`  |  `45`   |      `1`       | Temperatur der Nährlösung im Tank                                      |
| `waterEc`      | EC Wasser          |      `mS/cm`      |  `0`  |  `10`   |      `2`       | Elektrische Leitfähigkeit im Tank (kompensiert auf 25 °C)              |
| `waterPh`      | pH Wasser          | _(dimensionslos)_ |  `0`  |  `14`   |      `2`       | pH-Wert der Nährlösung im Tank                                         |
| `waterLevel`   | Tankfüllstand      |        `%`        |  `0`  |  `100`  |      `0`       | Füllstand des Nährstofftanks                                           |
| `soilMoisture` | Substratfeuchte    |        `%`        |  `0`  |  `100`  |      `0`       | Volumetrische/kapazitive Feuchte im Substrat                           |
| `soilEc`       | EC Substrat        |      `mS/cm`      |  `0`  |  `10`   |      `2`       | Leitfähigkeit direkt im Wurzelbereich/Substrat                         |
| `soilPh`       | pH Substrat        | _(dimensionslos)_ |  `0`  |  `14`   |      `2`       | pH-Wert im Substrat                                                    |
| `soilTemp`     | Substrattemperatur |       `°C`        | `-10` |  `50`   |      `1`       | Temperatur im Wurzelraum                                               |
| `ppfd`         | Lichtstärke (PPFD) |    `µmol/m²/s`    |  `0`  | `3000`  |      `0`       | Photosynthetisch aktive Photonenflussdichte                            |
| `leak`         | Leck-Sensor        |     _(0 / 1)_     |  `0`  |   `1`   |      `0`       | `0` = trocken, `1` = Wasser am Boden erkannt                           |

---

## 5. Unterstützte Aktoren (`ACTUATORS`) & Dosierkanäle (`DOSER_CHANNELS`)

### Aktoren

| Actuator-Name  | Bezeichnung    | Wertebereich in `state` | Befehlsart (`kind`) | Beschreibung                                                        |
| :------------- | :------------- | :---------------------: | :-----------------: | :------------------------------------------------------------------ |
| `light`        | Licht          |       `0–100` (%)       |       `"set"`       | Hauptbeleuchtung (dimmbar `0..100` oder schaltbar `0` / `100`)      |
| `exhaust`      | Abluft         |       `0–100` (%)       |       `"set"`       | Abluftventilator / EC-Lüfter                                        |
| `intake`       | Zuluft         |       `0–100` (%)       |       `"set"`       | Aktiver Zuluftventilator                                            |
| `circulation`  | Umluft         |       `0–100` (%)       |       `"set"`       | Umluftventilator im Zelt                                            |
| `heater`       | Heizung        |     `0` oder `100`      |       `"set"`       | Zuheizung (`0` = aus, `100` = ein)                                  |
| `cooler`       | Kühlung        |     `0` oder `100`      |       `"set"`       | Klimagerät (`0` = aus, `100` = ein)                                 |
| `humidifier`   | Luftbefeuchter |     `0` oder `100`      |       `"set"`       | Luftbefeuchter (`0` = aus, `100` = ein)                             |
| `dehumidifier` | Entfeuchter    |     `0` oder `100`      |       `"set"`       | Luftentfeuchter (`0` = aus, `100` = ein)                            |
| `co2`          | CO₂-Ventil     |     `0` oder `100`      |       `"set"`       | CO₂-Magnetventil (`0` = geschlossen, `100` = geöffnet)              |
| `pump`         | Bewässerung    |     `0` oder `100`      |       `"run"`       | Bewässerungspumpe (läuft für `seconds` Sekunden)                    |
| `doser`        | Dosierpumpen   |     `0` oder `100`      |      `"dose"`       | Mehrkanal-Peristaltikpumpen (fördert `ml` Milliliter auf `channel`) |

### Dosierkanäle (`DOSER_CHANNELS`)

| Kanal-Name (`channel`) | Bezeichnung | Typischer Einsatz            |
| :--------------------- | :---------- | :--------------------------- |
| `nutrientA`            | Dünger A    | Basisdünger Komponente A     |
| `nutrientB`            | Dünger B    | Basisdünger Komponente B     |
| `bloom`                | Blütedünger | Blüte-/PK-Zusatz             |
| `calmag`               | Cal-Mag     | Calcium-/Magnesium-Ergänzung |
| `phDown`               | pH minus    | Säure zur pH-Senkung         |
| `phUp`                 | pH plus     | Lauge zur pH-Anhebung        |

---

## 6. Response-Format & Befehlsarten (`commands`)

Bei einer gültigen Meldung antwortet der Server mit HTTP `200 OK`:

```json
{
  "ok": true,
  "serverTime": 1731400030000,
  "pollSeconds": 30,
  "accepted": 10,
  "ignored": 0,
  "commands": [
    {
      "id": 101,
      "actuator": "exhaust",
      "kind": "set",
      "value": 65
    },
    {
      "id": 102,
      "actuator": "pump",
      "kind": "run",
      "seconds": 45
    },
    {
      "id": 103,
      "actuator": "doser",
      "kind": "dose",
      "channel": "phDown",
      "ml": 2.5
    }
  ],
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

### Die 3 Befehlsarten im Detail

1. **Stellwert setzen (`kind: "set"`)** – für alle Aktoren außer `pump` und `doser`:

   ```json
   { "id": 101, "actuator": "exhaust", "kind": "set", "value": 65 }
   ```

   - `value`: Zielwert in Prozent (`0` bis `100`; bei Schaltrelais `0` = aus, `100` = ein).

2. **Bewässerungspumpe zeitgesteuert starten (`kind: "run"`)** – für `actuator: "pump"`:

   ```json
   { "id": 102, "actuator": "pump", "kind": "run", "seconds": 45 }
   ```

   - `seconds`: Laufzeit in Sekunden. `seconds: 0` stoppt eine laufende Pumpe sofort.

3. **Nährlösung / pH dosieren (`kind: "dose"`)** – für `actuator: "doser"`:
   ```json
   {
     "id": 103,
     "actuator": "doser",
     "kind": "dose",
     "channel": "phDown",
     "ml": 2.5
   }
   ```

   - `channel`: Einer der 6 Kanäle aus `DOSER_CHANNELS`.
   - `ml`: Zu fördernde Menge in Millilitern. Das Gerät rechnet diese anhand seiner lokalen Kalibrierung (`ml/s`) in eine Pumpenlaufzeit um.

### Bestätigung (`acks`)

Pro Report liefert der Server bis zu 20 offene Befehle (`status = "pending"`) aus und markiert sie als `"sent"`.
Das Gerät führt jeden Befehl aus und sendet im nächsten Report unter `acks` für jede `id` eine Rückmeldung:

- `{ "id": 101, "ok": true, "result": "ok" }` → Befehl wird serverseitig auf `"done"` gesetzt.
- `{ "id": 102, "ok": false, "result": "Blockiert: Wasserleck aktiv" }` → Befehl wird serverseitig auf `"failed"` gesetzt und der Grund im Protokoll hinterlegt.

---

## 7. HTTP-Status- und Fehlercodes

|           Statuscode            | Ursache                                                            | Beispiel-Antwort                                                                                | Verhalten des Geräts                                                         |
| :-----------------------------: | :----------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
|          **`200 OK`**           | Report erfolgreich verarbeitet                                     | `{"ok":true,"serverTime":...,"pollSeconds":30,...}`                                             | `commands` ausführen, `acks`-Puffer leeren, Failsafe-Timer zurücksetzen      |
|      **`400 Bad Request`**      | Ungültiges JSON oder Schema-Verletzung (Zod)                       | `{"error":"Ungültige Meldung","issues":["readings.airTemp: Expected number, received string"]}` | Payload-Format prüfen                                                        |
|     **`401 Unauthorized`**      | Header `Authorization` fehlt, falsches Format oder Token unbekannt | `{"error":"Geräte-Token fehlt"}` bzw. `{"error":"Unbekanntes Gerät"}`                           | `DEVICE_TOKEN` in der Konfiguration prüfen                                   |
|   **`429 Too Many Requests`**   | Rate-Limit überschritten (> 30 Anfragen / Minute)                  | `{"error":"Zu viele Meldungen","pollSeconds":30}`                                               | Abfrageintervall sofort auf mindestens `pollSeconds` (30 s) erhöhen          |
| **`500 Internal Server Error`** | Unerwarteter Serverfehler                                          | `{"error":"Interner Fehler","pollSeconds":30}`                                                  | Beim nächsten Intervall erneut versuchen; Failsafe-Timer weiterlaufen lassen |
|  **`503 Service Unavailable`**  | Datenbank vorübergehend nicht erreichbar                           | `{"error":"Datenbank nicht verfügbar"}`                                                         | Beim nächsten Intervall erneut versuchen; Failsafe-Timer weiterlaufen lassen |

---

## 8. Lokale Gerätesicherheit & Notbetrieb (Failsafe)

Damit Pflanzen und Umgebung auch bei WLAN-Ausfall, Serverwartung oder abgestürztem Router geschützt bleiben, schreibt das Protokoll v1 zwei Schutzschichten auf dem Gerät selbst vor:

### 8.1 Unabhängige Sicherheitsregeln auf dem Gerät

- **Wasserschutz (`leak == 1`):** Sobald der Leck-Sensor Wasser meldet, müssen Bewässerungspumpe (`pump`) und alle Dosierpumpen (`doser`) **sofort** hardwareseitig abgeschaltet werden. Neue `run`- oder `dose`-Befehle müssen mit `ok: false` abgelehnt werden.
- **Begrenzung der Pumpenlaufzeit:** Eine einzelne Bewässerung (`pump`) darf lokal maximal **600 Sekunden** (10 Minuten) am Stück laufen.
- **Begrenzung der Einzeldosis:** Ein einzelner Dosierbefehl (`doser`) darf lokal maximal **50 ml** fördern.
- **CO₂-Notabschaltung:** Überschreitet der gemessene CO₂-Wert **2000 ppm**, muss das CO₂-Magnetventil sofort geschlossen werden.

### 8.2 Notbetrieb (`failsafe`) bei Verbindungsverlust

Erhält das Gerät länger als `failsafe.afterSeconds` (Standard: **300 Sekunden**) keine gültige `200 OK`-Antwort vom Server, nimmt es folgende sichere Stellungen ein:

| Aktor        | Stellung im Notbetrieb | Begründung                                                                                                                                                                         |
| :----------- | :--------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pump`       |     **`0`** (Aus)      | Keine unkontrollierte Bewässerung ohne Server-Rückkopplung                                                                                                                         |
| `doser`      |     **`0`** (Aus)      | Keine Dünger-/Säurezufuhr im Blindflug                                                                                                                                             |
| `co2`        |     **`0`** (Aus)      | Keine CO₂-Zufuhr ohne Überwachung                                                                                                                                                  |
| `heater`     |     **`0`** (Aus)      | Überhitzungsschutz                                                                                                                                                                 |
| `humidifier` |     **`0`** (Aus)      | Schutz vor Schimmel / Kondenswasser                                                                                                                                                |
| `exhaust`    |    **`50`** (50 %)     | Sichere Dauer-Abluft zum Abtransport von Wärme und Feuchte                                                                                                                         |
| `intake`     |    **`40`** (40 %)     | Frischluftzufuhr mit leichtem Unterdruck im Zelt                                                                                                                                   |
| `light`      | **`"keep-schedule"`**  | Licht läuft nach lokalem NTP-Zeitplan weiter (z. B. `LIGHT_ON_HOUR` + `LIGHT_HOURS` in Zeitzone `Europe/Berlin`), damit der Photoperioden-Rhythmus der Pflanzen nicht gestört wird |

---

## 9. Vollständige `curl`-Beispiele

### Beispiel 1: Regulärer Status-Report mit Messwerten

```bash
curl -i -X POST "https://growmaster.example.com/api/device/v1/report" \
  -H "Authorization: Bearer gmd_0123456789abcdef0123456789abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "readings": {
      "airTemp": 25.2,
      "airRh": 58,
      "co2": 580,
      "leafTemp": 23.9,
      "waterTemp": 20.5,
      "waterEc": 1.80,
      "waterPh": 5.92,
      "waterLevel": 82,
      "soilMoisture": 61,
      "leak": 0
    },
    "state": {
      "light": 100,
      "exhaust": 60,
      "intake": 45,
      "circulation": 70,
      "heater": 0,
      "cooler": 0,
      "humidifier": 0,
      "dehumidifier": 0,
      "co2": 0,
      "pump": 0,
      "doser": 0
    },
    "firmware": "gm-esp32 0.1"
  }'
```

### Beispiel 2: Bestätigung ausgeführter Befehle (`acks`) beim darauffolgenden Poll

```bash
curl -i -X POST "https://growmaster.example.com/api/device/v1/report" \
  -H "Authorization: Bearer gmd_0123456789abcdef0123456789abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "readings": {
      "airTemp": 24.9,
      "airRh": 56
    },
    "state": {
      "light": 100,
      "exhaust": 65,
      "intake": 45
    },
    "acks": [
      { "id": 101, "ok": true, "result": "ok" },
      { "id": 102, "ok": true, "result": "Laeuft 45.0s" },
      { "id": 103, "ok": true, "result": "phDown: 2.5ml (2.9s)" }
    ],
    "firmware": "gm-esp32 0.1"
  }'
```

---

## 10. Kamerabild für die KI-Blattkontrolle (`POST /api/device/v1/snapshot`)

Eine Zelt-Kamera (z. B. ESP32-CAM) schickt ein JPEG-Bild mit demselben Geräte-Token:

```bash
curl -X POST https://<server>/api/device/v1/snapshot \
  -H "Authorization: Bearer gmd_…" \
  -H "Content-Type: image/jpeg" \
  --data-binary @zelt.jpg
```

| Regel        | Wert                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| Format       | nur JPEG (wird an den Magic-Bytes erkannt)                              |
| Größe        | max. 1,5 MB (empfohlen: 1280 px Breite, Qualität ~75)                   |
| Rate-Limit   | 12 Bilder pro Stunde und Gerät                                          |
| KI-Prüfung   | höchstens alle 2 Stunden ein Gerätebild (Handy-Fotos aus der App immer) |
| Aufbewahrung | die letzten 12 Bilder je Zelt                                           |

Antwort: `{"ok": true, "id": 17, "analyzed": true}`. Fehler: `415` (kein JPEG), `413` (zu groß), `429` (zu viele Bilder), `401` (Token).
Ernste Befunde (z. B. Schimmel) erscheinen als Alarm im Protokoll und kommen als Push aufs Handy.

## 11. Home Assistant statt eigener Hardware

Fertige Geräte, die in Home Assistant eingebunden sind (Shelly, Tuya, AC Infinity, Sonoff, Zigbee-Sensoren …), verbindest du in der App unter „Gerät verbinden → Home Assistant“: öffentliche **https**-Adresse (z. B. Nabu Casa) + langlebiger Zugriffstoken, dann Sensoren und Schalter zuordnen. Der Server liest jede Minute die Zustände und schaltet über die HA-Dienste. Dosierpumpen werden über Home Assistant nicht unterstützt (zu ungenau) – dafür eigene Hardware nach diesem Protokoll verwenden.
