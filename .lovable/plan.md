## Notizen an Supabase anbinden

Aktuell speichert `/mitarbeiter/erfassen` beim Klick auf „Speichern" nur einen Toast, und `/mitarbeiter/notizen` zeigt Mock-Daten aus `mitarbeiter-mock`. Ziel: echte Persistenz via Supabase, gefiltert auf den eingeloggten Mitarbeiter und seine zugewiesenen Kunden.

### 1. Datenbank

Neue Tabelle `public.call_notes`:

- `client_id` → `clients.id`
- `employee_id` → `employees.id` (der erfassende Mitarbeiter)
- `sipgate_call_id` → `sipgate_calls.id` (optional, wenn aus Live-Call heraus erfasst)
- `anrufer_name`, `anrufer_nummer`, `anrufer_email`
- `anliegen` (Text, required)
- `kategorie` (Text: Rückruf / Termin / Info / Beschwerde / Weiterleitung)
- `prioritaet` (Text: niedrig / normal / hoch, default 'normal')
- `weitergeleitet_an` (Text, optional)
- `rueckruf_gewuenscht` (bool), `rueckruf_zeit` (Text)
- `ticket_erstellen` (bool)
- `dauer_sekunden` (int, aus Timer)
- Standard `id / created_at / updated_at` + update-Trigger

**GRANTs**: `authenticated` (select/insert/update/delete), `service_role` (all). Kein `anon`.

**RLS**:
- Mitarbeiter sehen/bearbeiten nur ihre eigenen Notizen (`employee_id` gehört zum eingeloggten User via `employees.user_id = auth.uid()`).
- Superadmin (`has_role(auth.uid(), 'superadmin')`) sieht/verwaltet alle → damit `/superadmin/notizen` später ebenfalls angebunden werden kann.
- Insert nur erlaubt, wenn `employee_id` zum eigenen User gehört UND der Mitarbeiter dem Kunden zugewiesen ist (`assignments`).

### 2. `/mitarbeiter/erfassen`

`save(closeAfter)` schreibt echt in `call_notes`:

- `employee_id` aus `employees` via `user_id = auth.uid()` holen.
- Alle Formularfelder + `dauer_sekunden` (aus Timer) + optional `sipgate_call_id` aus dem `?call=` Query-Param übernehmen.
- Erfolg: Toast + Reset (bei „Neuer Anruf") bzw. Navigation zu `/mitarbeiter/notizen` (bei „Schließen").
- Fehler-Toast bei Insert-Error.

### 3. `/mitarbeiter/notizen`

- Mock durch echten Supabase-Query ersetzen (`call_notes` join Kunde/Logo-Handling wie bisher).
- Filter (Kategorie, Kunde, Suche) client-seitig auf dem geladenen Ergebnis, so wie jetzt.
- Ergebnis-Rendering an neue Feldnamen anpassen (created_at → relative Zeit, anrufer_name/nummer, kategorie, rueckruf_gewuenscht/zeit).
- Der Edit-Button (Stift) bleibt vorerst UI-only — kein Bearbeitungs-Dialog in diesem Schritt, sofern du das nicht separat willst.

### 4. Nicht enthalten (bewusst)

- Kein Ticket-Anlegen (`ticket_erstellen` wird nur als Flag gespeichert, keine Tickets-Tabelle).
- Kein Bearbeiten bestehender Notizen aus der Notizen-Liste.
- `/superadmin/notizen` bleibt in diesem Schritt Mock — RLS ist aber schon so gebaut, dass es später ohne Migrationsänderung angebunden werden kann.

Sag Bescheid, falls Bearbeiten von Notizen oder das Superadmin-Panel gleich mit rein soll.