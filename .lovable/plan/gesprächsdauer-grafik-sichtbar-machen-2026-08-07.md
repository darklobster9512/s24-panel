# Gesprächsdauer-Grafik sichtbar machen

## Ziel
Die vorhandenen Gesprächsdauer-Werte auf `/mitarbeiter/statistik` sollen nicht nur im Tooltip, sondern auch als klar erkennbare Grafik sichtbar sein.

## Umsetzung
- Die sehr helle, nur 2 px starke Linie durch eine kontrastreiche Darstellung mit deutlich sichtbarer Linie und Punkten ersetzen.
- Unter der Linie eine dezente Flächenfüllung ergänzen, damit auch einzelne oder niedrige Tageswerte sofort erkennbar sind.
- Die Y-Achse passend zu den vorhandenen Werten skalieren und bei Tagen ohne Dauer echte Lücken statt einer optisch dominierenden Null-Linie darstellen.
- Tooltip und Achsenbeschriftung als lesbare Gesprächsdauer formatieren, während die zugrunde liegenden Sekundenwerte unverändert bleiben.

## Prüfung
- Darstellung mit einzelnen Messwerten, mehreren Tagen und dazwischenliegenden Tagen ohne Dauer prüfen.
- Woche, Monat und Quartal sowie Desktop- und schmale Ansichten kontrollieren.
- Sicherstellen, dass Hover-Werte und KPI-Berechnung unverändert korrekt bleiben.

## Technische Details
Die Anpassung bleibt auf die Recharts-Konfiguration der Gesprächsdauer-Grafik in der Statistikseite beschränkt; Datenbank und Tracking-Logik werden nicht verändert.