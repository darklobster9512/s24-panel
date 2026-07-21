## Ziel
`/mitarbeiter/statistik` mit echten Daten aus `call_notes` und `sipgate_calls` befüllen, gefiltert auf den eingeloggten Mitarbeiter (`employee_id` bzw. `handled_by_employee_id`). Zeitraum-Umschalter (Woche/Monat/Quartal) wirkt live.

## Datenquellen
- **KPIs & Charts basierend auf Anrufen**: `sipgate_calls` gefiltert per `handled_by_employee_id = mein employee.id`, im gewählten Zeitraum (`started_at >=` Start).
  - Anrufe gesamt: Count
  - Ø Dauer: Durchschnitt aus `ended_at - answered_at` (nur answered)
  - Anrufe pro Tag (Bar): Gruppierung nach Tag im Zeitraum
  - Ø Dauer pro Tag (Line): Durchschnitt pro Tag
- **Notizen & Kategorien**: `call_notes` gefiltert per `employee_id = mein employee.id`.
  - Notizen-KPI: Count im Zeitraum
  - Verteilung nach Kategorie (Pie): group by `kategorie`
  - Anrufe pro Kunde (Bar): Count `call_notes` group by `client_id`, join Kundenname aus `clients`

## Delta-Werte (KPI-Karten)
Vergleich mit vorheriger, gleichlanger Periode (z. B. letzte Woche vs. vorletzte). Anzeige als „+12 %" bzw. „-8s" analog aktuell. Wenn keine Vorperiodendaten vorhanden → kein Delta.

## Zeitraum-Logik
- **Woche**: letzte 7 Tage, Tages-Buckets (Mo–So)
- **Monat**: letzte 30 Tage, Tages-Buckets
- **Quartal**: letzte 90 Tage, Wochen-Buckets

## Umsetzung
- `src/pages/mitarbeiter/Statistik.tsx`: State + `useEffect`, lädt bei Änderung von `tf` frisch. Eigene `employees.id` per `user_id = auth.uid()` einmalig auflösen.
- Ladezustand: Skeleton-Cards und Chart-Placeholder.
- Leerzustand: Panels zeigen dezenten Hinweis „Noch keine Daten in diesem Zeitraum".
- Keine neue Tabelle, keine Migration nötig — RLS-Policies existieren bereits (Mitarbeiter sieht eigene `call_notes` und über `handled_by_employee_id` seine `sipgate_calls`).

## Nicht enthalten
- Kein CSV-Export, keine Filter über Zeitraum-Buttons hinaus.
- Keine Änderung an der Superadmin-Statistikansicht.
