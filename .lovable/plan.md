## Diagnose (verifiziert)

Der Proxy funktioniert (HTTP 200, `meta` liefert Branding „for.tel Solutions GmbH“, Slot 1). Das Problem sind **falsche Parameternamen** — unser Client spricht ein anderes Protokoll als die echte `caller-api` im Referenzprojekt:

| Aktion | Wir senden | `caller-api` erwartet |
|---|---|---|
| `list_interviews` | `scope`, `limit`, `offset` | `view` (`default` \| `past` \| `future`), `page`, `search` |
| `set_status` | `interview_id`, `notes` | `appointment_id`, `note` |
| `send_panel_link` | `interview_id` | `appointment_id` |
| `send_reminder` | `interview_id`, `message` | `appointment_id`, `text` (bzw. `preview: true` für Textvorschlag) |
| `resend_success_email` | – | `appointment_id` |

Da `scope` unbekannt ist, fällt die API auf `view = "default"` zurück — das liefert nur Termine von **heute (ab jetzt −3 h) und morgen**. Deshalb kam `{"items":[],"total":0}`.

Zusätzlich: `view=future` bedeutet upstream „ab übermorgen“, `past` = älter als heute−3 h, `default` = heute+morgen. Für „anstehend“ müssen also `default` + `future` zusammengeführt werden.

## Umsetzung

**1. `src/pages/mitarbeiter/Bewerbungsgespraeche.tsx`**
- Tabs auf die echte API-Semantik umstellen: **Anstehend** (lädt `default` + `future` und führt sie chronologisch zusammen), **Vergangen** (`past`).
- Statt `limit/offset` die `page`-Paginierung der API nutzen; `total`/`page_size` aus der Antwort für die Blätter-Steuerung verwenden.
- Suchfeld an den `search`-Parameter der API durchreichen (serverseitige Suche statt lokaler Filterung).
- Weiterhin 5-Minuten-Polling + manueller Refresh.

**2. `src/hooks/use-caller-api.ts`**
- `normalizeInterview` an das reale Antwortformat anpassen: `first_name`/`last_name`, `phone`, `email`, `employment_type`, `appointment_date`/`appointment_time`, `status`, `slot`/`slot_total`, `reminder_count`, `probetag_invite_count`, `trial_day`, `notes[]` (Array aus `{status, text, author, created_at}` statt String).
- Die generische Feld-Rateaufik bleibt als Fallback erhalten.

**3. `src/pages/mitarbeiter/RecruitmentErfassen.tsx`**
- Alle Aufrufe auf `appointment_id` umstellen.
- `set_status`: Feld `note` statt `notes`; Pflicht-Notiz bei „fehlgeschlagen“ bereits vorhanden.
- `send_reminder`: erst `preview: true` aufrufen, um den vorgeschlagenen SMS-Text zu holen und im Dialog vorzubefüllen, dann mit `text` senden.
- Bisherige Notiz-Anzeige auf das Notiz-Array umstellen.

**4. `supabase/functions/caller-api-proxy/index.ts`**
- Bleibt ein reiner Durchreicher, aber: Fehlertexte der Upstream-API sauber durchreichen und bei nicht-200 die Antwort loggen (schon vorhanden) — zusätzlich `action` + Statuscode ins Log, damit künftige Protokollabweichungen sofort sichtbar sind.

## Technische Details
- Keine DB-Änderung, kein neuer Secret.
- Upstream-`PAGE_SIZE` ist serverseitig fix; die UI liest `page_size` aus der Antwort statt es vorzugeben.
