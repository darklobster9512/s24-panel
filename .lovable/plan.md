## Ziel

Nur der `/kalender`-Befehl im Telegram-Bot wird angepasst. Alle anderen Benachrichtigungen (neue Bewerbung, Termin gebucht, Test) bleiben unverändert.

Datei: `supabase/functions/telegram-webhook/index.ts`

## 1. Nur anstehende Termine

Aktuell wird mit `appointment_date >= heute (UTC)` gefiltert, deshalb tauchen heute bereits vergangene Termine auf.

- „Jetzt“ in Zeitzone `Europe/Berlin` bestimmen (Datum + Uhrzeit).
- Zeilen verwerfen, deren Datum = heute und Uhrzeit < aktuelle Uhrzeit ist.
- Query auf ~30 Zeilen laden, Ausgabe nach dem Filtern auf 10 begrenzen.
- Bleibt nichts übrig: bestehende „Keine anstehenden Bewerbungsgespräche“-Meldung.

## 2. Bessere Darstellung der Liste

Gleiche Inhalte (Datum, Uhrzeit, Name, Nummer), nur klarer strukturiert: Termine nach Tag gruppiert, pro Eintrag Uhrzeit + Name in einer Zeile, Nummer eingerückt darunter, Leerzeile zwischen den Tagen, keine Ziffern-Emojis und keine `━━━`-Balken.

```text
🗓 Kommende Bewerbungsgespräche

Mo, 03.08.2026
  09:00  Max Mustermann
         +49 170 1234567
  11:30  Anna Beispiel
         +49 151 9876543

Di, 04.08.2026
  14:00  Peter Muster
         +49 160 5551234
```

Der Button „Im Portal öffnen“ bleibt.

## Technisches

- Nur `telegram-webhook` wird geändert und neu deployt.
- Keine Datenbank- oder Frontend-Änderungen.
