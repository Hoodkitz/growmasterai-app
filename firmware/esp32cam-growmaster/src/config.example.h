// GrowMaster Smart Grow – ESP32-CAM Konfiguration
// Nach src/config.h kopieren, ausfüllen und NIE committen.
#pragma once

#define WIFI_SSID      "MeinGrowWLAN"
#define WIFI_PASSWORD  "GeheimesPasswort123"

// Snapshot-Endpunkt deines Servers
#define SNAPSHOT_URL   "https://growmaster.example.com/api/device/v1/snapshot"
// Geräte-Token aus der App ("Gerät verbinden" -> eigene Hardware, ohne Sensoren/Aktoren)
#define DEVICE_TOKEN   "gmd_hier_dein_geraete_token_eintragen"

// Alle wie viele Minuten ein Foto (Server prüft höchstens alle 2 h per KI, speichert aber alle)
#define SNAPSHOT_INTERVAL_MINUTES 30

// Nur bei Licht an fotografieren (Farben!). Zeitzone Europe/Berlin.
#define LIGHT_ON_HOUR  6
#define LIGHT_HOURS    18
#define TZ_INFO        "CET-1CEST,M3.5.0,M10.5.0/3"
#define NTP_SERVER     "pool.ntp.org"

// Bild: SXGA 1280x1024, JPEG-Qualität 10 (beste) .. 63 (schlechteste)
#define FRAME_SIZE     FRAMESIZE_SXGA
#define JPEG_QUALITY   12
// Blitz-LED (GPIO 4) – im Zelt meist aus lassen
#define USE_FLASH_LED  0

// TLS-Zertifikatsprüfung (Standard: AN) – Root-CA deines Servers eintragen:
//   openssl s_client -connect <server>:443 -showcerts </dev/null   -> letztes Zertifikat der Kette
#define WIFI_TLS_INSECURE 0
#define ROOT_CA_PEM \
  "-----BEGIN CERTIFICATE-----\n" \
  "HIER_DAS_ROOT_ZERTIFIKAT_EINTRAGEN\n" \
  "-----END CERTIFICATE-----\n"
// Nur zum Testen: WIFI_TLS_INSECURE 1 UND ALLOW_INSECURE_TLS 1
#define ALLOW_INSECURE_TLS 0
