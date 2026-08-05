# Fehlende Notizen bei Outbound-Callern (z. B. M. Peters)

## Befund

- In `call_notes` liegt für Markus Peters genau **eine** Zeile: „[Erfolgreich] Recruiting-Anruf erfolgreich“ (05.08., 07:54) — das ist exakt der Fall **ohne** eingegebenen Notiztext, denn dieser Standardtext wird nur gesetzt, wenn das Feld leer ist.
- Die zweite Notiz (mit Text) fehlt in der Datenbank vollständig.
- In den Logs der Caller-Proxy-Funktion ist kein Fehler protokolliert, daher ist der genaue Abbruchgrund noch nicht belegt.

## Ursache im Speicherablauf

In `RecruitmentErfassen.tsx` läuft „Ergebnis speichern“ in dieser Reihenfolge:

1. Ergebnis + Notiztext an die externe Caller-API senden
2. erst danach die Notiz lokal in `call_notes` schreiben

Daraus ergeben sich zwei Lücken:

- Schlägt Schritt 1 fehl (z. B. weil der Notiztext mitgeschickt wird und die externe API ihn ablehnt), wird Schritt 2 **nie ausgeführt** — die Notiz ist weg.
- Schlägt Schritt 2 fehl, bricht die Funktion an mehreren Stellen still ab (kein Kunde, kein Mitarbeiterprofil) bzw. zeigt nur eine kleine Warnung, während „Ergebnis gespeichert“ erscheint.

Genau dieses Muster passt zum Befund: der Durchlauf ohne Notiztext ging durch, der mit Notiztext nicht.

## Fix

**1. Reihenfolge umdrehen**
Die Notiz wird **zuerst** lokal in `call_notes` gespeichert, danach das Ergebnis an die externe Caller-API übertragen. Damit geht kein Notiztext mehr verloren, wenn die externe API zickt.

**2. Keine stillen Abbrüche mehr**
`persistNoteLocally` wirft bei jedem Abbruchgrund einen klaren Fehler statt leise auszusteigen:
- kein zugewiesener Kunde
- kein Mitarbeiter-Datensatz
- abgelehnter Insert (Datenbankregel)

**3. Ehrliche Rückmeldung im UI**
- Lokales Speichern fehlgeschlagen → deutlicher Fehler-Toast mit Grund, kein Weiterleiten, damit der Caller den Text nicht verliert.
- Externe Übertragung fehlgeschlagen, Notiz aber lokal gespeichert → Hinweis-Toast, dass die Notiz gesichert ist, das Ergebnis aber nicht übertragen wurde.

**4. Inbound-Pfad prüfen**
`Erfassen.tsx` zeigt Insert-Fehler bereits an; hier nur gegenprüfen, dass ebenfalls nichts stillschweigend verschluckt wird.

## Technische Details

- Datei: `src/pages/mitarbeiter/RecruitmentErfassen.tsx`, Funktionen `persistNoteLocally` (Z. 158–201) und `saveAndClose` (Z. 203–228).
- Rückgabewert von `persistNoteLocally` wird die Notiz-ID, damit `call-note-notify` weiterhin nach erfolgreichem Insert ausgelöst wird.
- Keine Datenbank-Migration nötig; die bestehende Insert-Regel (Mitarbeiter + zugewiesener Kunde) bleibt unverändert, ihre Verletzung wird künftig nur sichtbar gemacht.
- Die bereits verlorene Notiz von Herrn Peters lässt sich nicht rekonstruieren; sie kann bei Bedarf manuell nacherfasst werden.
