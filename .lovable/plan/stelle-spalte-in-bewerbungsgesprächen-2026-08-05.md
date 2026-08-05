# Stelle-Spalte in Bewerbungsgesprächen

## Ziel
In `/superadmin/bewerbungsgespraeche` wird die Stelle des Bewerbers in der Tabelle angezeigt – direkt hinter der Spalte „Anstellung“, analog zur Bewerbungsliste.

## Umsetzung
- Die verschachtelte `applications`-Abfrage um das Feld `stelle` erweitern.
- Den lokalen Bewerbungstyp um `stelle: string | null` ergänzen.
- In Header und Tabellenzeilen eine „Stelle“-Spalte direkt nach „Anstellung“ einfügen.
- Leere Stellen als „—“ anzeigen und lange Werte mit `truncate` sauber abschneiden.
- Das bestehende Tabellenlayout, Suchverhalten, Ranking, Status und Aktionen unverändert lassen; nur die Grid-Spalten um die neue Spalte erweitern.

## Technische Details
Änderung ausschließlich in `src/pages/superadmin/Bewerbungsgespraeche.tsx`. Die Daten stammen aus `applications.stelle`, die bereits für Bewerbungen vorgesehen ist.