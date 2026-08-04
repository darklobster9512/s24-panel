# Spalte "Stelle" in der Bewerbungsliste

## Ausgangslage
Die Stelle wird bereits gespeichert, gesucht und in der Detailansicht angezeigt — in der Listenansicht unter `/superadmin/bewerbungen` fehlt sie aber als eigene Spalte.

## Änderung
- Neue Spalte "Stelle" in der Tabelle, direkt nach "Name" (vor E-Mail).
- Leerer Wert wird als "—" dargestellt, lange Texte werden abgeschnitten.
- Restliche Spaltenbreiten leicht angepasst, damit die Zeile weiterhin ins Layout passt.

## Technisch
`src/pages/superadmin/Bewerbungen.tsx`: Grid-Template in Header- und Zeilen-`div` um eine Spalte (`160px`) erweitern, Header-Label "Stelle" ergänzen, in der Zeile `{r.stelle ?? "—"}` mit `truncate text-muted-foreground` rendern.
