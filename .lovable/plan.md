# Arbeitszeiten: geteilte Schichten und übersichtlichere Oberfläche

## Ziel
Mitarbeitende können pro Tag mehrere Zeitblöcke eintragen (z. B. 08:00–12:00 und 17:00–20:00), und die Seite wirkt aufgeräumt und professionell statt wie eine lange Schalterliste.

## Was sich für Mitarbeitende ändert
- Jeder Tag kann mehrere Zeitblöcke haben. Über "+ Block" kommt ein weiterer Abschnitt dazu, über das Papierkorb-Symbol verschwindet er wieder.
- Pro Tag steht rechts die Tagessumme (z. B. "7 Std."), oben die Wochensumme.
- Statt einer Liste mit Schaltern gibt es eine Wochenübersicht aus sieben Karten (Mo–So nebeneinander auf großen Bildschirmen, untereinander auf dem Handy). Freie Tage sind ruhig dargestellt, Arbeitstage zeigen ihre Blöcke.
- Zwei klare Bereiche bleiben erhalten, aber besser beschriftet:
  - "Standardplan" – gilt dauerhaft für jede Woche.
  - "Einzelne Woche" – Abweichung für eine bestimmte Woche, mit Wochenwechsler, Hinweis "folgt dem Standardplan" bzw. "abweichend geplant".
- Schnellaktionen im Standardplan: "Mo–Fr übernehmen", "Zeiten von Montag auf alle aktiven Tage kopieren", "Alles leeren". Der bisherige Modus "jeden Tag gleich / pro Tag unterschiedlich" entfällt, weil Kopieren dasselbe einfacher löst.
- Warnungen direkt am Tag: Endzeit vor Startzeit, Blöcke die sich überschneiden. Speichern ist dann blockiert.
- Ungespeicherte Änderungen werden oben in einer schmalen Leiste mit "Speichern"/"Verwerfen" angezeigt, statt eines Buttons ganz unten.

## Was sich für die Geschäftsführung ändert
Die Superadmin-Ansicht "Arbeitszeiten" zeigt pro Tag alle Blöcke untereinander statt nur eine Von-Bis-Zeit; Wochensummen bleiben.

## Technische Umsetzung
- Datenmodell: `days` bleibt jsonb, pro Tag künftig `{ active: boolean, segments: [{ start, end }] }`. `src/lib/work-schedule.ts` normalisiert alte Einträge (`start`/`end`) beim Lesen automatisch in einen einzelnen Block, deshalb ist keine Migration nötig; beim nächsten Speichern wird das neue Format geschrieben. Zusätzlich wird beim Schreiben `start`/`end` des ersten Blocks mitgespeichert, damit ältere Leser nichts kaputt machen.
- Neue Helfer in `work-schedule.ts`: `dayMinutes` summiert alle Blöcke, `validateDay` liefert Überschneidungs- und Reihenfolgefehler, `copyDay`, `emptySegment`.
- Neue Komponente `src/components/arbeitszeiten/DayCard.tsx` für eine Tageskarte inkl. Blockliste, verwendet in Standardplan und Wochenansicht.
- `src/pages/mitarbeiter/Arbeitszeiten.tsx` wird auf die Kartenansicht plus Aktionsleiste umgebaut; Speicher-, Wochen- und Zurücksetzen-Logik bleibt inhaltlich gleich.
- `src/pages/superadmin/Arbeitszeiten.tsx` rendert je Zelle die Blockliste.
- Kein Datenbank- oder Rechte-Änderungsbedarf.
