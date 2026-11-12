/**
 * GrowMaster Smart-Grow – ESP32 Referenz-Firmware (Geräte-Protokoll v1)
 *
 * Funktionen:
 *  - WLAN-Verbindung mit nicht-blockierendem Reconnect und NTP-Zeitsynchronisation (Europe/Berlin)
 *  - Periodischer HTTPS-POST (Standard: alle 30 s) an /api/device/v1/report mit Bearer-Token
 *  - Modulare Sensorerfassung (per #define aktivierbar):
 *      SHT31/SHT4x (airTemp, airRh), SCD40/41 (co2), MLX90614 (leafTemp),
 *      DS18B20 (waterTemp), analoger pH (waterPh) & EC (waterEc, temperaturkompensiert),
 *      kapazitive Bodenfeuchte (soilMoisture %), Füllstand (waterLevel %), Leck-Sensor (leak 0/1)
 *  - Aktorsteuerung:
 *      LEDC-PWM (0–100 %) für light, exhaust, intake, circulation
 *      Schaltrelais (0/100) für heater, cooler, humidifier, dehumidifier, co2
 *      Nicht-blockierende Zeitsteuerung via millis() für pump (Sekunden) & 6-Kanal-doser (ml)
 *  - Befehlsverarbeitung (set, run, dose) mit Bestätigung über acks[] beim nächsten Report
 *  - Lokale Gerätesicherheit (unabhängig vom Server):
 *      Sofortstopp & Sperre von Pumpe/Dosierer bei Wasserleck (leak == 1),
 *      Begrenzung max. Pumpenlaufzeit (600 s) & max. Einzeldosis (50 ml),
 *      CO2-Notabschaltung bei > 2000 ppm
 *  - Notbetrieb (Failsafe) bei Serverausfall (> failsafe.afterSeconds, Standard 300 s):
 *      Alle Zuführungen aus, definierte Lüftung (exhaust 50 %, intake 40 %),
 *      Lichtsteuerung nach lokalem Zeitplan (LIGHT_ON_HOUR / LIGHT_HOURS)
 *  - Hardware-Watchdog (esp_task_wdt) & komplett nicht-blockierende loop() (kein delay > 100 ms)
 *  - Kompatibel mit Arduino-ESP32 Core 2.x und 3.x
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <time.h>
#include <esp_task_wdt.h>

// Konfiguration laden: config.h bevorzugen, sonst Rückfall auf config.example.h
#if __has_include("config.h")
  #include "config.h"
#else
  #warning "src/config.h nicht gefunden – verwende src/config.example.h! Bitte für den Produktivbetrieb kopieren."
  #include "config.example.h"
#endif

// Optionale Sensor-Bibliotheken je nach Konfiguration einbinden
#if USE_SHT
  #include <SHTSensor.h>
#endif
#if USE_SCD4X
  #include <SensirionI2cScd4x.h>
#endif
#if USE_MLX90614
  #include <Adafruit_MLX90614.h>
#endif
#if USE_DS18B20
  #include <OneWire.h>
  #include <DallasTemperature.h>
#endif

// ============================================================================
// Konstanten für PWM (LEDC)
// ============================================================================
static const uint32_t PWM_FREQ_HZ    = 5000; // 5 kHz für 0-10V-Wandler & EC-Lüfter
static const uint8_t  PWM_RESOLUTION = 10;   // 10 Bit (0..1023)
static const uint32_t PWM_MAX_DUTY   = (1UL << PWM_RESOLUTION) - 1;

// LEDC-Kanäle für Arduino-ESP32 Core 2.x
static const uint8_t LEDC_CH_LIGHT       = 0;
static const uint8_t LEDC_CH_EXHAUST     = 1;
static const uint8_t LEDC_CH_INTAKE      = 2;
static const uint8_t LEDC_CH_CIRCULATION = 3;

// ============================================================================
// Datenstrukturen für Aktoren, Dosierer, Messwerte und Acks
// ============================================================================

struct DoserChannelRuntime {
  const char* name;         // Protokollname aus shared/smartgrow/types.ts
  uint8_t     pin;          // GPIO-Pin
  float       mlPerSecond;  // Kalibrierwert: Milliliter pro Sekunde
  bool        running;      // Aktuell aktiv?
  uint32_t    startMs;      // Startzeitpunkt (millis)
  uint32_t    durationMs;   // Berechnete Laufzeit in ms
};

static DoserChannelRuntime g_dosers[] = {
  { "nutrientA", PIN_DOSER_NUTRIENT_A, DOSER_MLS_NUTRIENT_A, false, 0, 0 },
  { "nutrientB", PIN_DOSER_NUTRIENT_B, DOSER_MLS_NUTRIENT_B, false, 0, 0 },
  { "bloom",     PIN_DOSER_BLOOM,      DOSER_MLS_BLOOM,      false, 0, 0 },
  { "calmag",    PIN_DOSER_CALMAG,     DOSER_MLS_CALMAG,     false, 0, 0 },
  { "phDown",    PIN_DOSER_PH_DOWN,    DOSER_MLS_PH_DOWN,    false, 0, 0 },
  { "phUp",      PIN_DOSER_PH_UP,      DOSER_MLS_PH_UP,      false, 0, 0 },
};
static const size_t NUM_DOSER_CHANNELS = sizeof(g_dosers) / sizeof(g_dosers[0]);

// Aktuelle Stellungen der Aktoren (0..100 %), wie sie in "state" gemeldet werden
struct ActuatorState {
  float light       = 0.0f;
  float exhaust     = 50.0f;
  float intake      = 40.0f;
  float circulation = 50.0f;
  float heater      = 0.0f;
  float cooler      = 0.0f;
  float humidifier  = 0.0f;
  float dehumidifier= 0.0f;
  float co2         = 0.0f;
  float pump        = 0.0f;
  float doser       = 0.0f;
} g_state;

// Nicht-blockierende Laufzeitsteuerung der Bewässerungspumpe
struct PumpTimer {
  bool     running    = false;
  uint32_t startMs    = 0;
  uint32_t durationMs = 0;
} g_pumpTimer;

// Aktuelle Sensormesswerte (NAN = nicht verfügbar / Sensor nicht bereit)
struct SensorReadings {
  float airTemp      = NAN;
  float airRh        = NAN;
  float co2          = NAN;
  float leafTemp     = NAN;
  float waterTemp    = NAN;
  float waterEc      = NAN;
  float waterPh      = NAN;
  float waterLevel   = NAN;
  float soilMoisture = NAN;
  int   leak         = 0;
} g_readings;

// Befehl-Bestätigung (Ack) für den nächsten Report
struct CommandAck {
  int32_t id;
  bool    ok;
  char    result[96];
};

static const size_t MAX_PENDING_ACKS = 25;
static CommandAck   g_acks[MAX_PENDING_ACKS];
static size_t       g_ackCount = 0;

// Zeitsteuerung & Verbindungsstatus
static uint32_t g_pollSeconds        = DEFAULT_POLL_SECONDS;
static uint32_t g_failsafeSeconds    = DEFAULT_FAILSAFE_SECONDS;
static uint32_t g_lastReportAttemptMs= 0;
static uint32_t g_lastServerOkMs     = 0;
static uint32_t g_lastSensorReadMs   = 0;
static uint32_t g_lastWifiRetryMs    = 0;
static bool     g_inFailsafeMode     = false;

// ============================================================================
// Sensor-Instanzen
// ============================================================================
#if USE_SHT
static SHTSensor g_sht;
static bool      g_shtReady = false;
#endif

#if USE_SCD4X
static SensirionI2cScd4x g_scd4x;
static bool              g_scd4xReady = false;
#endif

#if USE_MLX90614
static Adafruit_MLX90614 g_mlx = Adafruit_MLX90614();
static bool              g_mlxReady = false;
#endif

#if USE_DS18B20
static OneWire           g_oneWire(PIN_DS18B20);
static DallasTemperature g_ds18b20(&g_oneWire);
static bool              g_ds18b20Ready = false;
static uint32_t          g_dsLastReqMs  = 0;
#endif

// ============================================================================
// Hilfsfunktionen für Hardware-Ausgänge (PWM & Relais)
// ============================================================================

static void writeRelayPin(uint8_t pin, bool active, bool activeLow) {
  if (activeLow) {
    digitalWrite(pin, active ? LOW : HIGH);
  } else {
    digitalWrite(pin, active ? HIGH : LOW);
  }
}

static void initPwmPin(uint8_t pin, uint8_t channel) {
#if defined(ESP_ARDUINO_VERSION) && (ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0))
  ledcAttach(pin, PWM_FREQ_HZ, PWM_RESOLUTION);
  (void)channel;
#else
  ledcSetup(channel, PWM_FREQ_HZ, PWM_RESOLUTION);
  ledcAttachPin(pin, channel);
#endif
}

static void writePwmPercent(uint8_t pin, uint8_t channel, float percent) {
  float clamped = constrain(percent, 0.0f, 100.0f);
  uint32_t duty = (uint32_t)((clamped / 100.0f) * PWM_MAX_DUTY + 0.5f);
#if defined(ESP_ARDUINO_VERSION) && (ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0))
  ledcWrite(pin, duty);
  (void)channel;
#else
  ledcWrite(channel, duty);
#endif
}

static void setLightPercent(float pct) {
  g_state.light = constrain(pct, 0.0f, 100.0f);
  writePwmPercent(PIN_PWM_LIGHT, LEDC_CH_LIGHT, g_state.light);
}

static void setExhaustPercent(float pct) {
  g_state.exhaust = constrain(pct, 0.0f, 100.0f);
  writePwmPercent(PIN_PWM_EXHAUST, LEDC_CH_EXHAUST, g_state.exhaust);
}

static void setIntakePercent(float pct) {
  g_state.intake = constrain(pct, 0.0f, 100.0f);
  writePwmPercent(PIN_PWM_INTAKE, LEDC_CH_INTAKE, g_state.intake);
}

static void setCirculationPercent(float pct) {
  g_state.circulation = constrain(pct, 0.0f, 100.0f);
  writePwmPercent(PIN_PWM_CIRCULATION, LEDC_CH_CIRCULATION, g_state.circulation);
}

static void setBinaryActuator(const char* name, uint8_t pin, float& stateField, float value) {
  bool turnOn = (value >= 50.0f);
  stateField = turnOn ? 100.0f : 0.0f;
  writeRelayPin(pin, turnOn, RELAY_ACTIVE_LOW != 0);
  Serial.printf("[Aktor] %s -> %s (%.0f%%)\n", name, turnOn ? "EIN" : "AUS", stateField);
}

// ============================================================================
// Pumpe & Dosierpumpen (nicht-blockierend über millis)
// ============================================================================

static void stopPumpImmediately(const char* reason) {
  if (g_pumpTimer.running || g_state.pump > 0.0f) {
    Serial.printf("[Pumpe] Stopp (%s)\n", reason);
  }
  g_pumpTimer.running = false;
  g_pumpTimer.durationMs = 0;
  g_state.pump = 0.0f;
  writeRelayPin(PIN_RELAY_PUMP, false, RELAY_ACTIVE_LOW != 0);
}

static void stopAllDosersImmediately(const char* reason) {
  bool anyActive = false;
  for (size_t i = 0; i < NUM_DOSER_CHANNELS; i++) {
    if (g_dosers[i].running) {
      anyActive = true;
    }
    g_dosers[i].running = false;
    g_dosers[i].durationMs = 0;
    writeRelayPin(g_dosers[i].pin, false, DOSER_ACTIVE_LOW != 0);
  }
  g_state.doser = 0.0f;
  if (anyActive) {
    Serial.printf("[Doser] Alle Kanäle gestoppt (%s)\n", reason);
  }
}

static void updateDoserAggregateState() {
  for (size_t i = 0; i < NUM_DOSER_CHANNELS; i++) {
    if (g_dosers[i].running) {
      g_state.doser = 100.0f;
      return;
    }
  }
  g_state.doser = 0.0f;
}

static void updateTimedActuators() {
  uint32_t now = millis();

  // Bewässerungspumpe prüfen (inkl. Hardware-Sicherheitslimit 600 s)
  if (g_pumpTimer.running) {
    uint32_t elapsed = now - g_pumpTimer.startMs;
    uint32_t maxAllowedMs = (uint32_t)(SAFETY_MAX_PUMP_SECONDS * 1000.0f);
    if (elapsed >= g_pumpTimer.durationMs || elapsed >= maxAllowedMs) {
      stopPumpImmediately("Zeit abgelaufen");
    }
  }

  // Alle 6 Peristaltikpumpen-Kanäle prüfen
  for (size_t i = 0; i < NUM_DOSER_CHANNELS; i++) {
    if (g_dosers[i].running) {
      uint32_t elapsed = now - g_dosers[i].startMs;
      if (elapsed >= g_dosers[i].durationMs) {
        g_dosers[i].running = false;
        writeRelayPin(g_dosers[i].pin, false, DOSER_ACTIVE_LOW != 0);
        Serial.printf("[Doser] Kanal '%s' fertig nach %lu ms\n",
                      g_dosers[i].name, (unsigned long)elapsed);
      }
    }
  }
  updateDoserAggregateState();
}

// ============================================================================
// Ack-Warteschlange
// ============================================================================

static void enqueueAck(int32_t id, bool ok, const char* resultMsg) {
  if (g_ackCount >= MAX_PENDING_ACKS) {
    // Ältesten Eintrag verwerfen, falls Puffer voll
    for (size_t i = 1; i < MAX_PENDING_ACKS; i++) {
      g_acks[i - 1] = g_acks[i];
    }
    g_ackCount = MAX_PENDING_ACKS - 1;
  }
  CommandAck& ack = g_acks[g_ackCount++];
  ack.id = id;
  ack.ok = ok;
  if (resultMsg && resultMsg[0] != '\0') {
    strncpy(ack.result, resultMsg, sizeof(ack.result) - 1);
    ack.result[sizeof(ack.result) - 1] = '\0';
  } else {
    ack.result[0] = '\0';
  }
}

// ============================================================================
// Sensorik: Initialisierung & Auslesen
// ============================================================================

static float readAdcMillivoltsAveraged(uint8_t pin, uint8_t samples = 8) {
  uint32_t sumMv = 0;
  for (uint8_t i = 0; i < samples; i++) {
    sumMv += analogReadMilliVolts(pin);
  }
  return (float)sumMv / (float)samples;
}

static uint16_t readAdcRawAveraged(uint8_t pin, uint8_t samples = 8) {
  uint32_t sumRaw = 0;
  for (uint8_t i = 0; i < samples; i++) {
    sumRaw += analogRead(pin);
  }
  return (uint16_t)(sumRaw / samples);
}

static void initSensors() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

  // ADC-Konfiguration (12 Bit Auflösung, 11 dB Abschwächung für Messbereich bis ~3.1V/3.3V)
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

#if USE_SHT
  if (g_sht.init(Wire)) {
    g_sht.setAccuracy(SHTSensor::SHT_ACCURACY_MEDIUM);
    g_shtReady = true;
    Serial.println("[Sensor] SHT3x/SHT4x initialisiert.");
  } else {
    Serial.println("[Sensor] WARNUNG: SHT3x/SHT4x nicht gefunden!");
  }
#endif

#if USE_SCD4X
  g_scd4x.begin(Wire, 0x62);
  g_scd4x.stopPeriodicMeasurement();
  if (g_scd4x.startPeriodicMeasurement() == 0) {
    g_scd4xReady = true;
    Serial.println("[Sensor] SCD4x CO2-Sensor gestartet.");
  } else {
    Serial.println("[Sensor] WARNUNG: SCD4x konnte nicht gestartet werden!");
  }
#endif

#if USE_MLX90614
  if (g_mlx.begin(0x5A, &Wire)) {
    g_mlxReady = true;
    Serial.println("[Sensor] MLX90614 IR-Blatttemperatursensor initialisiert.");
  } else {
    Serial.println("[Sensor] WARNUNG: MLX90614 nicht gefunden!");
  }
#endif

#if USE_DS18B20
  g_ds18b20.begin();
  if (g_ds18b20.getDeviceCount() > 0) {
    // Nicht-blockierende Messung aktivieren (verhindert 750ms Blockade in loop)
    g_ds18b20.setResolution(12);
    g_ds18b20.setWaitForConversion(false);
    g_ds18b20.requestTemperatures();
    g_dsLastReqMs = millis();
    g_ds18b20Ready = true;
    Serial.println("[Sensor] DS18B20 Wassertemperatursensor initialisiert.");
  } else {
    Serial.println("[Sensor] WARNUNG: Kein DS18B20 gefunden!");
  }
#endif

#if USE_WATER_LEVEL
  #if WATER_LEVEL_ULTRASONIC
    pinMode(PIN_LEVEL_TRIG, OUTPUT);
    digitalWrite(PIN_LEVEL_TRIG, LOW);
    pinMode(PIN_LEVEL_ECHO, INPUT);
  #else
    pinMode(PIN_LEVEL_ECHO, INPUT_PULLUP);
  #endif
#endif

#if USE_LEAK
  pinMode(PIN_LEAK_SENSOR, INPUT_PULLUP);
#endif
}

static void readLeakSensorImmediate() {
#if USE_LEAK
  int raw = digitalRead(PIN_LEAK_SENSOR);
  bool isWet = (LEAK_ACTIVE_LOW != 0) ? (raw == LOW) : (raw == HIGH);
  g_readings.leak = isWet ? 1 : 0;
#else
  g_readings.leak = 0;
#endif
}

static void readAllSensors() {
  // 1. Leck-Sensor immer zuerst prüfen
  readLeakSensorImmediate();

  // 2. Lufttemperatur & Luftfeuchte (SHT31 / SHT4x)
#if USE_SHT
  if (g_shtReady && g_sht.readSample()) {
    float t = g_sht.getTemperature();
    float rh = g_sht.getHumidity();
    if (isfinite(t) && t >= -10.0f && t <= 60.0f) g_readings.airTemp = t;
    if (isfinite(rh) && rh >= 0.0f && rh <= 100.0f) g_readings.airRh = rh;
  }
#endif

  // 3. CO2-Sensor (SCD40 / SCD41)
#if USE_SCD4X
  if (g_scd4xReady) {
    bool dataReady = false;
    if (g_scd4x.getDataReadyStatus(dataReady) == 0 && dataReady) {
      uint16_t co2Ppm = 0;
      float temp = 0.0f, rh = 0.0f;
      if (g_scd4x.readMeasurement(co2Ppm, temp, rh) == 0 && co2Ppm >= 150 && co2Ppm <= 10000) {
        g_readings.co2 = (float)co2Ppm;
      }
    }
  }
#endif

  // 4. Blatttemperatur per Infrarot (MLX90614)
#if USE_MLX90614
  if (g_mlxReady) {
    float objC = g_mlx.readObjectTempC();
    if (isfinite(objC) && objC >= -10.0f && objC <= 60.0f) {
      g_readings.leafTemp = objC;
    }
  }
#endif

  // 5. Wassertemperatur über DS18B20 (asynchron, ohne Blockade)
#if USE_DS18B20
  if (g_ds18b20Ready && (millis() - g_dsLastReqMs >= 800)) {
    float wt = g_ds18b20.getTempCByIndex(0);
    if (wt != DEVICE_DISCONNECTED_C && wt >= 0.0f && wt <= 45.0f) {
      g_readings.waterTemp = wt;
    }
    g_ds18b20.requestTemperatures();
    g_dsLastReqMs = millis();
  }
#endif

  // Aktuelle Wassertemperatur für Temperaturkompensation von pH und EC
  float compTempC = isfinite(g_readings.waterTemp) ? g_readings.waterTemp : EC_DEFAULT_TEMP_C;

  // 6. Analoger pH-Sensor (mit Nernst-Temperaturkorrektur)
#if USE_PH
  {
    float mv = readAdcMillivoltsAveraged(PIN_PH_ADC);
    float slopeAt25 = (7.0f - 4.0f) / (PH_MV_AT_7_0 - PH_MV_AT_4_0);
    // Nernst-Steigung skaliert proportional zur absoluten Temperatur (T / 298.15 K)
    float tempFactor = (compTempC + 273.15f) / 298.15f;
    float ph = 7.0f + (mv - PH_MV_AT_7_0) * slopeAt25 / tempFactor;
    if (isfinite(ph) && ph >= 0.0f && ph <= 14.0f) {
      g_readings.waterPh = ph;
    }
  }
#endif

  // 7. Analoger EC-Sensor (temperaturkompensiert auf 25 °C in mS/cm)
#if USE_EC
  {
    float mv = readAdcMillivoltsAveraged(PIN_EC_ADC);
    // Rohleitwert proportional zur Messspannung & Sondenkonstante K
    float rawEcMs = (mv / 1000.0f) * EC_K_VALUE * 2.0f;
    float tempCompFactor = 1.0f + EC_TEMP_COEFF * (compTempC - 25.0f);
    float ec25 = (tempCompFactor > 0.1f) ? (rawEcMs / tempCompFactor) : rawEcMs;
    if (isfinite(ec25) && ec25 >= 0.0f && ec25 <= 10.0f) {
      g_readings.waterEc = ec25;
    }
  }
#endif

  // 8. Kapazitiver Bodenfeuchtesensor (0..100 % aus Kalibrierwerten trocken/nass)
#if USE_SOIL_MOISTURE
  {
    uint16_t raw = readAdcRawAveraged(PIN_SOIL_ADC);
    float pct = 100.0f * (float)((int32_t)SOIL_ADC_DRY - (int32_t)raw) /
                (float)((int32_t)SOIL_ADC_DRY - (int32_t)SOIL_ADC_WET);
    g_readings.soilMoisture = constrain(pct, 0.0f, 100.0f);
  }
#endif

  // 9. Tankfüllstand (Ultraschall-Abstandsmessung oder Schwimmerschalter)
#if USE_WATER_LEVEL
  #if WATER_LEVEL_ULTRASONIC
  {
    digitalWrite(PIN_LEVEL_TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(PIN_LEVEL_TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(PIN_LEVEL_TRIG, LOW);
    // Timeout 15000 µs (~2.5 m) verhindert längere Blockaden in loop()
    unsigned long durationUs = pulseIn(PIN_LEVEL_ECHO, HIGH, 15000UL);
    if (durationUs > 0) {
      float distCm = (float)durationUs * 0.0343f * 0.5f;
      float pct = 100.0f * (TANK_DIST_EMPTY_CM - distCm) /
                  (TANK_DIST_EMPTY_CM - TANK_DIST_FULL_CM);
      g_readings.waterLevel = constrain(pct, 0.0f, 100.0f);
    }
  }
  #else
  {
    bool floatClosed = (digitalRead(PIN_LEVEL_ECHO) == LOW);
    g_readings.waterLevel = floatClosed ? 100.0f : 0.0f;
  }
  #endif
#endif
}

// ============================================================================
// Lokale Gerätesicherheit (Safety Layer im ESP32)
// ============================================================================

static void enforceLocalSafety() {
  // 1. Leck-Sensor sofort prüfen: Bei Nässe Pumpe & Dosierer unverzüglich abschalten!
  readLeakSensorImmediate();
  if (g_readings.leak == 1) {
    stopPumpImmediately("SICHERHEIT: Wasserleck erkannt!");
    stopAllDosersImmediately("SICHERHEIT: Wasserleck erkannt!");
  }

  // 2. CO2-Obergrenze prüfen: Wenn CO2 > 2000 ppm, Magnetventil sofort schließen!
  if (isfinite(g_readings.co2) && g_readings.co2 > SAFETY_MAX_CO2_PPM) {
    if (g_state.co2 > 0.0f) {
      Serial.printf("[Sicherheit] CO2 zu hoch (%.0f ppm > %.0f ppm) -> CO2-Ventil AUS!\n",
                    g_readings.co2, SAFETY_MAX_CO2_PPM);
      setBinaryActuator("co2", PIN_RELAY_CO2, g_state.co2, 0.0f);
    }
  }
}

// ============================================================================
// Notbetrieb (Failsafe) bei ausbleibender Server-Antwort
// ============================================================================

/**
 * Berechnet anhand der per NTP synchronisierten lokalen Zeit (Europe/Berlin),
 * ob das Licht laut lokalem Zeitplan (LIGHT_ON_HOUR, LIGHT_HOURS) eingeschaltet sein soll.
 */
