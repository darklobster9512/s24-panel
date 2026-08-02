## Ziel
Bei `/mitarbeiter/erfassen?interview=…` (Recruiting-Anruf) soll beim Scrollen nur die linke Spalte (Bewerber, Kunde, Call-Skript) laufen. Der obere Bereich – App-Header und der Seitentitel „Recruiting-Anruf“ – bleibt stehen, ebenso die rechte Spalte.

## Aktueller Stand
- Der App-Header in `src/components/mitarbeiter/MitarbeiterLayout.tsx` ist bereits `sticky top-0 z-30` (bleibt also schon stehen).
- Der Seitentitel kommt aus `PageHeader` und scrollt aktuell mit weg.
- Die rechte Spalte in `src/pages/mitarbeiter/RecruitmentErfassen.tsx` ist bereits `lg:sticky lg:top-6`, klebt aber zu weit oben, weil sie den Header nicht berücksichtigt.

## Umsetzung (nur `src/pages/mitarbeiter/RecruitmentErfassen.tsx`)
1. Den `PageHeader`-Block der Recruiting-Ansicht in einen sticky Container wickeln: `sticky top-14 z-20` mit deckendem Hintergrund (`bg-surface`, leichter Blur + untere Trennlinie), damit darunter scrollende Karten nicht durchscheinen. Negative horizontale Margins + Padding, damit der Hintergrund die volle Breite des Content-Bereichs abdeckt.
2. Das Sticky-Offset der rechten Spalte von `lg:top-6` auf einen Wert unterhalb von App-Header + Titelzeile anpassen (ca. `lg:top-36`), damit sie beim Scrollen nicht unter den Titel rutscht.
3. Nur die Recruiting-Variante anpassen – die normale Inbound-Erfassung (`Erfassen.tsx`) bleibt unverändert.

## Hinweis
Das Sticky-Verhalten funktioniert, weil der Scroll-Container die Seite selbst ist; es sind keine Änderungen am Layout-Wrapper nötig.