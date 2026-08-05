# Warum fehlen Notizen unter /superadmin/notizen?

## Was gesichert ist (aus DB-Abfragen)

- In `call_notes` liegen aktuell **nur 2 Zeilen** (01.08. und 05.08.), jeweils mit Kunde und Mitarbeiter.
- Es fehlt also nicht die Anzeige, sondern die Notizen landen gar nicht erst in der Datenbank.
- Die Superadmin-Ansicht selbst filtert korrekt (Superadmin darf alle Zeilen lesen); Standardfilter ist allerdings „30 Tage“.
- Die Insert-Regel (RLS) verlangt zwei Dinge gleichzeitig: die Notiz gehört dem eingeloggten Mitarbeiter **und** der Kunde ist diesem Mitarbeiter zugewiesen.

## Wahrscheinlichste Ursache (noch nicht bestätigt)

Im Outbound-Recruitment-Flow (`RecruitmentErfassen.tsx`) wird das Ergebnis zuerst an die externe Caller-API geschickt, danach erst lokal gespeichert. Dieser lokale Teil bricht in mehreren Fällen **stillschweigend** ab:

- kein zugewiesener Kunde vorhanden → Funktion steigt ohne Fehler aus
- kein Mitarbeiter-Datensatz gefunden → gleiches Verhalten
- RLS lehnt den Insert ab → nur eine kleine Warnung, der Nutzer sieht trotzdem „Ergebnis gespeichert“

Ergebnis: Der Caller glaubt, die Notiz sei gespeichert, in der Datenbank steht aber nichts. Genau das passt zum Befund „nur 2 Notizen insgesamt“.

## Vorgehen

**Schritt 1 – Ursache bestätigen**
Fehlerausgabe im Speicherpfad ergänzen (Konsole + sichtbarer Fehler-Toast statt stillem Abbruch) und einen echten Speichervorgang nachvollziehen. Erst danach steht fest, ob es an fehlender Kundenzuweisung, fehlendem Mitarbeiterprofil oder an der RLS-Regel liegt.

**Schritt 2 – Speicherpfad robust machen**
- `persistNoteLocally` gibt jeden Abbruchgrund als klaren Fehler zurück, statt leise `return`.
- `saveAndClose` zeigt bei fehlgeschlagenem lokalen Speichern eine deutliche Fehlermeldung inklusive Grund, nicht nur eine Warnung.
- Gleiches Verhalten für den Inbound-Pfad prüfen (dort wird der Fehler bereits angezeigt).

**Schritt 3 – Zuweisungslücke schließen (falls Ursache bestätigt)**
Wenn ein Outbound-Caller keinen zugewiesenen Kunden hat, ist ein Speichern konstruktionsbedingt unmöglich. Dann entweder in `/superadmin/zuweisungen` die fehlende Zuweisung ergänzen oder die Insert-Regel für Outbound-Caller so anpassen, dass der eigene Recruitment-Kunde ausreicht.

**Schritt 4 – Anzeige**
Standard-Zeitraum in `/superadmin/notizen` von „30 Tage“ auf „Alle“ stellen, damit nichts durch den Filter verdeckt wird.

## Technische Details

- Betroffene Dateien: `src/pages/mitarbeiter/RecruitmentErfassen.tsx` (Zeilen 158–228), `src/pages/mitarbeiter/Erfassen.tsx` (Zeilen 217–294), `src/pages/superadmin/Notizen.tsx` (Standardfilter).
- RLS-Policy `Employee inserts own notes` auf `public.call_notes`: `employee.user_id = auth.uid()` UND `is_client_assigned_to_me(client_id)`.
- Eine Migration wird nur nötig, wenn Schritt 3 eine Policy-Anpassung erfordert.
