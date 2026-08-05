# Fehlende Notizen bei Outbound-Callern (z. B. M. Peters)

## Befund

- In `call_notes` liegt für Markus Peters genau **eine** Zeile: „[Erfolgreich] Recruiting-Anruf erfolgreich“ (05.08., 07:54) — also der Fall **ohne** eingegebenen Notiztext, denn dieser Standardtext wird nur gesetzt, wenn das Feld leer ist.
- Die zweite Notiz (mit Text) fehlt in der Datenbank vollständig.
- In den Datenbank-Logs gibt es **keinen einzigen Fehler** und in den Logs der Caller-Proxy-Funktion ebenfalls nicht. Der Insert wurde also gar nicht erst abgeschickt — er wurde nicht abgelehnt.
- Die Zuweisung stimmt: Peters ist LIMEX Solutions GmbH zugewiesen, die Datenbankregel für das Speichern wäre erfüllt gewesen.
- Die Übertragung an die externe Caller-API hat funktioniert (Notiz und Status sind dort angekommen).

Es liegt also am lokalen Speicherschritt in unserer App, der ausgelassen wurde, ohne dass jemand etwas davon mitbekommen hat.

## Ursache im Code

`persistNoteLocally` in `RecruitmentErfassen.tsx` steigt an drei Stellen **kommentarlos** aus (`return`, kein Fehler):

- kein Kunde geladen (`client?.id` noch leer, z. B. weil die Kundenliste zum Klickzeitpunkt noch lädt)
- keine Benutzersitzung auslesbar
- kein Mitarbeiter-Datensatz gefunden

Zusätzlich läuft der Ablauf in der falschen Reihenfolge: erst externe API, dann lokal speichern. Und selbst wenn der lokale Teil fehlschlägt, erscheint nur eine leise Warnung, während sofort auf die Gesprächsliste weitergeleitet wird — der Notiztext ist damit unwiederbringlich weg.

## Fix

**1. Reihenfolge umdrehen**
Die Notiz wird zuerst lokal in `call_notes` gespeichert, danach das Ergebnis an die externe Caller-API übertragen.

**2. Keine stillen Abbrüche mehr**
Jeder Abbruchgrund wirft einen klaren Fehler mit konkretem Text (kein Kunde geladen / kein Mitarbeiterprofil / Speichern abgelehnt) und wird zusätzlich in der Browser-Konsole protokolliert.

**3. Kunde robust ermitteln**
Statt sich auf den bereits geladenen ersten zugewiesenen Kunden zu verlassen, wird die Kundenzuweisung beim Speichern frisch aus der Datenbank gelesen, falls sie im UI noch nicht vorliegt. Der Speichern-Button bleibt deaktiviert, solange kein Kunde ermittelt werden konnte.

**4. Nichts mehr verlieren**
- Lokales Speichern fehlgeschlagen → deutlicher Fehler-Toast, **keine** Weiterleitung, Notiztext bleibt im Formular stehen.
- Lokal gespeichert, externe Übertragung fehlgeschlagen → Hinweis, dass die Notiz gesichert, das Ergebnis aber nicht übertragen wurde.

**5. Inbound-Pfad gegenprüfen**
`Erfassen.tsx` meldet Insert-Fehler bereits; nur kurz verifizieren, dass dort nichts verschluckt wird.

## Technische Details

- Datei: `src/pages/mitarbeiter/RecruitmentErfassen.tsx`, Funktionen `persistNoteLocally` (Z. 158–201) und `saveAndClose` (Z. 203–228).
- `persistNoteLocally` liefert die neue Notiz-ID zurück; `call-note-notify` wird weiterhin nach erfolgreichem Insert ausgelöst.
- Kunden-Fallback über `assignments` → `client_id` für den eigenen Mitarbeiter-Datensatz.
- Keine Datenbank-Migration nötig.
- Die bereits verlorene Notiz von Herrn Peters lässt sich nicht rekonstruieren und müsste manuell nacherfasst werden.
