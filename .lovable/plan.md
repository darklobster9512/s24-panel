## Ziel
Aus den vorhandenen Gesprächsnotizen das Startdatum bzw. „Ab sofort“ ableiten und in `interview_appointments` (`start_date`, `start_asap`) eintragen. Reine Datenaktualisierung, keine Code-Änderung.

## Vorgeschlagene Zuordnung

| Bewerber | Notiz-Hinweis | Eintrag |
|---|---|---|
| Markus Oldach Peters | „Sofort startbereit“ | Ab sofort |
| Denise Sabrowski | „schnell einsatzbereit“ | Ab sofort |
| Beate Gräßer | „sofort einsetzbar“ | Ab sofort (bereits gesetzt) |
| Theresa Schlefsky | „sofort einstellbar“ | Ab sofort |
| Erij Aghabra | „sofort startbereit“ | Ab sofort (bereits gesetzt) |
| Patrick Ulmer | „sofort einsatzbereit“ | Ab sofort |
| Wolfgang Klar | „sofort einsetzbar“ | Ab sofort |
| Tina Braun | „sofort einsatzbereit“ | Ab sofort |
| Andreas Dedio | „Start 01.09“ | 01.09.2026 (bereits gesetzt) |
| Alessandra Fraunholz | „erst zum 01.09“ | 01.09.2026 |
| Maria Nothaft | „start erst September“ | 01.09.2026 |
| Julia Rogge | „ab September“ | 01.09.2026 |
| Michaela Lechter | „Ab 11.08“ | 11.08.2026 |
| Ralf Weber | „Ab 07.08“ | 07.08.2026 |
| Luise Radtke | „erst im Oktober“ | 01.10.2026 |
| Marijana Heel | bis September nur Minijob, danach 25–35h | Ab sofort (Minijob-Start sofort möglich) |
| Chantal Röder | 4 Wochen Kündigungsfrist, kein festes Datum | kein Startdatum |
| Cornelia Sujatta | Notiz „2x mb“ ohne Info | kein Startdatum |
| Stefanie Test | Testeintrag | kein Startdatum |

Unklare Monatsangaben („September“, „Oktober“) werden auf den Monatsersten gesetzt.

## Umsetzung
Ein einzelnes UPDATE-Statement pro Gruppe über die Termin-IDs — „Ab sofort“ setzt `start_asap = true`, konkrete Daten setzen `start_date`.
