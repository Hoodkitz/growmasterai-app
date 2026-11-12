// GrowMaster Smart Grow – ESP32-CAM Firmware
// Macht während der Lichtphase regelmäßig ein Foto vom Blätterdach und schickt es an
// POST /api/device/v1/snapshot (JPEG, Bearer-Token). Die KI prüft Blätter, Phase, Größe und Farben.
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <esp_camera.h>
#include <esp_task_wdt.h>
#include <time.h>

#if __has_include("config.h")
  #include "config.h"
#else
  #error "src/config.h fehlt: config.example.h nach config.h kopieren und ausfüllen."
#endif
#if WIFI_TLS_INSECURE && !ALLOW_INSECURE_TLS
  #error "WIFI_TLS_INSECURE ist nur mit ALLOW_INSECURE_TLS 1 erlaubt (nur zum Testen!)."
#endif

// AI-Thinker ESP32-CAM Pinbelegung
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22
#define FLASH_LED_PIN 4

static const size_t MAX_IMAGE_BYTES = 1500000;   // Server-Grenze 1,5 MB
static const uint32_t WDT_TIMEOUT_S = 60;         // Upload kann etwas dauern
static const uint32_t MAX_INTERVAL_MIN = 240;     // bei 429 höchstens 4 h warten

static uint32_t g_intervalMin = SNAPSHOT_INTERVAL_MINUTES;
static uint32_t g_lastShotMs = 0;
static bool g_firstShotDone = false;
static int g_quality = JPEG_QUALITY;

static bool initCamera() {
  camera_config_t c = {};
  c.ledc_channel = LEDC_CHANNEL_0;
  c.ledc_timer = LEDC_TIMER_0;
  c.pin_d0 = Y2_GPIO_NUM; c.pin_d1 = Y3_GPIO_NUM; c.pin_d2 = Y4_GPIO_NUM; c.pin_d3 = Y5_GPIO_NUM;
  c.pin_d4 = Y6_GPIO_NUM; c.pin_d5 = Y7_GPIO_NUM; c.pin_d6 = Y8_GPIO_NUM; c.pin_d7 = Y9_GPIO_NUM;
  c.pin_xclk = XCLK_GPIO_NUM; c.pin_pclk = PCLK_GPIO_NUM; c.pin_vsync = VSYNC_GPIO_NUM; c.pin_href = HREF_GPIO_NUM;
  c.pin_sccb_sda = SIOD_GPIO_NUM; c.pin_sccb_scl = SIOC_GPIO_NUM;
  c.pin_pwdn = PWDN_GPIO_NUM; c.pin_reset = RESET_GPIO_NUM;
  c.xclk_freq_hz = 20000000;
  c.pixel_format = PIXFORMAT_JPEG;
  c.grab_mode = CAMERA_GRAB_LATEST;
  if (psramFound()) {
    c.frame_size = FRAME_SIZE;
    c.jpeg_quality = g_quality;
    c.fb_count = 1;
    c.fb_location = CAMERA_FB_IN_PSRAM;
  } else {
    // ohne PSRAM nur kleinere Bilder
    c.frame_size = FRAMESIZE_SVGA;
    c.jpeg_quality = 12;
    c.fb_count = 1;
    c.fb_location = CAMERA_FB_IN_DRAM;
  }
  esp_err_t err = esp_camera_init(&c);
  if (err != ESP_OK) {
    Serial.printf("[Kamera] Init fehlgeschlagen: 0x%x\n", err);
    return false;
  }
  sensor_t* s = esp_camera_sensor_get();
  if (s) {
    s->set_whitebal(s, 1);   // automatischer Weißabgleich (LED-Spektrum!)
    s->set_awb_gain(s, 1);
    s->set_exposure_ctrl(s, 1);
    s->set_gain_ctrl(s, 1);
  }
  return true;
}

static void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.println("[WLAN] Verbinde …");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(100);
    esp_task_wdt_reset();
  }
  if (WiFi.status() == WL_CONNECTED) Serial.printf("[WLAN] Verbunden, IP %s\n", WiFi.localIP().toString().c_str());
}

