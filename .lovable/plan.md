## /superadmin/anrufe an Supabase anbinden

Die Seite zeigt aktuell Mock-Daten. Ziel: alle Anrufe aus `sipgate_calls` als globales Log für Superadmin darstellen, mit Filter, Suche und Status.

### 1. RLS / Zugriff

`sipgate_calls` hat bereits RLS. Sicherstellen (bzw. ergänzen, falls fehlt), dass Superadmin (`has_role(auth.uid(), 'superadmin')`) alle Zeilen lesen darf. Keine Schemaänderung an Spalten nötig — die Tabelle enthält bereits: `direction`, `from_number`, `to_number`, `client_id`, `answered_by_employee_id`, `status`, `caller_name`, `started_at`, `answered_at`, `ended_at`.

### 2. Datenabruf

Neuer Hook / Query in `src/pages/superadmin/Anrufe.tsx`:

- Select aus `sipgate_calls` mit Joins:
  - `clients (id, company_name, logo_path)` über `client_id`
  - `employees (id, first_name, last_name)` über `answered_by_employee_id` (fallback `handled_by_employee_id`)
- Sortierung `started_at desc`, initial Limit 200.
- Realtime-Subscription analog `useLiveCalls`, damit neue Anrufe live auftauchen (optional, aber konsistent).

### 3. UI-Anpassungen in `Anrufe.tsx`

- Mock-Array entfernen, echte Daten rendern.
- Spalten: Zeit (formatiert `dd.MM. HH:mm`), Richtung-Icon (in/out/missed anhand `direction` + `status`), Kunde (Firmenname oder `— Unbekannt —` wenn `client_id` null), Mitarbeiter (Vor-/Nachname oder „—"), Dauer (aus `answered_at`/`ended_at` berechnet, `mm:ss`), Status-Badge (`ringing`/`answered`/`ended`/`missed` mit passenden Varianten und Farben).
- Suche (bestehendes Input): client-seitig über Nummer, Kundenname, Mitarbeitername.
- Filter-Buttons als funktionsfähige Dropdowns:
  - **Zeitraum**: heute / 7 Tage / 30 Tage / alle
  - **Kunde**: aus geladenen `clients`
  - **Mitarbeiter**: aus geladenen `employees`
  - **Richtung**: in / out / verpasst
- Leerer Zustand + Ladezustand.
- CSV-Export-Button: aktuell ohne Funktion lassen (nur UI) oder simplen Client-Export der aktuellen Filter — sag Bescheid, was du willst; ich würde einfachen Client-CSV-Export machen.

### 4. Nicht enthalten

- Kein Detail-Drawer pro Anruf (kann in einem späteren Schritt kommen).
- Keine Verknüpfung zu Notizen in dieser Ansicht.
- Keine Änderungen an der Webhook-Edge-Function.

Sag Bescheid, ob CSV-Export gleich mit rein soll oder erst später.
