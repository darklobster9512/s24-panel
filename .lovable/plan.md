## /superadmin/notizen an Supabase anbinden (Tabellenansicht)

Ziel: `src/pages/superadmin/Notizen.tsx` von Mockdaten auf Live-Daten aus `call_notes` umstellen, als kompakte Tabelle statt Cards, analog zum Stil von `/superadmin/anrufe`.

### 1. Datenabruf

Query in `Notizen.tsx`:
- Select aus `call_notes` mit Joins:
  - `clients (id, company_name, logo_path)` über `client_id`
  - `employees (id, first_name, last_name)` über `employee_id`
- Sortierung `created_at desc`, Limit 500.
- Superadmin-RLS ist bereits vorhanden (Vollzugriff).

### 2. Tabellen-UI

Spalten (Grid-Layout wie in `Anrufe.tsx` / `Abrechnung.tsx`):

| Zeit | Kunde | Mitarbeiter | Anrufer | Anliegen (truncate) | Kategorie | Priorität | Rückruf |

- Zeit: `dd.MM. HH:mm` aus `created_at`
- Kunde: Firmenname (+ kleines Logo optional), sonst „—"
- Mitarbeiter: `first_name last_name` oder „—"
- Anrufer: `anrufer_name` · monospaced `anrufer_nummer`
- Anliegen: 1-zeilig truncate, voller Text via `title`-Tooltip
- Kategorie: Badge (secondary)
- Priorität: Badge (hoch = destructive, normal = outline, niedrig = muted)
- Rückruf: „Ja · {zeit}" Badge wenn `rueckruf_gewuenscht`, sonst „—"

### 3. Filter & Suche

Toolbar über der Tabelle:
- Suche (client-seitig): Anrufer-Name/-Nummer, Anliegen, Kundenname, Mitarbeitername
- Kategorie-Select: Alle / Rückruf / Termin / Info / Beschwerde / Weiterleitung
- Priorität-Select: Alle / hoch / normal / niedrig
- Kunde-Select: aus geladenen Kunden
- Mitarbeiter-Select: aus geladenen Mitarbeitern
- Zeitraum-Select: heute / 7 Tage / 30 Tage / alle

### 4. States

- Ladezustand: „Lädt…"
- Leerer Zustand: „Keine Notizen gefunden."

### 5. Nicht enthalten

- Kein Detail-Drawer / Bearbeitung (später).
- Kein CSV-Export (kann bei Bedarf analog zu Anrufe nachgezogen werden — sag Bescheid).
- Keine Realtime-Subscription.
- Keine Schemaänderung.
