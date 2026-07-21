## Ziel
Sobald ein Anrufer (identifiziert über seine Telefonnummer `from`) einmal in `/mitarbeiter/erfassen` mit Name und/oder E-Mail erfasst wurde, sollen diese Daten beim nächsten Anruf derselben Nummer automatisch in der Anrufer-Card vorausgefüllt werden.

## Umsetzung

### 1. Datenbank
Neue Tabelle `public.caller_contacts` (pro Kunde eindeutige Rufnummer):
- `id uuid`
- `client_id uuid` → `clients.id`
- `phone_number text` (normalisiert, E.164-ähnlich)
- `caller_name text nullable`
- `caller_email text nullable`
- `last_seen_at timestamptz`
- `created_at`, `updated_at`
- Unique-Constraint `(client_id, phone_number)`

GRANTs + RLS:
- `authenticated`: SELECT/INSERT/UPDATE nur für Kunden, denen der Mitarbeiter zugewiesen ist (via `is_client_assigned_to_me`), Superadmin voll.
- `service_role`: ALL.

### 2. Speicherlogik (Erfassen-Seite)
Beim Speichern einer Notiz in `src/pages/mitarbeiter/Erfassen.tsx`:
- Wenn `anrufer_telefon` vorhanden ist, `upsert` in `caller_contacts` mit `client_id`, normalisierter Nummer, aktuellem `caller_name` / `caller_email`, `last_seen_at = now()`.
- Nur nicht-leere Felder überschreiben (kein Nullen von bestehenden Daten).

### 3. Autofill bei Anrufannahme
Beim Öffnen von `/mitarbeiter/erfassen?call=<id>&auto=1` (bzw. wenn ein Call aktiv wird):
- `from`-Nummer aus `sipgate_calls` normalisieren.
- Lookup in `caller_contacts` für `(client_id, phone_number)`.
- Wenn Treffer und Felder noch leer: `anrufer_name` / `anrufer_email` vorbefüllen (Telefon wird bereits gesetzt).
- Kleiner Hinweis-Badge in der Anrufer-Card: „Bekannter Anrufer — Daten vorausgefüllt“.

### 4. Nummer-Normalisierung
Einheitliche Helper-Funktion (nur Ziffern + führendes `+`), damit `+49 30 …`, `0049…` und `030…` auf denselben Key mappen.

## Technische Notizen
- Migration inkl. GRANTs, RLS-Policies und Trigger für `updated_at`.
- Upsert via `onConflict: 'client_id,phone_number'`.
- Keine Änderung an der sipgate-Webhook-Function nötig.