/** Lichtphase laut lokalem Zeitplan? Ohne gültige Uhrzeit: lieber fotografieren als nichts tun. */
static bool lightIsOn() {
  struct tm t;
  if (!getLocalTime(&t, 50)) return true;
  int start = LIGHT_ON_HOUR % 24;
  int dur = constrain(LIGHT_HOURS, 0, 24);
  if (dur == 0) return false;
  if (dur >= 24) return true;
  int minutesNow = t.tm_hour * 60 + t.tm_min;
  int elapsed = (minutesNow - start * 60 + 1440) % 1440;
  // die ersten/letzten 20 Minuten auslassen (Sonnenauf-/untergang -> falsche Farben)
  return elapsed >= 20 && elapsed < dur * 60 - 20;
}

static camera_fb_t* capture() {
  // ein paar Bilder verwerfen, damit Belichtung und Weißabgleich einpendeln
  for (int i = 0; i < 3; i++) {
    camera_fb_t* fb = esp_camera_fb_get();
    if (fb) esp_camera_fb_return(fb);
    delay(80);
  }
  return esp_camera_fb_get();
}

static int upload(const uint8_t* data, size_t len) {
  WiFiClientSecure client;
#if WIFI_TLS_INSECURE
  client.setInsecure();
#else
  client.setCACert(ROOT_CA_PEM);
#endif
  client.setTimeout(20);
  HTTPClient http;
  http.setConnectTimeout(8000);
  http.setTimeout(30000);
  if (!http.begin(client, SNAPSHOT_URL)) {
    Serial.println("[Upload] Verbindung fehlgeschlagen");
    return -1;
  }
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);
  int code = http.POST(const_cast<uint8_t*>(data), len);
  String body = http.getString();
  http.end();
  Serial.printf("[Upload] HTTP %d: %s\n", code, body.c_str());
  return code;
}

static void takeAndSend() {
#if USE_FLASH_LED
  digitalWrite(FLASH_LED_PIN, HIGH);
  delay(150);
#endif
  camera_fb_t* fb = capture();
#if USE_FLASH_LED
  digitalWrite(FLASH_LED_PIN, LOW);
#endif
  if (!fb) {
    Serial.println("[Kamera] Kein Bild");
    return;
  }
  if (fb->len > MAX_IMAGE_BYTES) {
    // zu groß: Qualität verringern (höhere Zahl) und beim nächsten Mal kleiner aufnehmen
    Serial.printf("[Kamera] Bild %u Bytes zu groß – senke Qualität\n", (unsigned)fb->len);
    esp_camera_fb_return(fb);
    g_quality = min(g_quality + 6, 40);
    sensor_t* s = esp_camera_sensor_get();
    if (s) s->set_quality(s, g_quality);
    fb = capture();
    if (!fb || fb->len > MAX_IMAGE_BYTES) {
      if (fb) esp_camera_fb_return(fb);
      return;
    }
  }
  esp_task_wdt_reset();
  int code = upload(fb->buf, fb->len);
  esp_camera_fb_return(fb);
  if (code == 429) {
    g_intervalMin = min(g_intervalMin * 2, MAX_INTERVAL_MIN);
    Serial.printf("[Upload] Zu viele Bilder – Intervall jetzt %u min\n", (unsigned)g_intervalMin);
  } else if (code == 200 && g_intervalMin != SNAPSHOT_INTERVAL_MINUTES) {
    g_intervalMin = SNAPSHOT_INTERVAL_MINUTES;
  } else if (code == 401) {
    Serial.println("[Upload] Token ungültig – in der App ein neues erzeugen und eintragen.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\nGrowMaster ESP32-CAM 0.1");
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  esp_task_wdt_config_t wdt = { .timeout_ms = WDT_TIMEOUT_S * 1000, .idle_core_mask = 0, .trigger_panic = true };
  esp_task_wdt_reconfigure(&wdt);
#else
  esp_task_wdt_init(WDT_TIMEOUT_S, true);
#endif
  esp_task_wdt_add(NULL);
#if USE_FLASH_LED
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);
#endif
  if (!initCamera()) {
    delay(5000);
    ESP.restart();
  }
  ensureWiFi();
  configTzTime(TZ_INFO, NTP_SERVER);
}

void loop() {
  esp_task_wdt_reset();
  ensureWiFi();
  uint32_t now = millis();
  bool due = !g_firstShotDone || now - g_lastShotMs >= g_intervalMin * 60000UL;
  if (due && WiFi.status() == WL_CONNECTED) {
    g_lastShotMs = now;
    g_firstShotDone = true;
    if (lightIsOn()) takeAndSend();
    else Serial.println("[Kamera] Licht aus – kein Foto");
  }
  delay(50);
}
