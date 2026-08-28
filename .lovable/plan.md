# Interne Bewerbungsgespräche: Sichtbarkeit nach Termin statt Buchungszeit

## Warum Julian nichts sieht

Julian (`julian@sekretariat-24.de`) hat `internal_interviews = true`, Zuweisung seit **28.08.2026, 17:04 UTC**.

Die aktuelle Regel filtert nach dem **Buchungszeitpunkt** (`booked_at`): nur Gespräche, die *nach* seiner Zuweisung gebucht wurden. Alle vorhandenen Termine wurden zwischen 14:57 und 15:46 gebucht — also vor 17:04. Ergebnis: leere Liste, obwohl acht Termine am 31.08. und 01.09. in der Zukunft liegen.

## Gewünschtes Verhalten

Maßgeblich ist der **Termin selbst**, nicht wann gebucht wurde: sichtbar sind alle Gespräche, deren Termin (Datum + Uhrzeit) nach dem Zuweisungszeitpunkt liegt — egal wann sie gebucht wurden. Vergangene Gespräche, die vor der Zuweisung stattfanden, bleiben unsichtbar.

Mit dieser Regel sieht Julian sofort die acht Termine vom 31.08. und 01.09.

## Umsetzung

1. **Datenbank (Migration)**: Die Zugriffsregeln für `interview_appointments` und `applications` (Ansehen und Bearbeiten durch interne Interviewer) vergleichen künftig `appointment_date + appointment_time` mit dem Zuweisungszeitpunkt statt `booked_at`.
2. **Frontend** (`src/pages/mitarbeiter/InterneBewerbungsgespraeche.tsx`): Der clientseitige Zusatzfilter `gte("booked_at", since)` wird durch einen Terminfilter ersetzt — Termine ab dem Zuweisungsdatum.
3. **Reiter „Vergangen“**: zeigt dann Gespräche zwischen Zuweisungszeitpunkt und heute (aktuell also leer, füllt sich ab dem 31.08. automatisch).

## Technische Details

- Vergleich per `(appointment_date + appointment_time) >= internal_interviews_since()` in den RLS-Policies (Sekundengenau; bei gleichem Tag zählt die Uhrzeit).
- `public.internal_interviews_since()` und `has_internal_interviews()` bleiben unverändert.
- Keine Änderung an `employees.internal_interviews_since` oder am Trigger.
