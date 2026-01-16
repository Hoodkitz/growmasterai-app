# 📋 Atlassian Import Guide

Anleitung zum Hochladen der Dokumentation in Confluence und Jira.

---

## ✅ Was wurde erstellt?

### 1. **SESSION_SUMMARY.md**
- Vollständige Projekt-Übersicht
- Alle Entwicklungsschritte (v1.0 - v1.8.3)
- Tech Stack & Architektur
- Bekannte Issues & Fixes

### 2. **CONFLUENCE_PAGE.json**
- Fertige Confluence-Seite im ADF-Format
- Strukturiert mit Headings, Tabellen, Expandables
- Kann direkt importiert werden

### 3. **JIRA_TICKETS.json**
- 15 vordefinierte Tickets
- Story Points vergeben
- Labels & Prioritäten gesetzt
- Detaillierte Beschreibungen

---

## 📝 Confluence: Dokumentation hochladen

### Option 1: Manuell über UI

1. **Gehe zu deinem Confluence Space**
   - Öffne: `https://[deine-site].atlassian.net/wiki`
   
2. **Neue Seite erstellen**
   - Klicke auf "Create" oder "Erstellen"
   - Titel: **"GrowMaster AI - Projekt Dokumentation"**

3. **Content aus SESSION_SUMMARY.md kopieren**
   - Öffne `SESSION_SUMMARY.md`
   - Kopiere den gesamten Inhalt
   - Füge in Confluence ein (Confluence konvertiert Markdown automatisch)

4. **Formatierung anpassen**
   - Überschriften sollten automatisch erkannt werden
   - Code-Blöcke werden als Code-Blöcke formatiert
   - Tabellen ggf. manuell nachformatieren

5. **Seite veröffentlichen**
   - Klicke auf "Publish" oder "Veröffentlichen"

### Option 2: REST API (Automatisch)

Falls du Python oder Node.js nutzen möchtest:

```bash
# Confluence-Page via API erstellen
curl -X POST \
  'https://[deine-site].atlassian.net/wiki/rest/api/content' \
  -H 'Authorization: Basic [BASE64_EMAIL:API_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d @CONFLUENCE_PAGE.json
```

**API-Token erstellen:**
1. Gehe zu: https://id.atlassian.com/manage-profile/security/api-tokens
2. Klicke "Create API token"
3. Kopiere den Token

---

## 🎫 Jira: Tickets importieren

### Option 1: Manuell Tickets erstellen

Öffne `JIRA_TICKETS.json` und erstelle für jedes Ticket:

**Beispiel für TICKET-001:**

1. **Gehe zu deinem Jira-Projekt**
   - `https://[deine-site].atlassian.net/jira/software/projects/[PROJECT-KEY]`

2. **Neues Issue erstellen**
   - Klicke auf "Create" (oben rechts)

3. **Felder ausfüllen:**
   - **Project:** GrowMaster AI
   - **Issue Type:** Task
   - **Summary:** `Google Play Store Submission`
   - **Priority:** High
   - **Description:** Kopiere aus JSON `description` Feld
   - **Labels:** `store`, `deployment`, `release`
   - **Story Points:** 8 (Custom Field, falls vorhanden)

4. **Weitere Tickets**
   - Wiederhole für alle 15 Tickets aus der JSON-Datei

### Option 2: CSV Import

1. **JSON zu CSV konvertieren**
   - Nutze ein Tool wie: https://www.convertcsv.com/json-to-csv.htm
   - Oder erstelle selbst eine CSV:

```csv
Summary,Issue Type,Priority,Description,Labels,Story Points
"Google Play Store Submission",Task,High,"# Google Play Store Submission...",store;deployment;release,8
"Backend Publishing testen",Task,High,"# Backend Publishing Test...",backend;deployment;testing,5
```

2. **In Jira importieren**
   - Gehe zu: Project Settings → Import
   - Wähle "CSV" als Format
   - Lade CSV-Datei hoch
   - Mappe Spalten zu Jira-Feldern
   - Klicke auf "Import"

### Option 3: Jira REST API