static float computeLocalScheduleLightLevel() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 5)) {
    // Falls noch keine NTP-Zeit verfügbar ist: aktuelle Lichtstellung beibehalten
    return g_state.light;
  }
  int currentHour = timeinfo.tm_hour;
  int startHour   = LIGHT_ON_HOUR % 24;
  int duration    = constrain(LIGHT_HOURS, 0, 24);

  if (duration == 0) return 0.0f;
  if (duration >= 24) return (float)LIGHT_FAILSAFE_VALUE;

  int endHour = (startHour + duration) % 24;
  bool lightOn = false;
  if (startHour < endHour) {
    lightOn = (currentHour >= startHour && currentHour < endHour);
  } else {
    // Zeitspanne über Mitternacht hinweg (z. B. 20:00 bis 08:00 Uhr)
    lightOn = (currentHour >= startHour || currentHour < endHour);
  }
  return lightOn ? (float)LIGHT_FAILSAFE_VALUE : 0.0f;
}

static void applyFailsafeState() {
  if (!g_inFailsafeMode) {
    Serial.println("[Failsafe] WARNUNG: Keine Server-Antwort innerhalb der Frist -> Notbetrieb aktiviert!");
    g_inFailsafeMode = true;
  }

  // Alle Zuführungen und Risiko-Aktoren sicher ausschalten
  stopPumpImmediately("Failsafe Notbetrieb");
  stopAllDosersImmediately("Failsafe Notbetrieb");
  setBinaryActuator("co2",        PIN_RELAY_CO2,        g_state.co2,        0.0f);
  setBinaryActuator("heater",     PIN_RELAY_HEATER,     g_state.heater,     0.0f);
  setBinaryActuator("humidifier", PIN_RELAY_HUMIDIFIER, g_state.humidifier, 0.0f);

  // Sichere Grundlüftung laut Spezifikation: exhaust = 50 %, intake = 40 %
  setExhaustPercent(50.0f);
  setIntakePercent(40.0f);

  // Licht läuft nach lokalem Zeitplan weiter ("keep-schedule")
  float targetLight = computeLocalScheduleLightLevel();
  setLightPercent(targetLight);
}

