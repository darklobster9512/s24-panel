# Arbeitszeiten für Mitarbeiter

Neuer Bereich, in dem Mitarbeiter ihre Arbeitszeiten selbst planen und jederzeit bearbeiten können. Der Superadmin erhält eine Wochenkalender-Ansicht über alle Mitarbeiter.

## Mitarbeiter: "Meine Arbeitszeiten" (/mitarbeiter/arbeitszeiten)

Neuer Reiter in der Seitenleiste unter "Persönlich".

**Standardplan (gilt fortlaufend)**
- Modus A: Jeden Tag gleich — eine Von/Bis-Zeit plus Auswahl der Arbeitstage (Mo–So).
- Modus B: Pro Tag unterschiedlich — für jeden Wochentag eigene Von/Bis-Zeit, Tage einzeln abwählbar.
- Anzeige der Gesamtstunden pro Woche.

**Einzelne Wochen abweichend planen**
- Wochenauswahl (Kalenderwoche vor/zurück, Datumsbereich sichtbar).
- Standardmäßig zeigt jede Woche den Standardplan.
- Button "Diese Woche abweichend planen" erzeugt eine Kopie, die frei bearbeitet wird und nur für diese Woche gilt.
- Button "Auf Standard zurücksetzen" entfernt die Abweichung wieder.
- Vergangene Wochen sind sichtbar, aber nicht mehr bearbeitbar.

Speichern wirkt sofort, keine Freigabe nötig. Keine Pausenerfassung, kein Abgleich mit dem Vertrag.

## Superadmin: "Arbeitszeiten" (/superadmin/arbeitszeiten)

Neuer Reiter in der Seitenleiste.
- Wochenkalender: Zeilen = Mitarbeiter, Spalten = Mo–So, Zellen zeigen Von–Bis oder "frei".
- Woche vor/zurück, Sprung zur aktuellen Woche.
- Suche nach Mitarbeitername.
- Kennzeichnung, ob eine Woche vom Standardplan abweicht.
- Wochenstunden je Mitarbeiter als Summenspalte.
- Nur Ansicht, keine Bearbeitung.

## Technische Umsetzung

Zwei neue Tabellen:

- `work_schedules` — Standardplan pro Mitarbeiter: `employee_id` (unique), `mode` ('uniform' | 'per_day'), `days` (jsonb: pro Wochentag aktiv/start/end).
- `work_schedule_weeks` — Wochenabweichungen: `employee_id`, `week_start` (Montag, unique je Mitarbeiter), `days` (jsonb, gleiche Struktur).

Beide mit `created_at`/`updated_at` und `update_updated_at_column`-Trigger, GRANTs für `authenticated` und `service_role`, RLS:
- Mitarbeiter dürfen ausschließlich eigene Zeilen lesen/anlegen/ändern/löschen (über `is_my_employee_row`).
- Superadmin und Manager dürfen alle Zeilen lesen (über `has_role`).

Frontend:
- `src/pages/mitarbeiter/Arbeitszeiten.tsx`, `src/pages/superadmin/Arbeitszeiten.tsx`
- Hilfsmodul `src/lib/work-schedule.ts` für Wochenstart (Montag, Europe/Berlin), Stundenberechnung und Zusammenführen von Standardplan und Wochenabweichung.
- Routen in `src/App.tsx`, Einträge in beiden Sidebars.
