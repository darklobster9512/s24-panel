# /superadmin Übersicht an Supabase anbinden

`src/pages/superadmin/Overview.tsx` von Mock-Daten auf Live-Queries umstellen.

## KPI-Karten (oben)

- **Kunden**: Count aus `clients` (ohne Drafts, `is_draft = false`). Delta = neu in den letzten 7 Tagen (via `created_at`).
- **Mitarbeiter**: Count aus `employees`. Delta = neu in den letzten 30 Tagen.
- **Anrufe heute**: Count aus `sipgate_calls` mit `started_at >= today`. Delta = % vs. gestern.
- **Offene Tickets**: Vorerst ausblenden oder auf 0 setzen, da noch keine Tickets-Tabelle existiert (falls doch vorhanden, prüfen und anbinden — sonst Karte entfernen).
- **Offene Auszahlungen**: Ebenfalls keine Tabelle vorhanden → Karte entfernen (oder auf statischen „—" Zustand).

## Letzte Anrufe

- Query auf `sipgate_calls` mit Join auf `clients` (Name) und `employees` (Vorname + Nachname), sortiert nach `started_at desc`, Limit 6.
- Spalten: Uhrzeit (HH:MM), Kunde, Mitarbeiter, Dauer (aus `duration_seconds` bzw. `ended_at - started_at`), Status-Badge (beendet/verpasst/laufend).

## Mitarbeiter live

- Alle `employees` mit letztem Anruf/Status aus `sipgate_calls`:
  - „Im Gespräch" wenn ein laufender Call (`ended_at is null`) existiert.
  - Sonst „Verfügbar".
  - `calls` = Anzahl Anrufe heute pro Mitarbeiter.
- Limit auf ~8 Einträge, sortiert nach Anrufen heute desc.

## System-Ereignisse & Umsatz-Chart

- **System-Ereignisse**: Ersetzen durch echte Recent-Activity: letzte angelegte Kunden/Mitarbeiter/abgeschlossene Verträge (jeweils 1–2 Einträge, gemischt und nach Zeit sortiert). Alternativ Panel entfernen, wenn zu aufwändig — Vorschlag: behalten mit Recent Activity.
- **Umsatz-Chart**: Keine Umsatzdaten in der DB vorhanden → Panel entfernen.

## Technisches

- Alle Daten via React Query parallel laden (`useQueries` oder mehrere `useQuery` Hooks).
- Loader-States mit `Loader2` Spinner in den einzelnen Panels.
- Deutsche Datums-/Zeitformatierung (`de-DE`).
- Keine DB-/Schema-Änderungen nötig.

## Offene Frage

Sollen die Panels „Offene Tickets", „Offene Auszahlungen" und „Umsatz (12 Monate)" **entfernt** werden (da keine Datenquelle), oder als Platzhalter mit „—" stehen bleiben? Vorschlag: entfernen, damit die Übersicht nur echte Daten zeigt.
