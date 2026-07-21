## Ziel

Frontend-Anbindung an sipgate-Webhook abschließen, SIP-Zugangsdaten pro Mitarbeiter wieder entfernen und Kunden-Rufnummern-Eingabe im Wizard sicherstellen — damit `/mitarbeiter/erfassen` den Kunden automatisch anhand der angerufenen Nummer (`to`) auswählt.

## Änderungen

### 1. SIP-Zugangsdaten pro Mitarbeiter entfernen
- **DB-Migration**: Spalten `sip_phone_number`, `sip_server`, `sip_username`, `sip_password` aus `public.employees` droppen. `sipgate_user_id` bleibt (wird fürs Mapping der sipgate-User benötigt).
- **UI**:
  - `src/pages/superadmin/MitarbeiterWizard.tsx`: SIP-Step/Felder entfernen.
  - `src/pages/superadmin/MitarbeiterDetail.tsx`: SIP-Sektion entfernen.
  - `src/pages/mitarbeiter/Profil.tsx`: SIP-Zugangsdaten-Sektion entfernen (die zeigt aktuell die Kunden-SIP-Daten bzw. Mitarbeiter-SIP-Daten — komplett raus, da Softphone lokal konfiguriert wird).

### 2. Kunden-Rufnummern im Wizard
- Der Step „Rufnummern“ in `KundenWizard.tsx` existiert bereits aus dem letzten Turn und schreibt in `client_phone_numbers`. Kurz verifizieren:
  - Eingabe akzeptiert mehrere Nummern (Add/Remove).
  - Normalisierung auf E.164 (`+49...`) beim Speichern — muss zur Normalisierung im Webhook passen.
  - Beim Bearbeiten werden bestehende Nummern geladen und diff-basiert aktualisiert.
- Falls Normalisierung fehlt: Helper `normalizeToE164()` einbauen, der `0…` → `+49…` konvertiert.

### 3. `/mitarbeiter/live` — Live-Anrufe
- Ist im letzten Turn bereits umgestellt worden (`useLiveCalls` Hook mit Realtime auf `sipgate_calls`). Verifizieren:
  - RLS filtert auf zugewiesene Kunden (via `is_client_assigned_to_me`).
  - Klingelnde Anrufe zuerst, danach kürzlich beendete.
  - Button „Erfassen starten“ → `navigate('/mitarbeiter/erfassen?call=<id>')`.

### 4. `/mitarbeiter/erfassen` — Prefill
- Bei `?call=<id>` in URL:
  - Anruf aus `sipgate_calls` laden.
  - `client_id` aus Anruf → Kunde vorauswählen (Card mit Logo).
  - Anrufer-Telefonnummer (`from`) ins Feld schreiben.
  - Falls `client_id` null (unbekannte Nummer) → Hinweis, manuelle Auswahl bleibt möglich.
- Nach Speichern der Notiz/Erfassung: `sipgate_calls.handled_by_employee_id` setzen.

## Technische Details

```text
DB:
  ALTER TABLE public.employees
    DROP COLUMN sip_phone_number,
    DROP COLUMN sip_server,
    DROP COLUMN sip_username,
    DROP COLUMN sip_password;

Normalisierung (Client + Webhook identisch):
  "0301234567"   -> "+49301234567"
  "0049301234"   -> "+49301234"
  "+49301234"    -> "+49301234"

Prefill-Flow /mitarbeiter/erfassen?call=<uuid>:
  1. select * from sipgate_calls where id = :id
  2. wenn client_id -> Kunde in State setzen
  3. from -> caller_number Feld
  4. on submit -> update sipgate_calls set handled_by_employee_id = <me>
```

## Nicht Teil dieses Plans
- Ausgehende Anrufe (kann später mit derselben Webhook-URL nachgezogen werden).
- Eigenes Webphone / WebRTC.
- sipgate-User-IDs automatisch syncen — bleibt manuelles Feld am Mitarbeiter.