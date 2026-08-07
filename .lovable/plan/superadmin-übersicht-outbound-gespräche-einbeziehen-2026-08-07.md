# Superadmin-Übersicht: Outbound-Gespräche einbeziehen

## Was ich geprüft habe

- `src/pages/superadmin/Overview.tsx` liest ausschließlich `sipgate_calls` (KPI „Anrufe heute", „Letzte Anrufe", „Mitarbeiter live").
- In der Datenbank stehen insgesamt nur **3** Sipgate-Anrufe, davon **0 heute**. Dagegen gibt es **66** erfasste Gespräche in `call_notes`, davon **20 heute** und 54 mit erfasster Dauer.
- Deshalb zeigt die Übersicht faktisch nichts an, obwohl die Outbound-Recruiter täglich Gespräche führen.

## Vorgehen

### 1. KPI-Karten
- „Anrufe heute" wird zur Gesamtzahl aus Inbound (`sipgate_calls`) **plus** Outbound (`call_notes`), inkl. Vergleich zu gestern.
- Darunter eine kleine Aufschlüsselung „x inbound · y outbound".
- Zusätzliche Karte **Ø Gesprächszeit heute** (Mittelwert über Inbound-Dauer und `dauer_sekunden` der Notizen) sowie **Gesamtzeit heute**.

### 2. „Letzte Anrufe"
Zusammengeführte Liste aus beiden Quellen, nach Zeit sortiert:
- Inbound: wie bisher (Kunde, Mitarbeiter, Dauer, Status).
- Outbound: Anrufername/Nummer, Mitarbeiter, Dauer aus der Notiz, Badge „Outbound".
Zeile verlinkt je nach Typ auf `/superadmin/anrufe` bzw. `/superadmin/notizen`.

### 3. „Mitarbeiter live"
Die Zähler pro Mitarbeiter berücksichtigen zusätzlich die heutigen `call_notes` (`employee_id`), damit Outbound-Recruiter nicht mit 0 Calls dastehen.

### 4. „Letzte Aktivitäten"
Ergänzt um die zuletzt erfassten Gesprächsnotizen.

## Technische Details

- Nur Frontend-Änderung in `src/pages/superadmin/Overview.tsx`; keine DB-Migration nötig.
- Wiederverwendung der Helfer aus `src/lib/mitarbeiter-stats.ts` (lokale Tagesgrenzen, `avgPositive`, `sumPositive`, `fmtGesamt`), damit Superadmin- und Mitarbeiter-Panel dieselbe Rechenlogik nutzen.
- Tagesgrenzen konsequent lokal (Berlin) statt UTC.
