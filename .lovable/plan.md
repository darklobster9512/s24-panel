## Problem

Datumswerte aus der Datenbank (`start_date`, `birth_date`) sind ISO-Strings (`2026-08-05`). Der Platzhalter-Renderer `src/lib/render-contract.ts` setzt sie unverändert in den Vertragstext ein — daher „beginnt am 2026-08-05“.

## Lösung

In `src/lib/render-contract.ts` eine kleine Hilfsfunktion `formatDate(v)` ergänzen:
- Erkennt ISO-Datumswerte (`YYYY-MM-DD`, optional mit Zeitanteil)
- Gibt sie als `TT.MM.JJJJ` aus
- Alles andere (bereits formatierte Werte, leer/null) bleibt unverändert bzw. fällt auf `____________` zurück

Angewendet auf `startdatum` und `geburtsdatum` in der Platzhalter-Map. `heutiges_datum` ist bereits korrekt in `de-DE`.

## Wirkung

Greift automatisch überall, wo Verträge gerendert werden: Vorschau und PDF im Superadmin-Detail (`ArbeitsvertragDetail.tsx`) sowie die Mitarbeiter-Ansicht — kein zusätzlicher Eingriff nötig, da alle denselben Renderer nutzen.
