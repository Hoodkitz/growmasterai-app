# RevenueCat: Premium vs. Pro (config-driven)

Ergänzt `REVENUECAT_DASHBOARD_SETUP.md`. Die App kennt drei Stufen: `free`, `premium`, `pro`.
Ohne zusätzliche Konfiguration wird **nur Pro** verkauft (Entitlement `GrowMaster AI Pro`, „current“ Offering).

## Im RevenueCat-Dashboard anlegen (für Premium)

1. **Products** (je Store, Play Console / App Store Connect): z. B. `premium_monthly`, `premium_yearly` anlegen und in RevenueCat importieren.
2. **Entitlement** `GrowMaster AI Premium` erstellen und nur die Premium-Produkte anhängen.
   Das Pro-Entitlement `GrowMaster AI Pro` bleibt mit den Pro-Produkten verknüpft.
   (Empfehlung: Pro-Produkte hängen *zusätzlich* nicht am Premium-Entitlement; Pro hat in der App ohnehin Vorrang.)
3. **Offering** `premium` erstellen mit Paketen `$rc_monthly` / `$rc_annual` (optional `$rc_lifetime`) auf die Premium-Produkte.
   Das Pro-Offering bleibt das **current** Offering (oder per `EXPO_PUBLIC_RC_OFFERING_PRO` benennen).
4. **Webhook** (Project → Integrations → Webhooks): URL `https://<server>/api/webhooks/revenuecat`,
   „Authorization header value“ = Wert von `REVENUECAT_WEBHOOK_SECRET`. Events: alle (nicht behandelte werden ignoriert).

## Umgebungsvariablen

| Variable | Wo | Default | Zweck |
|---|---|---|---|
| `EXPO_PUBLIC_RC_ENTITLEMENT_PRO` | App | `GrowMaster AI Pro` | Pro-Entitlement-ID |
| `EXPO_PUBLIC_RC_ENTITLEMENT_PREMIUM` | App | leer (= aus) | Premium-Entitlement-ID |
| `EXPO_PUBLIC_RC_OFFERING_PRO` | App | leer (= current) | Offering-ID für Pro |
| `EXPO_PUBLIC_RC_OFFERING_PREMIUM` | App | leer (= aus) | Offering-ID für Premium |
| `REVENUECAT_WEBHOOK_SECRET` | Server | – (Route antwortet 503) | Authorization-Header des Webhooks |
| `REVENUECAT_ENTITLEMENT_PRO/_PREMIUM` | Server | übernimmt `EXPO_PUBLIC_RC_ENTITLEMENT_*` | Mapping im Webhook |

Premium erscheint in der Paywall nur, wenn `EXPO_PUBLIC_RC_OFFERING_PREMIUM` gesetzt ist **und** das Offering Pakete enthält.
`getSubscriptionStatus` liefert `pro`, wenn das Pro-Entitlement aktiv ist, sonst `premium` bei aktivem Premium-Entitlement.

## Webhook-Verhalten

`POST /api/webhooks/revenuecat` sucht den User über `app_user_id` (= `users.openId`; die App ruft beim Login
`Purchases.logIn(openId)` auf, siehe `lib/auth-context.tsx`), Fallback `original_app_user_id`/`aliases`.
Anonyme `$RCAnonymousID:`-IDs werden ignoriert.

- `INITIAL_PURCHASE`, `RENEWAL`, `PRODUCT_CHANGE`, `UNCANCELLATION`, `NON_RENEWING_PURCHASE` → `subscriptionTier` + `subscriptionExpiresAt` setzen
- `CANCELLATION` → Tier bleibt bis Laufzeitende, danach `free`
- `EXPIRATION` → `free`
- 401 bei falschem Header, 503 ohne konfiguriertes Secret, 5xx bei DB-Fehlern (RevenueCat wiederholt).

Hinweis: Der Client bleibt maßgeblich für die UI (RevenueCat-CustomerInfo); der Webhook hält die Server-DB (`users.subscriptionTier`) synchron.