```python
# Python-Beispiel für Ticket-Import
import requests
import json

JIRA_URL = "https://[deine-site].atlassian.net"
EMAIL = "deine-email@example.com"
API_TOKEN = "dein-api-token"
PROJECT_KEY = "GM"  # Dein Projekt-Key

# Tickets laden
with open('JIRA_TICKETS.json') as f:
    data = json.load(f)

# Tickets erstellen
for ticket in data['tickets']:
    payload = {
        "fields": {
            "project": {"key": PROJECT_KEY},
            "summary": ticket['summary'],
            "description": ticket['description'],
            "issuetype": {"name": ticket['type']},
            "priority": {"name": ticket['priority']},
            "labels": ticket['labels']
        }
    }
    
    response = requests.post(
        f"{JIRA_URL}/rest/api/3/issue",
        auth=(EMAIL, API_TOKEN),
        headers={"Content-Type": "application/json"},
        json=payload
    )
    
    if response.status_code == 201:
        print(f"✅ Created: {ticket['summary']}")
    else:
        print(f"❌ Failed: {ticket['summary']}")
        print(response.text)
```

---

## 🔗 Atlassian mit AI verbinden (Optional)

Falls du in Zukunft direkt aus dieser AI Confluence/Jira bearbeiten möchtest:

### Schritt 1: API-Token erstellen
1. Gehe zu: https://id.atlassian.com/manage-profile/security/api-tokens
2. Klicke "Create API token"
3. Name: "Rovo Dev AI Access"
4. Kopiere Token (wird nur einmal angezeigt!)

### Schritt 2: Site-URL notieren
- Deine Atlassian-Site: `https://[deine-site].atlassian.net`

### Schritt 3: Bei AI anmelden
Wenn du die AI das nächste Mal nutzt, sage:
```
"Ich möchte meine Atlassian-Site verbinden:
- Site: https://meine-site.atlassian.net
- Email: meine-email@example.com
- API Token: [token]"
```

Dann kann die AI direkt:
- Confluence-Seiten erstellen/bearbeiten
- Jira-Tickets anlegen
- Issues aktualisieren
- Kommentare hinzufügen

---

## 📊 Empfohlene Struktur

### Confluence

```
📁 GrowMaster AI (Space)
  📄 Projekt Dokumentation (diese Seite)
  📁 Development
    📄 Setup Guide
    📄 Architecture
    📄 API Documentation
  📁 Releases
    📄 v1.8.3 Release Notes
    📄 Changelog
  📁 Marketing
    📄 Store Listings
    📄 Screenshots
```

### Jira

**Epics:**
- 🎯 Store Launch (TICKET-001, 002, 003, 004)
- 🔒 Security & Performance (TICKET-006, 007, 009)
- 🚀 Features (TICKET-005, 008, 010, 011, 012, 013, 014)
- 🛠️ DevOps (TICKET-015)

**Sprints:**
- **Sprint 1:** Store Launch (High Priority)
- **Sprint 2:** Security Hardening
- **Sprint 3:** Analytics & Push Notifications

---

## ❓ FAQ

### Wie finde ich meine Atlassian Site-URL?
- Logge dich bei Atlassian ein
- Oben links steht deine Site: `[name].atlassian.net`

### Wo finde ich meinen Projekt-Key?
- Gehe zu deinem Jira-Projekt
- Der Key steht in der URL: `/projects/[KEY]/board`
- Oder in den Project Settings

### Kann ich Markdown direkt in Confluence nutzen?
- Ja! Confluence konvertiert Markdown automatisch
- Oder nutze den "Markdown Macro"

### Story Points werden nicht angezeigt?
- Story Points sind ein Custom Field
- Aktiviere es in: Project Settings → Issue Types → Fields

---

## 🎉 Fertig!

Nach dem Import hast du:
- ✅ Vollständige Projekt-Dokumentation in Confluence
- ✅ 15 strukturierte Tickets in Jira
- ✅ Klare Roadmap für nächste Schritte

**Geschätzter Zeitaufwand:**
- Confluence manuell: ~10 Minuten
- Jira manuell: ~30 Minuten
- Mit API: ~5 Minuten Setup + sofort

Viel Erfolg! 🚀
