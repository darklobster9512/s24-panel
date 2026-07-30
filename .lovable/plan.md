## Ziel
Auf der Detailseite eines Bewerbungsgesprächs ein **Startdatum** erfassen (Kalender, manuelle Eingabe oder „Ab sofort“) und es in der Terminliste zwischen Ranking und Status anzeigen.

## Datenbank
Migration auf `interview_appointments`:
- `start_date` (date, nullable)
- `start_asap` (boolean, default false) — für „Ab sofort“

## Detailseite (`BewerbungsgespraechDetail.tsx`)
Neues Panel „Startdatum“ direkt über „Gesprächsnotizen“:
- Textfeld mit Format `TT.MM.JJJJ` (freie Eingabe, wird geparst und validiert)
- Kalender-Button (Popover mit shadcn Calendar, deutsche Lokalisierung)
- Checkbox/Toggle „Ab sofort“ — deaktiviert die Datumsauswahl
- Speichern-Button; Eintrag wird zusätzlich im Aktivitätsprotokoll vermerkt („Startdatum geändert“)

## Terminliste (`Bewerbungsgespraeche.tsx`)
- `start_date`, `start_asap` mitladen
- Neue Spalte **Startdatum** zwischen Ranking und Status; Grid-Spaltenbreiten anpassen
- Anzeige: „Ab sofort“, `01.08.2026` oder `—`

## Technisch
- Parsing über `date-fns` (`parse`/`format`, `de` Locale)
- Calendar im Popover mit `pointer-events-auto`
- Nur Frontend + eine Migration, keine Änderung an Edge Functions
