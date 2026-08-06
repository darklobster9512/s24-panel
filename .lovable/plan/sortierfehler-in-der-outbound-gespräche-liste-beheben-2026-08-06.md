# Sortierfehler in der Outbound-Gespräche-Liste beheben

## Problem

Die Ansicht "Anstehend" setzt sich aus zwei getrennten Abfragen der externen Caller-API zusammen: `view=default` (heute/morgen) und `view=future` (ab übermorgen). Beide werden mit derselben Seitenzahl abgefragt und erst danach zusammengeführt und sortiert.

Dadurch enthält Seite 1 nur die ersten 25 Einträge aus "heute/morgen" plus die ersten 25 aus "ab übermorgen". Wenn heute mehr als 25 Termine hat, rutschen die Termine von morgen (07.08.) auf Seite 2 — obwohl auf Seite 1 bereits spätere Termine (08.08. und danach) stehen. Die Sortierung wirkt nur innerhalb einer Seite, nicht über die gesamte Liste.

## Lösung

Die Zusammenführung erfolgt künftig vollständig, bevor paginiert wird:

- Alle Seiten beider Ansichten ("default" und "future") werden nacheinander geladen, bis die jeweilige Gesamtanzahl erreicht ist (mit einer Sicherheitsgrenze, damit keine Endlosschleife entsteht).
- Die vollständige Liste wird nach Datum und Uhrzeit sortiert.
- Erst danach wird clientseitig auf Seiten à 25 Einträge aufgeteilt; `total` ist die tatsächliche Gesamtzahl.

Ergebnis: Termine von heute und morgen stehen immer vor den späteren Terminen, Seite 1 beginnt korrekt mit dem nächsten anstehenden Termin.

## Technische Umsetzung

- `src/hooks/use-caller-api.ts`: `listUpcomingInterviews` lädt beide Ansichten seitenweise komplett (Hilfsfunktion `fetchAllPages(view, search, employeeId)`), sortiert das Ergebnis global und liefert den angeforderten Ausschnitt (`page`, `pageSize = 25`) zurück.
- Keine Änderungen am Proxy oder an der Datenbank nötig. Die Korrektur wirkt automatisch sowohl in `/superadmin/outbound-gespraeche` als auch in `/mitarbeiter/bewerbungsgespraeche`, da beide dieselbe Funktion nutzen.