// ============================================================================
// Befehlsausführung (commands[] aus Server-Antwort)
// ============================================================================

static void executeCommand(JsonObject cmd) {
  int32_t id           = cmd["id"] | -1;
  const char* actuator = cmd["actuator"] | "";
  const char* kind     = cmd["kind"] | "";

  if (id < 0 || actuator[0] == '\0' || kind[0] == '\0') {
    return;
  }

  // --- 1. Befehltyp "set": Stellwert 0..100 % ---
  if (strcmp(kind, "set") == 0) {
    float value = cmd["value"] | 0.0f;
    value = constrain(value, 0.0f, 100.0f);

    if (strcmp(actuator, "light") == 0) {
      setLightPercent(value);
      enqueueAck(id, true, "ok");
    } else if (strcmp(actuator, "exhaust") == 0) {
      setExhaustPercent(value);
      enqueueAck(id, true, "ok");
    } else if (strcmp(actuator, "intake") == 0) {
      setIntakePercent(value);
      enqueueAck(id, true, "ok");
    } else if (strcmp(actuator, "circulation") == 0) {
      setCirculationPercent(value);
      enqueueAck(id, true, "ok");
    } else if (strcmp(actuator, "heater") == 0) {
      setBinaryActuator("heater", PIN_RELAY_HEATER, g_state.heater, value);
      enqueueAck(id, true, "ok");
    } else if (strcmp(actuator, "cooler") == 0) {
      setBinaryActuator("cooler", PIN_RELAY_COOLER, g_state.cooler, value);
      enqueueAck(id, true, "ok");
    } else if (strcmp(actuator, "humidifier") == 0) {
      setBinaryActuator("humidifier", PIN_RELAY_HUMIDIFIER, g_state.humidifier, value);
      enqueueAck(id, true, "ok");
    } else if (strcmp(actuator, "dehumidifier") == 0) {
      setBinaryActuator("dehumidifier", PIN_RELAY_DEHUMIDIFIER, g_state.dehumidifier, value);
      enqueueAck(id, true, "ok");
    } else if (strcmp(actuator, "co2") == 0) {
      // Lokale Sicherheitsprüfung für CO2
      if (value > 0.0f && isfinite(g_readings.co2) && g_readings.co2 > SAFETY_MAX_CO2_PPM) {
        setBinaryActuator("co2", PIN_RELAY_CO2, g_state.co2, 0.0f);
        enqueueAck(id, false, "Blockiert: CO2 > 2000 ppm");
      } else {
        setBinaryActuator("co2", PIN_RELAY_CO2, g_state.co2, value);
        enqueueAck(id, true, "ok");
      }
    } else {
      enqueueAck(id, false, "Unbekannter Aktor fuer set");
    }
    return;
  }

  // --- 2. Befehltyp "run": Bewässerungspumpe für N Sekunden ---
  if (strcmp(kind, "run") == 0 && strcmp(actuator, "pump") == 0) {
    float seconds = cmd["seconds"] | 0.0f;

    // Bei <= 0 Sekunden Pumpe sofort stoppen
    if (seconds <= 0.0f) {
      stopPumpImmediately("Befehl 0s");
      enqueueAck(id, true, "Pumpe gestoppt");
      return;
    }

    // Sicherheit: Kein Pumpen bei erkanntem Wasserleck!
    if (g_readings.leak == 1) {
      stopPumpImmediately("Leck erkannt");
      enqueueAck(id, false, "Blockiert: Wasserleck aktiv");
      return;
    }

    // Sicherheit: Maximale Laufzeit auf 600 s begrenzen
    bool clamped = false;
    if (seconds > SAFETY_MAX_PUMP_SECONDS) {
      seconds = SAFETY_MAX_PUMP_SECONDS;
      clamped = true;
    }

    g_pumpTimer.startMs    = millis();
    g_pumpTimer.durationMs = (uint32_t)(seconds * 1000.0f);
    g_pumpTimer.running    = true;
    g_state.pump           = 100.0f;
    writeRelayPin(PIN_RELAY_PUMP, true, RELAY_ACTIVE_LOW != 0);

    char msg[64];
    snprintf(msg, sizeof(msg), clamped ? "Laeuft %.0fs (begrenzt auf 600s)" : "Laeuft %.1fs", seconds);
    Serial.printf("[Pumpe] Start für %.1f s\n", seconds);
    enqueueAck(id, true, msg);
    return;
  }

  // --- 3. Befehltyp "dose": Peristaltikpumpe Kanal für M Milliliter ---
  if (strcmp(kind, "dose") == 0 && strcmp(actuator, "doser") == 0) {
    const char* channel = cmd["channel"] | "";
    float ml            = cmd["ml"] | 0.0f;

    if (ml <= 0.0f) {
      enqueueAck(id, false, "Ungueltige Dosis (ml <= 0)");
      return;
    }

    // Sicherheit: Keine Dosierung bei erkanntem Wasserleck!
    if (g_readings.leak == 1) {
      stopAllDosersImmediately("Leck erkannt");
      enqueueAck(id, false, "Blockiert: Wasserleck aktiv");
      return;
    }

    // Sicherheit: Maximale Einzeldosis auf 50 ml begrenzen
    bool clamped = false;
    if (ml > SAFETY_MAX_DOSE_ML) {
      ml = SAFETY_MAX_DOSE_ML;
      clamped = true;
    }

    for (size_t i = 0; i < NUM_DOSER_CHANNELS; i++) {
      if (strcmp(g_dosers[i].name, channel) == 0) {
        if (g_dosers[i].mlPerSecond <= 0.01f) {
          enqueueAck(id, false, "Kalibrierung ml/s ungueltig");
          return;
        }
        float runSeconds          = ml / g_dosers[i].mlPerSecond;
        g_dosers[i].startMs       = millis();
        g_dosers[i].durationMs    = (uint32_t)(runSeconds * 1000.0f);
        g_dosers[i].running       = true;
        writeRelayPin(g_dosers[i].pin, true, DOSER_ACTIVE_LOW != 0);
        updateDoserAggregateState();

        char msg[80];
        snprintf(msg, sizeof(msg),
                 clamped ? "%s: %.1fml (begrenzt auf 50ml, %.1fs)" : "%s: %.1fml (%.1fs)",
                 channel, ml, runSeconds);
        Serial.printf("[Doser] Start '%s': %.1f ml (%.2f s)\n", channel, ml, runSeconds);
        enqueueAck(id, true, msg);
        return;
      }
    }

    enqueueAck(id, false, "Unbekannter Dosierkanal");
    return;
  }

  enqueueAck(id, false, "Unbekannter Befehl");
}

