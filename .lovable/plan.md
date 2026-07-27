## Ziel

`/superadmin/bewerbungsgespraeche` zeigt Termine chronologisch (nächster oben) und jeder Termin öffnet eine Detailseite mit allen Bewerbungsdaten inkl. eingebettetem Lebenslauf.

## 1. Liste als Kalender

- Sortierung bleibt aufsteigend nach Datum + Uhrzeit, in der Ansicht „Anstehend" steht damit der nächste Termin ganz oben (in „Vergangen" absteigend, damit das zuletzt Gewesene oben steht).
- Zeilen werden klickbar (Cursor, Hover-Highlight); Klick öffnet die Detailseite. Die Buttons rechts (Erfolgreich / Fehlgeschlagen / Löschen) und das Status-Dropdown lösen den Klick nicht mit aus.
- Optionale Gruppierung nach Datum mit kleinem Datums-Header („Heute", „Morgen", sonst Datum) für Kalender-Gefühl.

## 2. Neue Detailseite

Neue Route `/superadmin/bewerbungsgespraeche/:id` (neue Datei `src/pages/superadmin/BewerbungsgespraechDetail.tsx`, Route in `src/App.tsx`).

Inhalt:
- Kopf: Name, Termin (Datum, Uhrzeit, Wochentag), Status-Auswahl, Zurück-Button, Buttons „Erfolgreich" / „Fehlgeschlagen" / „Abgesagt".
- Linke Spalte – alle Bewerbungsdaten aus `applications`: Vorname, Nachname, E-Mail (klickbar), Handynummer (klickbar), Geburtsdatum (+ berechnetes Alter), Staatsangehörigkeit, gewünschte Anstellung, Ranking, Bewerbungsstatus, Eingang der Bewerbung, Buchungszeitpunkt des Termins.
- Notizfeld zum Termin (`interview_appointments.notes`) mit Speichern.
- Rechte Spalte – Lebenslauf direkt eingebettet: Signed URL über `supabase.storage.from("applications").createSignedUrl(...)`, Anzeige als `<iframe>` bei PDF bzw. `<img>` bei Bildern, dazu Buttons „In neuem Tab öffnen" und „Download". Fallback-Hinweis, wenn kein Lebenslauf hinterlegt ist.

## Technische Hinweise

- Daten werden per Einzel-Query geladen: `interview_appointments` gefiltert auf `id`, mit eingebetteter `applications`-Relation (alle Felder). Bestehende RLS für Superadmin greift unverändert; keine Migration nötig.
- Statuswechsel und Notizen per Update auf `interview_appointments` — gleiche Logik wie in der Liste.
- Signed URL läuft nach 10 Minuten ab und wird beim Laden der Seite neu erzeugt.
- Keine Änderungen an Edge Functions oder Datenbankschema.
