# sipgate Webhook-Integration — Live & Erfassen

## Kunden-Erkennung: Wie funktioniert es?

Anrufe werden über die **angerufene Nummer** (`to`) einem Kunden zugeordnet:

```text
Anrufer  ──ruft──►  Kunden-Rufnummer (bei sipgate)
                          │
                          ▼
                Channel klingelt bei allen
                Mitarbeitern des Channels
                          │
                          ▼
                Webhook `newCall` an unsere Edge Function
                mit  from = Anrufer,  to = Kunden-Nummer
                          │
                          ▼
                Lookup: to → client_phone_numbers → client_id
                          │
                          ▼
                Anruf erscheint bei allen Mitarbeitern,
                die in `assignments` für diesen Kunden eingetragen sind
```

Deshalb bekommt **jeder Kunde seine eigene sipgate-Rufnummer** (oder mehrere), die auf euren Channel geroutet ist. Das ist der einzige zuverlässige Weg — die Anrufer-Nummer (`from`) kann alles sein, aber `to` ist immer eine Nummer, die ihr kennt.

## Datenbank-Änderungen

### Neue Tabelle `public.client_phone_numbers`
- `client_id` → `clients.id`
- `phone_number` (E.164 normalisiert, z. B. `+4930123456`)
- `label` (z. B. „Hauptnummer", „Fax", optional)
- Unique-Index auf `phone_number`

RLS: Superadmin verwaltet. Mitarbeiter lesen nur Nummern zu Kunden, denen sie zugewiesen sind.

### Neue Tabelle `public.sipgate_calls`
Speichert jeden Anruf und wird per Realtime im Frontend abonniert.

Felder:
- `sipgate_call_id` (Unique — von sipgate)
- `direction` (`in` / `out`)
- `from_number`, `to_number`
- `client_id` (nullable — falls Lookup fehlschlägt)
- `answered_by_employee_id` (nullable — wer abgenommen hat)
- `handled_by_employee_id` (nullable — wer den Anruf in /erfassen bearbeitet)
- `status` (`ringing`, `answered`, `missed`, `ended`)
- `started_at`, `answered_at`, `ended_at`
- `caller_name` (optional, falls sipgate CLIP liefert)
- `raw_payload` (JSONB — letzter Webhook-Body, für Debugging)

RLS:
- Superadmin: alle.
- Mitarbeiter: nur Anrufe, deren `client_id` einem Kunden entspricht, der ihm über `assignments` zugewiesen ist.
- Realtime-Publication für diese Tabelle aktivieren.

### Erweiterung `public.clients`
Kein Schema-Change nötig — Nummern kommen in die neue Tabelle. Kunden-Wizard bekommt aber einen neuen Step „Telefonnummern" (mehrere Nummern hinzufügbar).

### Erweiterung `public.employees` (optional)
- `sipgate_user_id` (nullable, TEXT) — sipgate liefert im `answer`-Event die User-ID des Mitarbeiters, der abgenommen hat. Mapping erlaubt uns anzuzeigen „gerade bearbeitet von Sofia W.".
- Optional: `sipgate_extension` (die interne Durchwahl).

## Edge Function `sipgate-webhook`

Public Endpoint (kein JWT), aber mit Shared-Secret in der URL: `/sipgate-webhook?token=<SIPGATE_WEBHOOK_TOKEN>`.

Ablauf pro Event:

1. Token prüfen. Bei Mismatch → 401.
2. sipgate sendet `application/x-www-form-urlencoded` mit Feldern wie `event`, `callId`, `from`, `to`, `direction`, `user[]`, `xcid` etc. Body parsen.
3. Nummer normalisieren (führendes `+`, keine Leerzeichen).
4. Je nach `event`:
   - **newCall**: `client_id` per Lookup in `client_phone_numbers` ermitteln, Zeile in `sipgate_calls` mit `status = 'ringing'` und `started_at = now()` insertieren.
   - **answer**: Zeile per `sipgate_call_id` finden, `status = 'answered'`, `answered_at = now()`, `answered_by_employee_id` per `employees.sipgate_user_id` mappen.
   - **hangup**: `status = 'ended'` (oder `'missed'` falls nie answered), `ended_at = now()`.
