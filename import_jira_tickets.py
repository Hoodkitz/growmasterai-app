#!/usr/bin/env python3
"""
Jira Ticket Import Script für GrowMaster AI
Importiert alle restlichen Tickets automatisch
"""

import requests
import json
from base64 import b64encode

# ===== KONFIGURATION =====
JIRA_URL = "https://growmaster.atlassian.net"
EMAIL = "hoodkitz@gmail.com"
API_TOKEN = "ATATT3xFfGF04t_a_c7GCU-x6I7wEHBlkxLd6uUJgH34uo3BY9mOtXAYxOD7DavHEV2NKhv2WC1X9cK7ZLcMFspUtsysx4SOlzYSnlpl0_UUiOWAHYiBt7-Yi5MaWSugROp4cX99_kja2HrHS4Jpc_1IWjP4D6fCmeZBkrqGZ8Fu22-Yt88zNUQ=59D061EE"
PROJECT_KEY = "KAN"

# Auth Header
auth_string = f"{EMAIL}:{API_TOKEN}"
auth_bytes = auth_string.encode('ascii')
base64_bytes = b64encode(auth_bytes)
base64_string = base64_bytes.decode('ascii')

HEADERS = {
    "Authorization": f"Basic {base64_string}",
    "Content-Type": "application/json"
}

# ===== TICKETS =====
# Bereits erstellt: KAN-1, KAN-2, KAN-3, KAN-4, KAN-5
# Fehlende Tickets:

TICKETS = [
    {
        "summary": "CORS Whitelist für Production konfigurieren",
        "issue_type": "Task",
        "priority": "Medium",
        "labels": ["backend", "security", "production"],
        "description": """## Aktueller Status
CORS ist aktuell offen (development mode).

## Aufgaben
- [ ] Whitelist definieren für erlaubte Origins
- [ ] Environment-spezifische CORS-Konfiguration
- [ ] Preflight-Request-Handling optimieren
- [ ] Credentials-Support konfigurieren
- [ ] Testing mit verschiedenen Origins

## Whitelist Beispiel
- https://growmaster.app
- https://www.growmaster.app
- https://admin.growmaster.app
- Expo development: exp://
- localhost:8081

## Datei
- `server/index.ts` oder `server/_core/index.ts`"""
    },
    {
        "summary": "API Rate Limiting implementieren",
        "issue_type": "Task",
        "priority": "Medium",
        "labels": ["backend", "security", "performance"],
        "description": """## Problem
Aktuell gibt es keine Rate Limits auf API-Endpunkten.

## Risiken
- DDoS-Angriffe
- Gemini API Kosten explodieren
- Datenbank-Überlastung

## Aufgaben
- [ ] Rate-Limiting-Middleware für tRPC
- [ ] Redis für Rate-Limit-Counter (oder In-Memory)
- [ ] Limits pro Tier definieren:
  - Free: 100 requests/hour
  - Premium: 500 requests/hour
  - Pro: 2000 requests/hour
- [ ] Error-Handling für Rate-Limit-Exceeded
- [ ] User-Feedback im Frontend
- [ ] Admin-Dashboard für Rate-Limit-Monitoring

## Libraries
- `express-rate-limit`
- `redis` (optional)"""
    },
    {
        "summary": "Analytics Integration (Firebase/Mixpanel)",
        "issue_type": "Story",
        "priority": "Medium",
        "labels": ["analytics", "feature", "business"],
        "description": """## Ziele
- User-Behavior tracken
- Feature-Usage verstehen
- Conversion-Funnel analysieren
- Retention messen

## Events
- app_opened
- plant_created
- diagnosis_performed
- coach_message_sent
- paywall_viewed
- subscription_started
- subscription_cancelled
- achievement_unlocked
- community_post_created

## Plattformen
**Option 1: Firebase Analytics**
- Kostenlos
- Google-Integration
- BigQuery Export

**Option 2: Mixpanel**
- Bessere UX für Analysen
- Retention-Reports out-of-the-box
- Free Tier: 20M events/month

## Aufgaben
- [ ] Analytics-Provider auswählen
- [ ] SDK integrieren
- [ ] Event-Tracking implementieren
- [ ] User-Properties setzen (tier, signup_date)
- [ ] Privacy-konform machen (DSGVO)
- [ ] Dashboard für Team einrichten"""
    },
    {
        "summary": "Certificate Pinning implementieren",
        "issue_type": "Story",
        "priority": "Medium",
        "labels": ["security", "backend", "infrastructure"],
        "description": """## Zweck
Man-in-the-Middle Angriffe verhindern.

## Aufgaben
- [ ] SSL-Certificate für Backend abrufen
- [ ] Public Key Pinning in expo-constants konfigurieren
- [ ] Native Module für Pinning (Android/iOS)
- [ ] Fallback-Strategie bei Cert-Rotation
- [ ] Testing mit ungültigem Cert
- [ ] Monitoring für Pinning-Failures

## Risiko
Falsch konfiguriert = App funktioniert nicht mehr!

## Testing
- Staging-Environment zuerst
- Gradual Rollout"""
    },
    {
        "summary": "Admin Moderation Tools erweitern",
        "issue_type": "Story",
        "priority": "Medium",
        "labels": ["admin", "feature", "moderation"],
        "description": """## Aktuell vorhanden
- Admin-Screen existiert
- Basic Anbieter-Verwaltung

## Erweitern um
- [ ] User-Management (Ban, Suspend, Delete)
- [ ] Content-Moderation für Community-Posts
- [ ] Reported Content Review
- [ ] Gewinnspiel-Management (Winner auswählen)
- [ ] Analytics-Dashboard
- [ ] Anbieter-Freischaltung
- [ ] Push-Notification-Versand
- [ ] Support-Ticket-System

## Features
**User-Moderation:**
- User suchen
- Profil ansehen
- Aktivität-Log
- Actions: Warnen, Suspendieren, Bannen

**Content-Moderation:**
- Reported Posts Queue
- Quick-Actions: Approve, Delete, Ban User
- Bulk-Actions

**Analytics:**
- DAU/MAU
- Conversion-Rate
- Churn-Rate
- Revenue-Metrics"""
    },
    {
        "summary": "Offline-Modus Support",
        "issue_type": "Story",
        "priority": "Low",
        "labels": ["feature", "offline", "premium"],
        "description": """## Anforderungen
- App sollte ohne Internet grundlegend funktionieren
- Lokale Daten vorhalten
- Sync bei Reconnect

## Offline-Features
- Pflanzen ansehen (aus Cache)
- Journal-Einträge erstellen (lokal speichern)
- Bereits geladene Daten anzeigen
- Offline-Indicator in UI

## Sync-Strategie
- Queue für ausstehende Aktionen
- Background-Sync bei Reconnect
- Conflict-Resolution bei Daten-Divergenz

## Aufgaben
- [ ] Offline-Detection implementieren
- [ ] AsyncStorage-Caching erweitern
- [ ] Sync-Queue implementieren
- [ ] UI-Feedback für Offline-Status
- [ ] Testing mit NetInfo Mock
- [ ] Sync-Konflikte behandeln

## Libraries
- `@react-native-community/netinfo`
- `redux-offline` (optional)

## Premium-Feature?
Offline-Modus könnte Premium/Pro-Feature sein."""
    },
    {
        "summary": "i18n/Lokalisierung für weitere Sprachen",
        "issue_type": "Story",
        "priority": "Low",
        "labels": ["feature", "i18n", "localization"],
        "description": """## Aktuell
- App ist auf Deutsch
- Englische Übersetzungen teilweise vorhanden

## Ziel-Sprachen
1. **Englisch** (Priorität 1)
2. **Niederländisch** (Cannabis-Markt)
3. **Spanisch** (großer Markt)
4. **Französisch** (EU-Markt)
5. **Italienisch** (EU-Markt)

## Aufgaben
- [ ] i18next oder react-i18next integrieren
- [ ] Translation-Files erstellen (JSON)
- [ ] Alle UI-Texte extrahieren
- [ ] Sprach-Auswahl in Settings
- [ ] System-Sprache als Default
- [ ] RTL-Support (Arabisch?) später
- [ ] Datums-/Zahlenformate lokalisieren

## Struktur
```
locales/
  de/
    common.json
    screens.json
    errors.json
  en/
    common.json
    ...
```"""
    },
    {
        "summary": "Dark Mode Toggle hinzufügen",
        "issue_type": "Task",
        "priority": "Low",
        "labels": ["ui", "theme", "feature"],
        "description": """## Aktuell
- App ist immer im Dark Mode
- Theme ist fest auf "dark" gesetzt

## Aufgaben
- [ ] Theme-Toggle in Settings-Screen
- [ ] Theme-Persistenz (AsyncStorage)
- [ ] System-Theme-Detection (Auto-Modus)
- [ ] Light Mode Theme erstellen
- [ ] Alle Screens im Light Mode testen
- [ ] Smooth Theme-Transition

## Modi
1. **Auto** - Folgt System-Einstellung
2. **Light** - Immer hell
3. **Dark** - Immer dunkel (aktuell)

## Theme-Farben
**Dark Mode (existiert):**
- Background: #0a0a0a
- Primary: #22c55e (Grün)

**Light Mode (neu):**
- Background: #ffffff
- Primary: #16a34a (Dunkleres Grün)
- Text: #1a1a1a"""
    },
    {
        "summary": "Onboarding Tutorial erweitern",
        "issue_type": "Story",
        "priority": "Low",
        "labels": ["ux", "onboarding", "feature"],
        "description": """## Aktuell
- Basic Onboarding vorhanden (Login + Pflanze anlegen)

## Erweitern um
- [ ] Feature-Tour nach erstem Login
- [ ] Interactive Walkthrough
- [ ] Video-Tutorial (optional)
- [ ] Tooltips für wichtige Features
- [ ] Progress-Indicator
- [ ] Skip-Option
- [ ] "Später anzeigen" für Premium-Features

## Tour-Stops
1. **Home-Dashboard** - Übersicht erklären
2. **Diagnose** - Kamera zeigen
3. **Coach** - AI-Chat vorstellen
4. **Pflanzen** - Pflanzenverwaltung
5. **Journal** - Dokumentation erklären
6. **Community** - Social Features zeigen

## Libraries
- `react-native-copilot` (Tutorial Overlays)
- `react-native-onboarding-swiper`"""
    },
    {
        "summary": "CI/CD Pipeline einrichten",
        "issue_type": "Story",
        "priority": "Low",
        "labels": ["devops", "ci-cd", "automation"],
        "description": """## Ziele
- Automatisierte Tests bei jedem Push
- Automatische Builds
- Automated Deployment
- Code-Quality-Checks

## Pipeline-Stages

### 1. Test
- [ ] Vitest Tests laufen
- [ ] TypeScript Check
- [ ] ESLint
- [ ] Coverage-Report

### 2. Build
- [ ] Server-Build (CommonJS)
- [ ] Android APK (EAS Build)
- [ ] iOS IPA (später)

### 3. Deploy
- [ ] Backend zu Production deployen
- [ ] APK zu Internal Testing (Google Play)
- [ ] Beta-Deployment

## Plattform-Optionen
**Option 1: GitHub Actions** - Kostenlos für Open Source
**Option 2: GitLab CI** - Self-hosted möglich
**Option 3: Circle CI** - Gute React Native Support"""
    }
]

