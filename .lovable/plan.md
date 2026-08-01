## Problem

`/mitarbeiter/statistik` zieht Anrufe und Ø Dauer ausschließlich aus `sipgate_calls`. Für Outbound-Recruitment-Mitarbeiter existieren dort aber keine Zeilen — ihre Gespräche werden nur in `call_notes` gespeichert (inkl. Timer-Wert in `dauer_sekunden`). Deshalb bleibt ihre Statistik leer.

Zusätzlich enthält die Abfrage einen Fehler: es wird `clients.unternehmensname` selektiert, die Spalte heißt `company_name`. Dadurch schlägt die Kundenabfrage fehl und "Anrufe pro Kunde" zeigt nur "—".

## Umsetzung

**1. Quelle abhängig vom Mitarbeiter-Modus (`src/pages/mitarbeiter/Statistik.tsx`)**
- Beim Laden wird neben `employees.id` auch `employees.outbound_recruitment` gelesen.
- **Normale Caller (Inbound):** Kennzahlen weiterhin aus `sipgate_calls` (`handled_by_employee_id`, Dauer aus `answered_at` → `ended_at`) — unverändertes Verhalten.
- **Outbound-Recruitment-Caller:** Kennzahlen aus `call_notes` (`employee_id`, Zeitraum über `created_at`, Dauer aus `dauer_sekunden` vom Gesprächs-Timer).

**2. Gemeinsame Auswertungs-Ebene**
- Beide Quellen werden auf ein einheitliches Format normalisiert (`{ at: Date, durationSec: number, client_id }`), damit KPIs, Tages-/Wochen-Buckets und Charts identisch berechnet werden — nur die Datenherkunft unterscheidet sich.
- Kacheln: Anrufe, Ø Dauer, Notizen; zusätzlich "Gesamtzeit im Gespräch" (Summe der Dauer, h:mm).

**3. Charts**
- "Anrufe pro Tag/Woche" und "Ø Gesprächsdauer" nutzen die normalisierten Daten.
- "Verteilung nach Kategorie" bleibt auf `call_notes.kategorie`.
- "Anrufe pro Kunde": Spaltenname auf `company_name` korrigiert.
- Panel-Titel für Outbound-Caller sinngemäß angepasst (z. B. "Erfasste Gespräche pro Tag").

**4. Aktualisierung**
- Nach dem Speichern in `/mitarbeiter/erfassen` und der Recruitment-Erfassung wird der Query-Cache `["stat-data"]` invalidiert.
- Realtime-Subscription auf `call_notes` für den eigenen Mitarbeiter, mit sauberem Cleanup im `useEffect`.

## Technische Details

- Keine Schemaänderung nötig: `employees.outbound_recruitment` und `call_notes.dauer_sekunden` existieren bereits.
- Der Timer in `Erfassen.tsx`/`RecruitmentErfassen.tsx` schreibt `elapsed` (Sekunden) beim Insert — dieser Wert dient als Dauer-Basis für Outbound.
