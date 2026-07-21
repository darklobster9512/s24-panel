## Diagnose (verifiziert)

Webhook funktioniert jetzt korrekt. Aus der DB:
- Der Anruf um 15:20 wurde sauber verarbeitet: `newCall → answer → hangup`, Status `ended`, `answered_at` und `ended_at` gesetzt.
- Es liegt aber noch ein alter, hängender Datensatz drin: `pbx-405fa678-...` von 12:54:28 mit Status `ringing`, `answered_at = NULL`, `ended_at = NULL`. Dieser stammt aus einem Testanruf **vor** dem Webhook-Fix, für den sipgate nie ein Hangup an uns geschickt hat.
- Die Live-Ansicht lädt initial alle Zeilen mit Status `ringing`/`answered`. Dadurch erscheint dieser alte Call weiterhin als "Wartezeit", obwohl er längst vorbei ist.

Realtime ist auf `sipgate_calls` aktiv (Publication + REPLICA IDENTITY FULL), UPDATE-Events funktionieren also grundsätzlich — sichtbar auch daran, dass der 15:20-Call korrekt aus der Live-Liste verschwunden ist.

Ursache ist also **nicht** die UI-Logik im Normalfall, sondern (a) verwaiste Ringing-Zeilen ohne Hangup und (b) fehlender clientseitiger Schutz, falls sipgate mal wirklich kein Hangup schickt.

## Umsetzung

1. **Verwaiste Ringing-Calls sofort bereinigen**  
   Alle `sipgate_calls` mit Status `ringing` oder `answered`, die älter als 15 Minuten sind, auf `missed` bzw. `ended` setzen und `ended_at = now()`.

2. **Stale-Guard im Hook `src/hooks/use-live-calls.ts`**  
   - Ticker (1 s), der Calls automatisch ausblendet, deren `started_at` > 15 Minuten zurückliegt — unabhängig vom DB-Status.
   - Verhindert, dass die Live-Kachel bei fehlendem Hangup unbegrenzt "Wartezeit" zeigt.

3. **Optional (nur wenn du willst)**: Serverseitige Cleanup-Query wiederverwendbar machen (kleine SQL-Funktion oder Cron). Für jetzt reicht das einmalige Bereinigen + der Client-Guard.

## Was **nicht** geändert wird

- Webhook-Code bleibt wie er ist — die Logs zeigen, dass er korrekt arbeitet.
- Keine Änderungen an sipgate-URL oder Token.
