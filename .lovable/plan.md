# Panel-Link per SMS: „Internal Server Error" bei Patrick Ulmer & Sarah Aschoff

## Was die Logs zeigen

Im Log der Proxy-Function steht genau eine passende Fehlerzeile:

```text
caller-api [send_panel_link] failed [400]:
{"error":"{\"raw\":\"Internal Server Error\"}"}
```

Das heißt: Unser Panel hat den Request korrekt an die externe Caller-API geschickt. Die externe API hat mit HTTP 400 geantwortet und darin gemeldet, dass ihr eigener SMS-Dienst „Internal Server Error" zurückgegeben hat. Der Text `{"raw":"Internal Server Error"}` stammt also nicht von uns, sondern wird von außen durchgereicht.

Auf unserer Seite ist die Konfiguration bei beiden Accounts vollständig: Patrick Ulmer und Sarah Aschoff haben `outbound_recruitment = true` und einen hinterlegten `caller_api_key` (gleiche Länge wie bei allen anderen Outbound-Callern). Ein fehlender Key oder eine fehlende Freischaltung scheidet damit als Ursache aus.

Ob es wirklich nur diese beiden Accounts betrifft (also z. B. ein Absender-/Nummern-Problem im SMS-Gateway pro Caller-Key) oder ob der SMS-Dienst gerade generell ausfällt, lässt sich aus dem einen Log-Eintrag nicht abschließend sagen — das ist Schritt 1.

## Vorgehen

1. **Eingrenzen (kein Code):** Panel-Link per SMS testweise bei einem funktionierenden Account (z. B. Wolfgang Klar) und bei Patrick Ulmer für denselben Termin auslösen und die Proxy-Logs vergleichen. Ergebnis entscheidet:
   - Fehler nur bei den beiden Accounts → Problem liegt beim Caller-Key/Absendernummer im externen System; muss dort beim Betreiber der Caller-API korrigiert werden. Wir können das aus unserem Panel nicht beheben.
   - Fehler bei allen → Störung des SMS-Gateways der externen API, ebenfalls extern.

2. **Fehlermeldung im Panel verständlich machen (unser Code):** Aktuell sieht der Mitarbeiter den rohen JSON-String `{"raw":"Internal Server Error"}`. Stattdessen soll der Toast eine klare Meldung zeigen, z. B. „SMS-Versand aktuell nicht möglich (Fehler beim SMS-Dienst). Bitte Panel-Link per E-Mail senden." Der technische Originaltext wandert nur ins Log.

3. **E-Mail-Fallback hervorheben:** Wenn der SMS-Versand fehlschlägt und beim Bewerber eine E-Mail hinterlegt ist, im Fehler-Toast direkt auf den E-Mail-Button hinweisen.

## Technische Details

- `src/hooks/use-caller-api.ts`: Beim Auspacken der Upstream-Antwort erkennen, wenn die `error`-Eigenschaft selbst wieder ein JSON-String ist (verschachtelt, z. B. `{"raw":"..."}`), diesen parsen und die innere Meldung als Klartext übernehmen statt den rohen String durchzureichen.
- `src/pages/mitarbeiter/RecruitmentErfassen.tsx` und `src/pages/mitarbeiter/Bewerbungsgespraeche.tsx`: Im `catch` des SMS-Versands technische Upstream-Fehler (`Internal Server Error`, 5xx) auf eine verständliche deutsche Meldung mappen.
- `supabase/functions/caller-api-proxy/index.ts`: Logging um den betroffenen Mitarbeiter (Name/ID) und die Termin-ID erweitern, damit sich künftige Fälle direkt einem Account zuordnen lassen.

Keine Datenbankänderungen nötig. Der eigentliche SMS-Fehler entsteht außerhalb dieses Projekts und kann nur beim Betreiber der externen Caller-API behoben werden.