5. Response: `200 OK` mit leerem Body (sipgate erlaubt auch XML für Anrufsteuerung — brauchen wir jetzt nicht).

CORS: keine (Server-zu-Server).

Secret: `SIPGATE_WEBHOOK_TOKEN` (mit `generate_secret` erzeugt).

## Frontend

### `/mitarbeiter/live`
- `MOCK_LIVE_CALLS` entfernen.
- Neuer Hook `useLiveCalls()`:
  - Initial: `sipgate_calls` where `status in ('ringing','answered')` laden.
  - Realtime-Subscription auf `INSERT` und `UPDATE`.
  - RLS filtert automatisch auf zugewiesene Kunden.
- Card-Layout bleibt. Wartezeit-Timer läuft ab `started_at`.
- Button „Erfassen starten" → navigiert zu `/mitarbeiter/erfassen?call=<call_id>` (nicht mehr `client=...&call=...` — reicht die Call-ID, den Kunden holen wir uns).

### `/mitarbeiter/erfassen`
- Wenn `?call=<id>` in URL:
  - Lade Anruf aus `sipgate_calls`.
  - Setze `clientId = call.client_id` (falls vorhanden).
  - Prefill: `anruferNummer = call.from_number`, ggf. `anruferName = call.caller_name`.
  - Timer auf `call.answered_at ?? call.started_at` starten (statt manuellem Start), wenn Anruf noch aktiv.
  - Setze `sipgate_calls.handled_by_employee_id = auth.uid()`, damit auf `/live` sichtbar wird „wird gerade bearbeitet".
- Fallback (kein `?call=`) bleibt wie heute — manuelle Erfassung.

## Superadmin-Ergänzung

Neuer Step im Kunden-Wizard: **„Rufnummern"**
- Liste mit Add/Remove.
- Jede Nummer bekommt `label` und `phone_number`.
- Beim Speichern schreiben wir in `client_phone_numbers` (statt in `clients`).

Optional (kann später kommen): In `/superadmin/mitarbeiter` ein Feld `sipgate_user_id` pflegen.

## sipgate-Konfiguration (manuell)

Zwei Webhook-Slots bei sipgate:
- **Eingehend**: `https://erwuhvouxkaxczzbjrle.supabase.co/functions/v1/sipgate-webhook?token=<SIPGATE_WEBHOOK_TOKEN>`
- **Ausgehend**: dieselbe URL (später aktivieren).

Events aktivieren: `newCall`, `answer`, `hangup`. `dtmf` optional.

## Sicherheit / RLS

- `sipgate_calls`: RLS-Policy nutzt `has_role(auth.uid(), 'superadmin')` ODER Existenz in `assignments` (analog zu `is_client_assigned_to_me`).
- Webhook-Endpoint validiert Token; ohne Token keine Writes möglich.
- `SIPGATE_WEBHOOK_TOKEN` als Supabase Secret speichern (nicht im Code).

## Umsetzungs-Schritte

1. Migration: `client_phone_numbers`, `sipgate_calls`, RLS, Realtime-Publication.
2. Secret `SIPGATE_WEBHOOK_TOKEN` erzeugen.
3. Edge Function `sipgate-webhook` deployen.
4. Webhook-URL in sipgate eintragen, Test-Anruf.
5. Kunden-Wizard um „Rufnummern"-Step erweitern.
6. `useLiveCalls`-Hook + Realtime auf `/mitarbeiter/live` schalten.
7. `/mitarbeiter/erfassen` mit `?call=<id>` Prefill anbinden.

## Was in diesem Plan nicht drin ist (bewusst)

- Ausgehende Anrufe protokollieren (später easy nachrüstbar — gleiche Function, gleiche Tabelle).
- Anrufsteuerung (Weiterleiten/Hangup via API) — braucht sipgate REST-Token, separates Feature.
- Aufzeichnungen — sipgate liefert URLs, könnten in Storage gespiegelt werden.

Sag Bescheid, ob ich starten soll oder etwas anders soll (z. B. eine Nummer pro Kunde reicht → dann können wir `client_phone_numbers` weglassen und einfach ein Feld `main_phone` an `clients` hängen).