// ============================================================================
// HTTP/JSON Kommunikation mit dem GrowMaster-Server (Protokoll v1)
// ============================================================================

static float roundToDecimals(float val, int decimals) {
  float factor = 1.0f;
  for (int i = 0; i < decimals; i++) factor *= 10.0f;
  return roundf(val * factor) / factor;
}

static void sendReportToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Überspringe Report – WLAN nicht verbunden.");
    return;
  }

  JsonDocument reqDoc;

  // 1. Messwerte ("readings" als Objekt { metric: value })
  JsonObject readings = reqDoc["readings"].to<JsonObject>();
  if (isfinite(g_readings.airTemp))      readings["airTemp"]      = roundToDecimals(g_readings.airTemp, 1);
  if (isfinite(g_readings.airRh))        readings["airRh"]        = roundToDecimals(g_readings.airRh, 0);
  if (isfinite(g_readings.co2))          readings["co2"]          = roundToDecimals(g_readings.co2, 0);
  if (isfinite(g_readings.leafTemp))     readings["leafTemp"]     = roundToDecimals(g_readings.leafTemp, 1);
  if (isfinite(g_readings.waterTemp))    readings["waterTemp"]    = roundToDecimals(g_readings.waterTemp, 1);
  if (isfinite(g_readings.waterEc))      readings["waterEc"]      = roundToDecimals(g_readings.waterEc, 2);
  if (isfinite(g_readings.waterPh))      readings["waterPh"]      = roundToDecimals(g_readings.waterPh, 2);
  if (isfinite(g_readings.waterLevel))   readings["waterLevel"]   = roundToDecimals(g_readings.waterLevel, 0);
  if (isfinite(g_readings.soilMoisture)) readings["soilMoisture"] = roundToDecimals(g_readings.soilMoisture, 0);
