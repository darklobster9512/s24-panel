# Interne Bewerbungsgespräche: nur ab Zuweisung sichtbar

Ziel: Ein Mitarbeiter mit internen Bewerbungsgesprächen sieht ausschließlich Termine, die ab dem Zeitpunkt seiner Freischaltung gebucht wurden. Alles, was vorher entstanden ist, bleibt für ihn unsichtbar.

## 1. Datenbank

- Neue Spalte `employees.internal_interviews_since timestamptz` (nullable).
- Wird gesetzt, sobald die Checkbox „Interne Bewerbungsgespräche“ aktiviert wird (`now()`), und auf `null` zurückgesetzt, wenn sie deaktiviert wird. Eine erneute Aktivierung setzt einen neuen Zeitstempel.
- Umsetzung per Trigger auf `employees`, damit der Zeitstempel unabhängig davon stimmt, wo gespeichert wird.
- Bestehende Mitarbeiter mit aktivem Flag bekommen einmalig `now()` gesetzt, sehen also ab sofort nur noch neue Termine.

## 2. Sichtbarkeit (RLS)

- Die Policies für `interview_appointments` und `applications`, die über `has_internal_interviews()` greifen, werden erweitert: Zugriff nur auf Termine mit `booked_at >= internal_interviews_since` des eingeloggten Mitarbeiters (bei `applications` analog über den zugehörigen Termin).
- Dafür wird eine Security-Definer-Funktion ergänzt, die den Zeitstempel des eingeloggten Mitarbeiters liefert.
- Dadurch ist die Einschränkung serverseitig durchgesetzt, nicht nur in der Oberfläche.

## 3. Oberfläche

- `InterneBewerbungsgespraeche.tsx`: zusätzlicher Filter `booked_at >= internal_interviews_since` in der Abfrage (Anstehend und Vergangen), damit die Liste sauber leer bleibt statt Lücken zu zeigen.
- Keine weiteren UI-Änderungen; der Outbound-Flow und das Superadmin-Panel bleiben unverändert (Superadmin/Manager sehen weiterhin alle Termine).

## Technische Notizen

- Maßgeblich ist der Buchungszeitpunkt (`interview_appointments.booked_at`), nicht das Termindatum – so verschwinden Altbuchungen auch dann, wenn sie in der Zukunft liegen.
