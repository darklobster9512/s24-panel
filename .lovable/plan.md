## Ziel
Auf `/superadmin/bewerbungen` über der Tabelle eine Reihe von Statistik-Cards einfügen, die zeigen, wie viele Bewerbungen pro Ranking-Stufe vorhanden sind.

## Umsetzung
In `src/pages/superadmin/Bewerbungen.tsx` direkt vor dem `<Panel>` (oder als eigener Panel-Block darüber) ein Grid mit 4 Cards einfügen:

- **Sehr gut** (Akzent grün)
- **Gut**
- **Mittel**
- **Schlecht** (destructive)

Jede Card zeigt:
- Label (z. B. „Sehr gut")
- Große Zahl = Anzahl Bewerbungen mit diesem Ranking
- Kleine Zeile darunter: Anteil in % (bezogen auf `rows.length`)

Zusätzlich links eine 5. Card „Ohne Ranking" für Transparenz (optional, dezent).

## Details
- Zählung via `useMemo` über `rows` (gesamter Datensatz, nicht gefiltert), damit die Statistik stabil bleibt.
- Klick auf eine Card setzt `rankingFilter` auf den entsprechenden Wert (Quality-of-life, filtert die Tabelle darunter). Aktive Card bekommt Ring/Border in Akzentfarbe.
- Styling: `grid grid-cols-2 md:grid-cols-5 gap-3`, konsistent mit bestehenden Panels (rounded-xl, border, bg-card, p-4). Farb-Akzente über die vorhandenen `RANKING_CLASSES`-Töne.
- Keine DB- oder Backend-Änderungen, rein Frontend/Presentation.