#if USE_LEAK
  readings["leak"] = g_readings.leak;
#endif

  // 2. Aktuelle Aktor-Stellungen ("state")
  JsonObject state = reqDoc["state"].to<JsonObject>();
  state["light"]        = roundToDecimals(g_state.light, 0);
  state["exhaust"]      = roundToDecimals(g_state.exhaust, 0);
  state["intake"]       = roundToDecimals(g_state.intake, 0);
  state["circulation"]  = roundToDecimals(g_state.circulation, 0);
  state["heater"]       = roundToDecimals(g_state.heater, 0);
  state["cooler"]       = roundToDecimals(g_state.cooler, 0);
  state["humidifier"]   = roundToDecimals(g_state.humidifier, 0);
  state["dehumidifier"] = roundToDecimals(g_state.dehumidifier, 0);
  state["co2"]          = roundToDecimals(g_state.co2, 0);
  state["pump"]         = roundToDecimals(g_state.pump, 0);
  state["doser"]        = roundToDecimals(g_state.doser, 0);

  // 3. Ausstehende Befehlsbestätigungen ("acks")
  JsonArray acks = reqDoc["acks"].to<JsonArray>();
  for (size_t i = 0; i < g_ackCount; i++) {
    JsonObject a = acks.add<JsonObject>();
    a["id"] = g_acks[i].id;
    a["ok"] = g_acks[i].ok;
    if (g_acks[i].result[0] != '\0') {
      a["result"] = g_acks[i].result;
    }
  }

  // 4. Firmware-Kennung
  reqDoc["firmware"] = FIRMWARE_VERSION;

  String payload;
  serializeJson(reqDoc, payload);

  WiFiClientSecure client;
