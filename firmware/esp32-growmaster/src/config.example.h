#pragma once
/**
 * GrowMaster Smart-Grow ESP32 Referenz-Firmware – Beispielkonfiguration
 *
 * WICHTIGER HINWEIS:
 * Kopiere diese Datei nach `src/config.h` und trage deine echten Zugangsdaten ein.
 * Committe `src/config.h` NIEMALS in Git (sie enthält dein WLAN-Passwort und Geräte-Token)!
 */

// ============================================================================
// 1. WLAN & Server-Verbindung
// ============================================================================
#define WIFI_SSID        "MeinGrowWLAN"
#define WIFI_PASSWORD    "GeheimesPasswort123"

// Vollständige HTTPS-URL zum GrowMaster-Endpunkt (Protokoll v1)
#define SERVER_URL       "https://growmaster.example.com/api/device/v1/report"

// Geräte-Token aus der GrowMaster-App (beginnt mit "gmd_", nur einmal bei Erstellung sichtbar)
#define DEVICE_TOKEN     "gmd_hier_dein_geraete_token_aus_der_app_eintragen"

// TLS-Zertifikatsprüfung:
// Für produktive Umgebungen eigenes Root-CA-Zertifikat hinterlegen und WIFI_TLS_INSECURE auf 0 setzen.
// Für lokale Tests / selbstsignierte Zertifikate kann WIFI_TLS_INSECURE = 1 genutzt werden.
#define WIFI_TLS_INSECURE 1

// Firmware-Kennung, die bei jedem Report mitgesendet wird
#define FIRMWARE_VERSION "gm-esp32 0.1"

// Standard-Abfrageintervall (wird vom Server über "pollSeconds" dynamisch überschrieben)
#define DEFAULT_POLL_SECONDS     30
// Standard-Failsafe-Zeit (wird vom Server über "failsafe.afterSeconds" dynamisch überschrieben)
#define DEFAULT_FAILSAFE_SECONDS 300

// ============================================================================
// 2. Zeitzone & Lokaler Licht-Zeitplan (für den Notbetrieb ohne Server)
// ============================================================================
#define NTP_SERVER_1     "pool.ntp.org"
#define NTP_SERVER_2     "time.nist.gov"
// POSIX-Zeitzonen-String für Europe/Berlin (MEZ/MESZ inkl. automatischer Sommerzeitumstellung)
#define TZ_INFO          "CET-1CEST,M3.5.0,M10.5.0/3"

// Lokaler Licht-Zeitplan für den Notbetrieb (Failsafe "keep-schedule")
#define LIGHT_ON_HOUR        6    // Stunde (0-23), zu der das Licht eingeschaltet wird (z. B. 06:00 Uhr)
#define LIGHT_HOURS          18   // Beleuchtungsdauer in Stunden pro Tag (z. B. 18h Veg / 12h Blüte)
#define LIGHT_FAILSAFE_VALUE 80   // Dimmstufe in % (0-100), wenn das Licht im Notbetrieb eingeschaltet ist

// ============================================================================
// 3. Aktivierbare Sensoren (1 = aktiv, 0 = deaktiviert)
// ============================================================================
#define USE_SHT            1  // Sensirion SHT31 / SHT4x für Lufttemperatur (airTemp) & Luftfeuchte (airRh)
#define USE_SCD4X          1  // Sensirion SCD40 / SCD41 für CO2 in ppm (co2)
#define USE_MLX90614       1  // Melexis MLX90614 Infrarot-Thermometer für Blatttemperatur (leafTemp)
#define USE_DS18B20        1  // Maxim DS18B20 OneWire-Sensor für Wassertemperatur (waterTemp)
#define USE_PH             1  // Analoger pH-Sensor im Nährstofftank (waterPh)
#define USE_EC             1  // Analoger EC-Sensor im Nährstofftank (waterEc, temperaturkompensiert)
#define USE_SOIL_MOISTURE  1  // Kapazitiver Bodenfeuchtesensor (soilMoisture in %)
#define USE_WATER_LEVEL    1  // Tankfüllstand per Ultraschall HC-SR04 / JSN-SR04T oder Schwimmer (waterLevel in %)
#define USE_LEAK           1  // Digitaler Leck-Sensor / Wassermelder am Zeltboden (leak: 0 = trocken, 1 = nass)

// Modus für Füllstandssensor: 1 = Ultraschall-Abstandsmessung, 0 = digitaler Schwimmerschalter
#define WATER_LEVEL_ULTRASONIC 1

// ============================================================================
// 4. Pinbelegung (ESP32 GPIO-Nummern)
//    Hinweis: ADC1-Pins (GPIO 32-39) für analoge Sensoren nutzen, da ADC2 bei
//    aktivem WLAN auf dem ESP32 nicht zuverlässig nutzbar ist!
// ============================================================================

// --- I2C-Bus (SHT3x/SHT4x, SCD4x, MLX90614) ---
#define PIN_I2C_SDA        21
#define PIN_I2C_SCL        22

// --- Analoge Sensoren (ADC1: GPIO 32..39) ---
#define PIN_PH_ADC         34   // Analoger Eingang für pH-Messmodul (0-3.3V)
#define PIN_EC_ADC         35   // Analoger Eingang für EC-Messmodul (0-3.3V)
#define PIN_SOIL_ADC       36   // Analoger Eingang (VP) für kapazitiven Bodenfeuchtesensor

