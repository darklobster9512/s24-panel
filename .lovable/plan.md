## Diagnose (verifiziert)

In `src/pages/mitarbeiter/RecruitmentErfassen.tsx` schreibt `saveAndClose()` die Notiz **ausschließlich** an die externe Caller-API (`set_status` mit `note`). Es findet kein Insert in die Tabelle `public.call_notes` statt.

`src/pages/mitarbeiter/Notizen.tsx` liest aber genau aus `call_notes`. Deshalb erscheint die Notiz im anderen Backend, aber nicht unter `/mitarbeiter/notizen`.

## Umsetzung

**`src/pages/mitarbeiter/RecruitmentErfassen.tsx`**
- Nach dem erfolgreichen `set_status`-Aufruf zusätzlich einen Datensatz in `call_notes` anlegen:
  - `client_id`: der zugewiesene Recruitment-Kunde (bereits als `client` vorhanden)
  - `employee_id`: über `employees.user_id = auth.uid()` ermitteln
  - `anliegen`: Gesprächsnotiz; falls leer bei „erfolgreich", ein kurzer Standardtext wie „Recruiting-Anruf erfolgreich"
  - `anrufer_name` / `anrufer_nummer` / `anrufer_email`: Name, Telefon und E-Mail des Bewerbers aus dem geladenen Termin
  - `kategorie`: `"Termin"`, `prioritaet`: `"normal"`, `dauer_sekunden`: gestoppte Gesprächsdauer
- Der Insert läuft nach dem API-Call; schlägt nur der lokale Insert fehl, wird eine Warnung getoastet, die Navigation aber nicht blockiert (die externe Übertragung ist bereits erfolgt).
- React-Query-Cache `["mitarbeiter-notes"]` invalidieren, damit die Notiz sofort sichtbar ist.

**`src/pages/mitarbeiter/Notizen.tsx`**
- Ergebnis-Kennzeichnung sichtbar machen: bei Recruitment-Notizen wird das Ergebnis („Erfolgreich"/„Fehlgeschlagen") mit im Text bzw. als Badge über `kategorie` dargestellt — keine Strukturänderung nötig.

## Technische Details
- Keine Schema-Änderung: `call_notes` hat bereits alle benötigten Spalten; die bestehenden RLS-Policies erlauben dem Mitarbeiter Insert/Select für zugewiesene Kunden.
- Bestehende, bereits abgeschickte Recruitment-Notizen liegen nur upstream und lassen sich nicht rückwirkend importieren.
