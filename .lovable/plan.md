## Ziel
Neuer Reiter `/superadmin/telegram`, über den Chat-IDs verwaltet werden. Ein Telegram-Bot sendet formatierte Benachrichtigungen bei:
1. neuer Bewerbung
2. gebuchtem Bewerbungsgespräch

Zusätzlich reagiert der Bot auf den Befehl `/kalender` und listet die kommenden Bewerbungsgespräche chronologisch auf.

## Bot-Anbindung
Telegram wird über den Lovable-Connector angebunden (`standard_connectors--connect`), d. h. kein Bot-Token im Code — der Gateway injiziert die Auth. Aufrufe laufen aus Edge Functions über `https://connector-gateway.lovable.dev/telegram/sendMessage`.

## Datenbank
Neue Tabelle `public.telegram_recipients`:
- `id`, `chat_id` (text, unique), `label` (text), `is_active` (bool, default true), `notify_applications` (bool, default true), `notify_interviews` (bool, default true), `created_at`, `updated_at`
- GRANTs: `authenticated` (SELECT/INSERT/UPDATE/DELETE), `service_role` ALL
- RLS an, alle Policies nur für `has_role(auth.uid(),'superadmin')`

## Backend
**Edge Function `telegram-notify`** (`verify_jwt = false`, geschützt über internen Shared Secret Header):
- Body: `{ type: 'application' | 'interview' | 'test', payload }`
- lädt aktive Empfänger passend zum Typ (Service-Role-Client), baut HTML-Nachricht, sendet je Chat-ID über den Gateway
- `type: 'test'` wird stattdessen per JWT + Superadmin-Rolle geprüft (Test-Button im UI)

**Edge Function `telegram-webhook`** (`verify_jwt = false`) für eingehende Nachrichten:
- Prüft `X-Telegram-Bot-Api-Secret-Token` (abgeleitet aus dem Connector-Key)
- Nur aktive Chat-IDs aus `telegram_recipients` werden bedient
- Befehl `/kalender` (und `/start` mit Hilfetext): kommende Termine aus `interview_appointments` join `applications`, `appointment_date >= heute`, sortiert nach Datum/Uhrzeit, max. 10
- Registrierung per `setWebhook` über den Gateway nach dem Deploy

**Trigger 1 – neue Bewerbung:** Aufruf aus `submit-application` nach erfolgreichem Insert (fire-and-forget, Fehler nur geloggt).

**Trigger 2 – Terminbuchung:** DB-Trigger auf `interview_appointments` (AFTER INSERT OR UPDATE OF appointment_date, appointment_time), der per `pg_net` `telegram-notify` mit dem Shared Secret aufruft. `pg_net` ist bereits aktiv.

## Nachrichtenformat (parse_mode HTML)
```text
🆕 <b>Neue Bewerbung</b>
━━━━━━━━━━━━━━
👤 Max Mustermann
✉️ max@mail.de
📱 +49 …
🎂 01.01.1990 · 🌍 Deutsch
💼 Vollzeit
```
```text
📅 <b>Bewerbungsgespräch gebucht</b>
━━━━━━━━━━━━━━
👤 Max Mustermann
🗓 Mo, 03.08.2026 um 10:30 Uhr
📱 +49 151 12345678
```
`/kalender`-Antwort (Telefonnummer statt E-Mail):
```text
🗓 <b>Kommende Bewerbungsgespräche</b>
━━━━━━━━━━━━━━
1️⃣ Mo, 03.08. · 10:30 Uhr
    👤 Max Mustermann · 📱 +49 151 12345678
2️⃣ Di, 04.08. · 09:00 Uhr
    👤 Erika Musterfrau · 📱 +49 160 987654
```
Die Nummer kommt jeweils aus `applications.handynummer`. Bei leerer Liste: „Keine anstehenden Bewerbungsgespräche." Jeweils Inline-Button „Im Portal öffnen" auf `https://app.sekretariat-24.de/superadmin/bewerbungsgespraeche` bzw. `/superadmin/bewerbungen`.

## Frontend
- Sidebar: neuer Eintrag „Telegram" (Icon `Send`) in der Gruppe „System"
- Route `/superadmin/telegram` → neue Seite `src/pages/superadmin/Telegram.tsx`
  - Panel „Empfänger": Tabelle mit Label, Chat-ID, Switches für beide Benachrichtigungstypen, aktiv/inaktiv, Löschen
  - Dialog „Chat-ID hinzufügen" (Label + Chat-ID, Validierung)
  - Button „Testnachricht senden" pro Empfänger
  - Hilfebox: eigene Chat-ID ermitteln (`/start` an den Bot bzw. @userinfobot), Hinweis auf Befehl `/kalender`
  - Styling konsistent mit bestehenden Panels

## Technische Details
- Shared Secret via `generate_secret` (`TELEGRAM_NOTIFY_SECRET`), von Trigger und `submit-application` mitgesendet
- `supabase/config.toml`: `verify_jwt = false` für `telegram-notify` und `telegram-webhook`
- Gateway-Fehler werden mit Status + Body geloggt und im Test-Ergebnis angezeigt
