# Spalte "Stelle" hinter "Anstellung" verschieben

## Ausgangslage
In der Bewerbungsliste unter `/superadmin/bewerbungen` befindet sich die Spalte "Stelle" aktuell zwischen "Name" und "E-Mail". Sie soll direkt nach "Anstellung" erscheinen.

## Änderung
- Spalten-Reihenfolge in der Tabelle anpassen auf:
  Eingegangen → Name → E-Mail → Telefon → Anstellung → Stelle → Geburtsdatum → Staatsang. → Status → Ranking → Lebenslauf.
- Leerer Wert weiterhin als "—", lange Texte weiterhin abgeschnitten.
- Keine Änderung an Spaltenbreiten, Suchlogik oder Detailansicht.

## Technisch
`src/pages/superadmin/Bewerbungen.tsx`: In Header- und Zeilen-`grid` das `span`/`span`-Element für "Stelle" von Position 3 auf Position 6 (nach "Anstellung") verschieben. Beide `grid-cols` bleiben identisch.
