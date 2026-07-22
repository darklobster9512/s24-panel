Ich fixe die Absatz-Erkennung für den Bewerbungsmail-Text in `/superadmin/einstellungen`.

Plan:
1. **Renderer korrigieren**
   - In `src/lib/applicationEmail.ts` die Funktion für Mail-Absätze robuster machen.
   - Einzelne Zeilenumbrüche sollen als sichtbare Zeilenumbrüche erhalten bleiben.
   - Leere Zeilen sollen echte neue Absätze erzeugen.
   - Windows-Zeilenumbrüche (`\r\n`) und mehrere Leerzeilen werden sauber normalisiert.

2. **Edge Function synchron halten**
   - Dieselbe Absatz-Logik in `supabase/functions/submit-application/index.ts` übernehmen, damit Vorschau und tatsächlich gesendete E-Mail identisch aussehen.

3. **UI-Hinweis ergänzen**
   - Unter dem Nachrichtenfeld kurz anzeigen: „Leerzeile = neuer Absatz, einfacher Zeilenumbruch bleibt erhalten.“

4. **Verifikation**
   - Prüfen, dass die Vorschau bei eingegebenen Absätzen mehrere `<p>`-Blöcke bzw. `<br>`-Zeilenumbrüche rendert.
   - Danach Edge Function neu deployen.