def markdown_to_adf(markdown_text):
    """Konvertiert Markdown zu ADF (Atlassian Document Format) - vereinfacht"""
    # Einfache Konvertierung: Text in Paragraphen
    lines = markdown_text.split('\n')
    content = []
    
    for line in lines:
        if line.strip():
            content.append({
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": line
                    }
                ]
            })
    
    return {
        "version": 1,
        "type": "doc",
        "content": content if content else [{
            "type": "paragraph",
            "content": [{"type": "text", "text": markdown_text}]
        }]
    }

def create_jira_ticket(ticket_data):
    """Erstellt ein einzelnes Jira-Ticket"""
    
    payload = {
        "fields": {
            "project": {"key": PROJECT_KEY},
            "summary": ticket_data["summary"],
            "description": markdown_to_adf(ticket_data["description"]),
            "issuetype": {"name": ticket_data["issue_type"]},
            "priority": {"name": ticket_data["priority"]},
            "labels": ticket_data["labels"]
        }
    }
    
    try:
        response = requests.post(
            f"{JIRA_URL}/rest/api/3/issue",
            headers=HEADERS,
            json=payload
        )
        
        if response.status_code == 201:
            issue_data = response.json()
            issue_key = issue_data.get("key")
            print(f"✅ Created: {issue_key} - {ticket_data['summary']}")
            return True
        else:
            print(f"❌ Failed: {ticket_data['summary']}")
            print(f"   Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {ticket_data['summary']}")
        print(f"   Error: {str(e)}")
        return False

def main():
    """Hauptfunktion - Importiert alle Tickets"""
    print("=" * 60)
    print("🎫 Jira Ticket Import für GrowMaster AI")
    print("=" * 60)
    print(f"Project: {PROJECT_KEY}")
    print(f"Total Tickets: {len(TICKETS)}")
    print("=" * 60)
    print()
    
    success_count = 0
    fail_count = 0
    
    for i, ticket in enumerate(TICKETS, 1):
        print(f"[{i}/{len(TICKETS)}] Creating: {ticket['summary']}")
        if create_jira_ticket(ticket):
            success_count += 1
        else:
            fail_count += 1
        print()
    
    print("=" * 60)
    print("📊 Import Summary")
    print("=" * 60)
    print(f"✅ Successfully created: {success_count}")
    print(f"❌ Failed: {fail_count}")
    print(f"📝 Total: {len(TICKETS)}")
    print()
    print(f"🔗 View project: {JIRA_URL}/browse/{PROJECT_KEY}")
    print("=" * 60)

if __name__ == "__main__":
    main()
