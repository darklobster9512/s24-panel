# Erinnerung-Button entfernen & Mailbox-Button gelb

## Änderungen

1. `/mitarbeiter/bewerbungsgespraeche`
   - Den Icon-Button "Erinnerung senden" (Glocken-Icon) aus der Aktionsspalte entfernen.
   - Die zugehörige `send_reminder`-Logik in `runAction` entfernen, sodass nur noch `send_panel_link` bleibt; ungenutzte Imports (BellRing) aufräumen.

2. `/mitarbeiter/erfassen` (Outbound Caller)
   - Der Mailbox-Button wird im ausgewählten Zustand gelb dargestellt (gelber Hintergrund, dunkler Text, passender Hover-Zustand) statt der aktuellen neutralen "secondary"-Variante.
   - Nicht ausgewählt bleibt er wie bisher als Outline-Button.

## Technische Details
- Datei `src/pages/mitarbeiter/Bewerbungsgespraeche.tsx`: Button-Block und `send_reminder`-Zweig löschen, Action-Typ auf `"send_panel_link"` reduzieren.
- Datei `src/pages/mitarbeiter/RecruitmentErfassen.tsx`: Mailbox-Button erhält bei `outcome === "mailbox"` eine gelbe Klassen-Variante; Farbe wird als Semantik-Klasse (Amber-Token) gesetzt, um Konsistenz mit dem Theme zu wahren.