// --- Digitale / OneWire-Sensoren ---
#define PIN_DS18B20        4    // OneWire-Datenleitung (4.7 kOhm Pull-up nach 3.3V erforderlich)
#define PIN_LEAK_SENSOR    39   // Eingang (VN) für Leck-Sensor
#define LEAK_ACTIVE_LOW    1    // 1 = LOW bedeutet Wasser erkannt (üblich bei Open-Collector-Modulen), 0 = HIGH bei Wasser

// --- Tankfüllstand (Ultraschall JSN-SR04T / HC-SR04 oder Schwimmer) ---
#define PIN_LEVEL_TRIG     12   // Ultraschall Trigger-Pin (oder ungenutzt bei Schwimmerschalter)
#define PIN_LEVEL_ECHO     32   // Ultraschall Echo-Pin (über Spannungsteiler 5V -> 3.3V!) bzw. Schwimmerschalter-Eingang

// --- PWM-Ausgänge (0-10V Treiber / EC-Lüfter, LEDC PWM) ---
#define PIN_PWM_LIGHT       25  // LED-Treiber Dimmung (0-100 % -> 0-3.3V PWM / 0-10V Konverter)
#define PIN_PWM_EXHAUST     26  // Abluft EC-Lüfter PWM (0-100 %)
#define PIN_PWM_INTAKE      27  // Zuluft EC-Lüfter PWM (0-100 %)
#define PIN_PWM_CIRCULATION 14  // Umluft-Ventilator PWM (0-100 %)

// --- Relais-Ausgänge (Heizung, Kühlung, Befeuchter, Entfeuchter, CO2-Magnetventil, Bewässerungspumpe) ---
// Hinweis: Viele Optokoppler-Relaismodule schalten Active-LOW (RELAY_ACTIVE_LOW = 1)
#define RELAY_ACTIVE_LOW    1
#define PIN_RELAY_HEATER       16
#define PIN_RELAY_COOLER       17
#define PIN_RELAY_HUMIDIFIER   18
#define PIN_RELAY_DEHUMIDIFIER 19
#define PIN_RELAY_CO2          23
#define PIN_RELAY_PUMP         13

// --- Dosierpumpen (6x 12V Peristaltikpumpen über MOSFET-Treiber, Active-HIGH) ---
#define DOSER_ACTIVE_LOW       0
#define PIN_DOSER_NUTRIENT_A   15  // Dünger A (nutrientA)
#define PIN_DOSER_NUTRIENT_B   2   // Dünger B (nutrientB)
#define PIN_DOSER_BLOOM        0   // Blütedünger (bloom)
#define PIN_DOSER_CALMAG       5   // Cal-Mag (calmag)
#define PIN_DOSER_PH_DOWN      33  // pH minus (phDown)
#define PIN_DOSER_PH_UP        20  // pH plus (phUp) – Hinweis: auf ESP32-WROOM ggf. freien GPIO wählen

// ============================================================================
// 5. Kalibrierwerte für Sensoren & Dosierpumpen
// ============================================================================

// --- pH-Sensor (2-Punkt-Kalibrierung über Spannung in mV bei 25 °C) ---
#define PH_MV_AT_7_0       1500.0f  // Gemessene Spannung in mV in Pufferlösung pH 7.00
#define PH_MV_AT_4_0       2032.0f  // Gemessene Spannung in mV in Pufferlösung pH 4.00

// --- EC-Sensor (Temperaturkompensiert auf 25 °C) ---
#define EC_K_VALUE         1.00f    // Zellkonstante / Kalibrierfaktor der EC-Sonde
#define EC_TEMP_COEFF      0.020f   // Temperaturkoeffizient (2.0 % pro °C Abweichung von 25 °C)
#define EC_DEFAULT_TEMP_C  22.0f    // Rückfallwert (°C), falls kein DS18B20 angeschlossen ist

// --- Kapazitiver Bodenfeuchtesensor (12-Bit ADC Rohwerte 0..4095) ---
#define SOIL_ADC_DRY       3100     // ADC-Rohwert an trockener Luft (entspricht 0 %)
#define SOIL_ADC_WET       1350     // ADC-Rohwert in Wasser getaucht (entspricht 100 %)

// --- Tankfüllstand per Ultraschall (Abstand Sensor -> Wasseroberfläche in cm) ---
#define TANK_DIST_EMPTY_CM 45.0f    // Abstand in cm bei leerem Tank (0 %)
#define TANK_DIST_FULL_CM  8.0f     // Abstand in cm bei vollem Tank (100 %)

// --- Förderrate der Peristaltikpumpen in Milliliter pro Sekunde (ml/s) ---
#define DOSER_MLS_NUTRIENT_A 1.20f
#define DOSER_MLS_NUTRIENT_B 1.20f
#define DOSER_MLS_BLOOM      1.20f
#define DOSER_MLS_CALMAG     1.20f
#define DOSER_MLS_PH_DOWN    0.85f
#define DOSER_MLS_PH_UP      0.85f

// ============================================================================
// 6. Lokale Sicherheitsgrenzen im Gerät (Hardware-Schutzschicht)
// ============================================================================
#define SAFETY_MAX_PUMP_SECONDS 600.0f   // Maximale Laufzeit der Bewässerungspumpe am Stück (600 s = 10 Min)
#define SAFETY_MAX_DOSE_ML      50.0f    // Maximale Einzeldosis pro Dosierbefehl (50 ml)
#define SAFETY_MAX_CO2_PPM      2000.0f  // CO2-Magnetventil sofort schließen, wenn CO2 > 2000 ppm
#define WDT_TIMEOUT_SECONDS     30       // Hardware-Watchdog Timeout in Sekunden
