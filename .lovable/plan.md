# Arbeitszeiten-Seite optisch geradeziehen

Die Wochenansicht quetscht sieben Karten nebeneinander. Jede Karte muss zwei Uhrzeitfelder, ein Löschsymbol, einen Schalter und die Tagessumme aufnehmen – bei sieben Spalten bleiben pro Karte nur rund 150 Pixel. Dadurch überlappen und beschneiden sich die Felder, Beschriftungen brechen um, und die Karten sind unterschiedlich hoch.

## Was sich ändert

Statt sieben schmaler Spalten wird die Woche als **Liste von Tageszeilen** dargestellt – so wie es in Zeiterfassungs-Software üblich ist:

```text
Mo  09.09   [ein/aus]   08:00 – 12:00  [x]        7,0 Std.
                        17:00 – 20:00  [x]
                        + Block
Di  10.09   [ein/aus]   09:00 – 17:00  [x]        8,0 Std.
Sa  13.09   [aus]       frei                        –
```

- Links Wochentag und Datum in fester Breite, danach der Ein/Aus-Schalter, mittig die Zeitblöcke untereinander, rechts die Tagessumme.
- Uhrzeitfelder bekommen eine feste, ausreichende Breite; nichts wird mehr abgeschnitten.
- Freie Tage bleiben als ruhige, flache Zeile stehen statt als leere Karte.
- Auf dem Handy stapelt sich die Zeile: Tag oben, Blöcke darunter, Summe rechts – ohne horizontales Scrollen.
- Fehlerhinweise (Ende vor Start, überlappende Blöcke) erscheinen direkt unter dem betroffenen Block.
- Die Speicherleiste bleibt oben; unveränderte Logik.

Ebenfalls bereinigt:
- Einheitliche Abstände und Trennlinien zwischen den Tagen statt sieben Einzelrahmen.
- Wochenwechsler und Wochenstunden-Badge in einer Zeile mit gleicher Höhe.
- Die Schaltflächen "Mo–Fr übernehmen", "Montag auf alle aktiven Tage", "Alles leeren" werden zu einer kompakten Zeile mit gleich hohen Buttons.

Die Geschäftsführungs-Ansicht bleibt inhaltlich gleich, bekommt aber gleiche Zellenhöhen und saubere Ausrichtung der Blöcke.

## Technische Umsetzung

- `src/components/arbeitszeiten/DayCard.tsx` wird zu `DayRow`: horizontales Grid (`grid-cols-[7rem_auto_1fr_5rem]` ab `md`, gestapelt darunter), feste `w-[7.5rem]` für die Zeitfelder, `min-w-0` auf allen Flex-Kindern.
- `src/pages/mitarbeiter/Arbeitszeiten.tsx`: `WeekGrid` wird zu einer `divide-y`-Liste in einem einzigen Rahmen; keine `xl:grid-cols-7`-Kacheln mehr. Speichern-, Wochen- und Zurücksetz-Logik unverändert.
- `src/pages/superadmin/Arbeitszeiten.tsx`: nur Ausrichtung/Abstände der Blocklisten.
- Keine Datenbank-, Rechte- oder Datenmodell-Änderung.
