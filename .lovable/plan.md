## Ausgangslage (geprüft)

- `src/hooks/use-assigned-clients.ts` lädt **nicht** `is_recruitment`, `call_script_content`, `call_script_my_name`, `call_script_company_name` — die Detailseite kennt den Recruitment-Status nicht.
- `src/pages/mitarbeiter/KundeDetail.tsx` zeigt „Begrüßungstext", „Weiterleitung" sowie „Letzte Anrufe"/„Notizen" — letztere beide kommen aus `MOCK_RECENT_CALLS` / `MOCK_NOTES` (`src/lib/mitarbeiter-mock.ts`), sind also nicht an Supabase angebunden.
- Echte Datenquellen existieren bereits und werden anderswo genutzt: `sipgate_calls` (Inbound, z. B. `use-live-calls.ts`, `Cockpit.tsx`) und `call_notes` (`Notizen.tsx`, `Statistik.tsx`).

## Umsetzung

### 1. Hook erweitern (`use-assigned-clients.ts`)
`is_recruitment`, `call_script_content`, `call_script_my_name`, `call_script_company_name` mitselektieren und als `istRecruitment`, `callSkript`, `skriptMeinName`, `skriptFirmenname` im `AssignedClient`-Interface bereitstellen.

### 2. Neuer Hook für Kundendaten (`src/hooks/use-client-detail-data.ts`)
Lädt pro Kunde echte Daten aus Supabase:
- **Anrufe**: `sipgate_calls` gefiltert auf `client_id`, sortiert nach `started_at` absteigend, Limit 20 — mit `status`, `from_number`, `caller_name`, Dauer aus `answered_at`/`ended_at`.
- **Notizen**: `call_notes` gefiltert auf `client_id`, sortiert nach `created_at` absteigend, Limit 20 — mit `anrufer_name`, `anrufer_nummer`, `anliegen`, `kategorie`, `prioritaet`, `dauer_sekunden`.
- Realtime-Subscription auf beide Tabellen (gefiltert auf `client_id`), sauber in `useEffect` mit `removeChannel`-Cleanup.
- Die bestehenden RLS-Policies (`is_client_assigned_to_me`) decken den Zugriff ab; nur lesende Queries, keine Migration nötig.

### 3. Detailseite umbauen (`KundeDetail.tsx`)
Mock-Importe entfernen, Daten aus dem neuen Hook beziehen und je nach `istRecruitment` unterschiedlich rendern:

**Für alle Kunden**
- „Letzte Anrufe": echte `sipgate_calls`-Einträge (verpasst / angenommen inkl. Gesprächsdauer, relatives Datum), leerer Zustand statt Mock.
- „Notizen": echte `call_notes`-Einträge inkl. Kategorie-/Prioritäts-Badge und Gesprächsdauer.

**Nur Recruitment-Kunden**
- Header-Badge „Recruitment-Kunde", Aktions-Button „Recruiting-Anruf starten".
- Statt „Begrüßungstext" ein ein-/ausklappbares Panel „Call-Skript", gerendert über `renderCallScript` mit gefüllten Variablen `[Mein_Name]`/`[Firmenname]` (`[Bewerber_Name]` bleibt markiert) und den `rich-text prose`-Styles.
- Statt „Weiterleitung" ein Panel „Anruf-Modus" mit Hinweis auf Outbound/Recruiting.
- Panel „Letzte Anrufe" (Inbound/Sipgate) entfällt; stattdessen werden nur die Recruiting-Gesprächsnotizen aus `call_notes` gezeigt.

**Nur reguläre Kunden**
- „Begrüßungstext" und „Weiterleitung" bleiben wie bisher, zusätzlich die echte Sipgate-Anrufliste.

### 4. Kundenliste (`Kunden.tsx`)
Recruitment-Kunden bekommen das Badge „Recruiting" statt „Weiterleitung aktiv"/„Nur Notiz".

## Technische Details
- Keine Schema-Änderung nötig — alle Felder existieren bereits (`clients.is_recruitment`, `call_script_*`, `sipgate_calls`, `call_notes`).
- Datenabruf über `@tanstack/react-query` analog zu den bestehenden Mitarbeiter-Seiten, damit Caching und Invalidierung konsistent bleiben.