#if WIFI_TLS_INSECURE
  client.setInsecure();
#endif
  client.setTimeout(5); // Kurzer Socket-Timeout in Sekunden für Watchdog-Sicherheit

  HTTPClient http;
  http.setConnectTimeout(4000);
  http.setTimeout(5000);

  if (!http.begin(client, SERVER_URL)) {
    Serial.println("[HTTP] Initialisierung für SERVER_URL fehlgeschlagen.");
    return;
  }

  String authHeader = String("Bearer ") + DEVICE_TOKEN;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", authHeader);

  int httpCode = http.POST(payload);
  String responseBody = http.getString();
  http.end();

  if (httpCode == 200) {
    JsonDocument resDoc;
    DeserializationError err = deserializeJson(resDoc, responseBody);
    if (!err) {
      // Erfolgreiche Kommunikation vermerken & gesendete Acks leeren
      g_lastServerOkMs = millis();
      g_ackCount       = 0;
      if (g_inFailsafeMode) {
        Serial.println("[Failsafe] Server wieder erreichbar -> Notbetrieb beendet.");
        g_inFailsafeMode = false;
      }

      // Abfrageintervall & Failsafe-Schwelle vom Server übernehmen
      uint32_t srvPoll = resDoc["pollSeconds"] | DEFAULT_POLL_SECONDS;
      g_pollSeconds = constrain(srvPoll, 5U, 300U);

      uint32_t srvFailsafe = resDoc["failsafe"]["afterSeconds"] | DEFAULT_FAILSAFE_SECONDS;
      g_failsafeSeconds = constrain(srvFailsafe, 60U, 3600U);

      // Empfangene Befehle der Reihe nach ausführen
      JsonArray commands = resDoc["commands"].as<JsonArray>();
      if (!commands.isNull()) {
        for (JsonObject cmd : commands) {
          executeCommand(cmd);
        }
      }
      Serial.printf("[HTTP] Report OK (200) – %u Befehl(e), nächster Poll in %u s\n",
                    commands.isNull() ? 0U : (unsigned)commands.size(),
                    (unsigned)g_pollSeconds);
    } else {
      Serial.printf("[HTTP] JSON-Antwort konnte nicht geparst werden: %s\n", err.c_str());
    }
  } else if (httpCode == 429) {
    Serial.println("[HTTP] 429 Rate-Limit erreicht – erhöhe Poll-Intervall auf 30 s.");
    g_pollSeconds = 30;
  } else {
    Serial.printf("[HTTP] Fehler %d bei Report: %s\n", httpCode, responseBody.c_str());
  }
}

