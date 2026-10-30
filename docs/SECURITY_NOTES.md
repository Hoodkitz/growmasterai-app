# Sicherheitsnotizen: Login-Bremse

Umsetzung: `server/_core/rateLimit.ts` (`beginLoginAttempt`), eingebunden in `server/_core/oauth.ts` (`POST /api/auth/login`).

## Verhalten

- Jeder Versuch wird VOR der Passwortprüfung gezählt (parallele Versuche zählen mit), bei richtigem Passwort zurückgenommen.
- Strikt je Konto + Client-IP: 10 Versuche / 15 Min, danach 429 mit `Retry-After`. Ein Angreifer von IP B sperrt den Nutzer auf IP A nicht aus.
- Kontoweit (alle IPs): 50 Versuche / 15 Min. Danach 429 nur für IPs, die für dieses Konto noch nie erfolgreich waren. Bekannte IPs (bis zu 20 je Konto, im Arbeitsspeicher) dürfen weiter.
- Konto-Schlüssel: NFKC + lowercase + trim. IPv6 wird nach /64 gruppiert.
- Zusätzlich bleibt die allgemeine Rate-Limit je IP (`loginLimiter`).
- Tabellen sind auf 10.000 Einträge begrenzt, abgelaufene werden vorher gelöscht, lebende nie verdrängt. Ist die Tabelle voll, zählt ein neuer Schlüssel in einer zweiten, ebenfalls begrenzten Tabelle je IP (/64); sind beide voll, wird abgelehnt (fail closed).
- Die Client-IP kommt aus `req.ip` mit `trust proxy = 1`. `X-Real-IP` wird nicht genutzt (Railway dokumentiert nicht, dass Client-Werte überschrieben werden).

## Restrisiken und bewusste Abwägungen

- Zähler liegen im Arbeitsspeicher einer Instanz: Neustart oder mehrere Replicas setzen/teilen sie nicht. Bei Skalierung auf mehrere Instanzen Redis/DB nutzen.
- "Bekannte IP" ist keine Sicherheitsgrenze: Wer die IP des Opfers teilt (gleiches WLAN/CGNAT) umgeht die kontoweite Schwelle. Sie schützt nur die Erreichbarkeit für echte Nutzer.
- Ein Angreifer mit sehr vielen IPs kann je Konto bis zu 50 Versuche / 15 Min raten (Passwort-Policy und Hash-Kosten bleiben die Hauptverteidigung).
- Ein Angreifer kann mit vielen IPs die kontoweite Schwelle füllen und so Nutzer mit neuer/unbekannter IP für bis zu 15 Min aussperren (Sperr-DoS, begrenzt). Bekannte IPs sind davon nicht betroffen.
- Die Datenbank-Suche normalisiert nur trim+lowercase; Kollationsregeln von MySQL (z. B. Akzente) können weitere Schreibweisen derselben Adresse zusammenfassen, die der Zähler getrennt führt.
- Stimmt die Hop-Zahl von `trust proxy` nicht, teilen sich Nutzer einen IP-Bucket (Sperr-Risiko) oder die IP ist fälschbar. Nach dem Deploy in den Security-Logs prüfen, dass echte Client-IPs erscheinen.

## Empfehlung später

CAPTCHA (z. B. hCaptcha/Turnstile) nach wenigen Fehlversuchen oder E-Mail-Bestätigungslink für Anmeldungen von unbekannten Geräten statt weiterer Sperrlogik.
