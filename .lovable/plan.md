
## Ziel
`/mitarbeiter` (Cockpit) zeigt aktuell hardcodierte Mock-Werte („Willkommen, Sofia", 14 Anrufe heute, 2:48 Ø-Zeit, „Letzte Anrufe" aus Mock). Alles auf Live-Daten des eingeloggten Mitarbeiters umstellen.

## Änderungen in `src/pages/mitarbeiter/Cockpit.tsx`

### 1. Begrüßung mit echtem Namen
- Aktuellen User via `useAuth()` holen.
- Vornamen aus `employees` (`first_name`) laden, Fallback auf `profiles.full_name` bzw. E-Mail-Prefix.
- Anzeige: „Willkommen, {Vorname}".

### 2. KPI-Karten mit echten Zahlen
Berechnung serverseitig via Supabase-Queries, gefiltert auf zugewiesene Kunden (`useAssignedClients` liefert IDs) und heutigen Tag (00:00 lokal):

- **Anrufe heute**: `count` aus `sipgate_calls` wo `client_id in (assigned)` und `started_at >= today`. Delta: gestrige Anzahl → „+X vs. gestern".
- **Ø Gesprächszeit**: Mittelwert `duration_seconds` (nur beendete Anrufe mit Dauer > 0) von heute; formatiert als `m:ss`. Delta: Vergleich zu gestern.
- **Offene Notizen**: `count` aus `call_notes` wo `employee_id = <mein employee.id>` und `rueckruf_gewuenscht = true` (oder Status offen, falls vorhanden — Feld beim Implementieren im Schema prüfen).
- **Zugewiesene Kunden**: bleibt `clients.length` aus `useAssignedClients`.

Fallback: Wenn keine Daten, „0" bzw. „—" statt Delta.

### 3. Panel „Letzte Anrufe"
- Query: letzte 6 `sipgate_calls` für zugewiesene Kunden, sortiert `started_at desc`.
- Join/Lookup Kundenname + Logo aus vorhandenem `useAssignedClients`.
- Status-Badge:
  - `missed` → rot „Verpasst"
  - sonst Dauer via `duration_seconds`.
- Kategorie-Badge nur zeigen, wenn im Datensatz vorhanden (aktuell nicht in `sipgate_calls` — weglassen oder aus verknüpfter `call_notes` ziehen; im Plan: erstmal weglassen, dafür `direction` als Badge „Eingehend/Ausgehend").

### 4. Panel „Meine Kunden"
- Bleibt wie bisher (nutzt bereits echte Daten via `useAssignedClients`).

### 5. Mock-Referenzen entfernen
- `MOCK_RECENT_CALLS`, `CURRENT_EMPLOYEE` aus dieser Datei nicht mehr importieren.
- `mitarbeiter-mock.ts` selbst nicht anfassen (wird noch von anderen Seiten genutzt).

## Technisch
- Neue Queries via `@tanstack/react-query` (Muster wie in `useAssignedClients` / `use-live-calls`).
- Loading-States: Skeleton-Werte („—") während Fetch.
- Keine DB-Migration nötig — alle Felder existieren bereits (`sipgate_calls.started_at`, `duration_seconds`, `client_id`, `status`, `direction`; `call_notes.employee_id`, `rueckruf_gewuenscht`).

## Nicht Teil des Plans
- Realtime-Updates der KPIs (kann später via Channel auf `sipgate_calls` ergänzt werden).
- Änderungen an anderen Mitarbeiter-Seiten.