// ============================================================================
// WLAN-Verwaltung (nicht-blockierend) & Watchdog
// ============================================================================

static void maintainWiFiConnection() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }
  uint32_t now = millis();
  if (now - g_lastWifiRetryMs >= 10000UL) {
    g_lastWifiRetryMs = now;
    Serial.printf("[WLAN] Verbinde mit '%s'...\n", WIFI_SSID);
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }
}

static void initWatchdog() {
#if defined(ESP_ARDUINO_VERSION) && (ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0))
  esp_task_wdt_config_t wdtConfig = {
    .timeout_ms     = WDT_TIMEOUT_SECONDS * 1000U,
    .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
    .trigger_panic  = true
  };
  esp_task_wdt_reconfigure(&wdtConfig);
  esp_task_wdt_add(NULL);
#else
  esp_task_wdt_init(WDT_TIMEOUT_SECONDS, true);
  esp_task_wdt_add(NULL);
#endif
  Serial.printf("[WDT] Hardware-Watchdog aktiviert (%d s Timeout).\n", WDT_TIMEOUT_SECONDS);
}

// ============================================================================
// Arduino setup() & loop()
// ============================================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n====================================================");
  Serial.println("GrowMaster Smart-Grow ESP32 Referenz-Firmware (" FIRMWARE_VERSION ")");
  Serial.println("====================================================");

  // 1. Alle Relais- und Dosierer-Ausgänge sofort in sicheren AUS-Zustand versetzen
  const uint8_t relayPins[] = {
    PIN_RELAY_HEATER, PIN_RELAY_COOLER, PIN_RELAY_HUMIDIFIER,
    PIN_RELAY_DEHUMIDIFIER, PIN_RELAY_CO2, PIN_RELAY_PUMP
  };
  for (uint8_t pin : relayPins) {
    pinMode(pin, OUTPUT);
    writeRelayPin(pin, false, RELAY_ACTIVE_LOW != 0);
  }

  for (size_t i = 0; i < NUM_DOSER_CHANNELS; i++) {
    pinMode(g_dosers[i].pin, OUTPUT);
    writeRelayPin(g_dosers[i].pin, false, DOSER_ACTIVE_LOW != 0);
  }

  // 2. PWM-Ausgänge initialisieren und Grundstellung setzen
  initPwmPin(PIN_PWM_LIGHT,       LEDC_CH_LIGHT);
  initPwmPin(PIN_PWM_EXHAUST,     LEDC_CH_EXHAUST);
  initPwmPin(PIN_PWM_INTAKE,      LEDC_CH_INTAKE);
  initPwmPin(PIN_PWM_CIRCULATION, LEDC_CH_CIRCULATION);

  setLightPercent(g_state.light);
  setExhaustPercent(g_state.exhaust);
  setIntakePercent(g_state.intake);
  setCirculationPercent(g_state.circulation);

  // 3. Sensoren initialisieren
  initSensors();

  // 4. WLAN im Station-Modus starten und NTP mit Zeitzone Europe/Berlin konfigurieren
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  g_lastWifiRetryMs = millis();

  configTzTime(TZ_INFO, NTP_SERVER_1, NTP_SERVER_2);

  // 5. Zeitstempel initialisieren & Hardware-Watchdog scharfschalten
  uint32_t now = millis();
  g_lastServerOkMs      = now;
  g_lastReportAttemptMs = now - (DEFAULT_POLL_SECONDS * 1000UL); // Ersten Report zeitnah auslösen
  g_lastSensorReadMs    = now;

  initWatchdog();
}

