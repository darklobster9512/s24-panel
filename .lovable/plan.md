## Ziel
In der Bewerbungs-Tabelle (`/superadmin/bewerbungen`) zwei neue Spalten „Geburtsdatum" und „Staatsangehörigkeit" direkt nach der Spalte „Anstellung" einfügen.

## Umsetzung in `src/pages/superadmin/Bewerbungen.tsx`

1. Grid-Template im Header und in den Zeilen anpassen: aktuell `grid-cols-[160px_1fr_1fr_140px_140px_120px_150px_100px]` → zwei zusätzliche Spalten nach „Anstellung" einfügen (z. B. `110px` für Geburtsdatum, `140px` für Staatsangehörigkeit).
2. Header um zwei `<span>` erweitern: „Geburtsdatum", „Staatsangehörigkeit".
3. In der Zeile die entsprechenden Zellen mit `formatDate(r.geburtsdatum)` und `r.staatsangehoerigkeit` rendern (truncate + muted).
4. Detail-Sheet bleibt unverändert (enthält beide Felder bereits).
