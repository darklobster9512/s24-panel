# Statistik: Ø Gesprächsdauer Label anpassen

## Problem
Das Panel bei `/mitarbeiter/statistik` heißt aktuell **„Ø Gesprächsdauer (Sek)"**.
Die Werte werden dort aber über `fmtDauer` als `m:ss` (Minuten:Sekunden) formatiert
und die Y-Achse bzw. Tooltips zeigen likewise Minuten-basierte Anzeigen.
Das Label **(Sek)** ist daher irreführend.

## Änderung
In `src/pages/mitarbeiter/Statistik.tsx` (Zeile 339) den Panel-Titel umbenennen:

- alt: `Ø Gesprächsdauer (Sek)`
- neu: `Ø Gesprächsdauer (Min)`

Keine weiteren Anpassungen nötig — die Anzeige der Werte bleibt unverändert
(sie war bereits korrekt im Minuten-Format).
