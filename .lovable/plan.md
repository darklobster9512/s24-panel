Du hast recht, das muss jetzt sauber gelöst werden. Ich habe den aktuellen Code und die sipgate-Doku geprüft: Die Funktion antwortet zwar mit `onAnswer` und `onHangup`, aber die Callback-URLs enthalten zusätzlich `&callback=answer/hangup`. Genau diesen unnötigen Zusatz entferne ich, damit sipgate eine möglichst einfache, dokumentationsnahe Callback-URL bekommt.

Plan:

1. Webhook-XML vereinfachen
   - `onAnswer` und `onHangup` zeigen beide auf dieselbe saubere URL:
     `https://erwuhvouxkaxczzbjrle.supabase.co/functions/v1/sipgate-webhook?token=...`
   - Kein zusätzliches `&callback=...` mehr in den XML-Attributen.
   - Die Funktion unterscheidet Answer/Hangup ausschließlich über das von sipgate gesendete `event`-Feld, wie in der Doku beschrieben.

2. XML-Ausgabe exakt dokumentationsnah machen
   - Response bleibt:
     ```xml
     <?xml version="1.0" encoding="UTF-8"?>
     <Response onAnswer="..." onHangup="..." />
     ```
   - `Content-Type: application/xml` bleibt gesetzt.
   - Keine zusätzlichen XML-Kommentare, keine extra Attribute, keine Spielereien.

3. Webhook robuster machen
   - `event=newCall`, `event=answer`, `event=hangup` werden case-insensitive verarbeitet.
   - `callId` wird für alle Events gleich behandelt.
   - Hangup beendet auch dann den Call, wenn vorher kein Answer angekommen ist.

4. Live-Status bereinigen
   - Nach erfolgreichem Fix markiere ich aktuell hängende `ringing`/`answered` Calls als beendet/missed, damit `/mitarbeiter/live` nicht weiter alten Müll zeigt.

5. Verifikation
   - Ich teste die Edge Function mit simulierten `newCall`, `answer` und `hangup` POSTs.
   - Danach prüfe ich per Datenbankabfrage, ob Status korrekt von `ringing` zu `answered` zu `ended/missed` wechselt.
   - Dann brauchst du nur noch genau diese URL bei sipgate hinterlegt lassen:
     `https://erwuhvouxkaxczzbjrle.supabase.co/functions/v1/sipgate-webhook?token=...`