## Änderungen

**1. E-Mail-Header-Farbe korrigieren**
- In `src/lib/applicationEmail.ts` und `supabase/functions/submit-application/index.ts` den Header-Hintergrund von `#0f1a2e` auf das echte Sidebar-Token `#130f40` (`--ink-deep`) umstellen.

**2. Lebenslauf-Upload auf max. 10 MB begrenzen**
- In `supabase/functions/submit-application/index.ts` nach dem Auslesen der `resume`-Datei prüfen: wenn `file.size > 10 * 1024 * 1024`, mit Status 413 und klarer Fehlermeldung (`"Lebenslauf darf maximal 10 MB groß sein"`) antworten, bevor der Upload zu Storage passiert.
- Edge Function wird automatisch neu deployt.

Keine weiteren Änderungen (Text, Struktur, Grüntöne bleiben wie zuletzt).