void loop() {
  // 1. Hardware-Watchdog zurücksetzen
  esp_task_wdt_reset();

  // 2. Nicht-blockierende Timer für Bewässerungspumpe & Dosierpumpen aktualisieren
  updateTimedActuators();

  // 3. Lokale Sicherheitsregeln (Leck-Sensor, CO2-Grenzwert) in jedem Zyklus prüfen
  enforceLocalSafety();

  // 4. WLAN-Verbindung im Hintergrund aufrechterhalten
  maintainWiFiConnection();

  uint32_t now = millis();

  // 5. Sensoren alle 2 Sekunden auslesen
  if (now - g_lastSensorReadMs >= 2000UL) {
    g_lastSensorReadMs = now;
    readAllSensors();
    enforceLocalSafety();
  }

  // 6. Periodischen HTTPS-Report an Server senden (Standard: alle 30 Sekunden)
  if (now - g_lastReportAttemptMs >= (g_pollSeconds * 1000UL)) {
    g_lastReportAttemptMs = now;
    sendReportToServer();
  }

  // 7. Prüfen, ob die Failsafe-Frist seit der letzten Server-Antwort überschritten wurde
  if (now - g_lastServerOkMs >= (g_failsafeSeconds * 1000UL)) {
    applyFailsafeState();
  }

  // Kurze Pause (10 ms << 100 ms) für Hintergrund-Tasks (WiFi/TCP-Stack)
  delay(10);
}
