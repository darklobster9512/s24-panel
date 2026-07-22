# Moderne Bestätigungsmail für Bewerbungen

Die aktuelle Mail ist ein simpler Text-Body ohne Design. Wir ersetzen sie durch ein professionelles, responsives HTML-Template im Sekreteriat24-Look (helles Theme, Akzent `#7bed9f`).

## Design

- **Layout**: Zentrierte Card (max. 560px), heller Hintergrund (`#f5f7f5`), weiße Content-Card mit sanftem Shadow und abgerundeten Ecken.
- **Header**: Sekreteriat**24**-Wortmarke (24 in Akzentgrün `#7bed9f`), dünne grüne Trennlinie darunter.
- **Body**: Persönliche Ansprache, klare Typo (system-ui/Arial fallback), großzügige Line-Height, kurze Absätze.
- **Info-Box**: Grün getönte Box (`#7bed9f` mit ~10% opacity) mit den nächsten Schritten (Prüfung → Rückmeldung innerhalb X Tage).
- **Footer**: Firmenname, Adresse aus `app_settings`, dezenter Grauton, kleine Schrift, rechtlicher Hinweis.
- **Kompatibilität**: Inline-Styles, table-basiertes Layout für Outlook, `preheader`-Textzeile, Dark-Mode-freundliche Farben.
- **Plain-Text-Fallback** wird parallel mitgesendet.

## Umsetzung

1. **Template-Builder** in `supabase/functions/submit-application/index.ts`:
   - Neue Funktion `renderApplicationEmail({ subject, bodyMarkdown, applicant, settings })` die das HTML mit Firmendaten (Name, Adresse) aus `app_settings` rendert.
   - `bodyMarkdown` (aus dem Settings-Feld) wird mit einfachen Zeilenumbrüchen zu `<p>`-Blöcken konvertiert; Platzhalter (`{{vorname}}` etc.) wie bisher ersetzt.
   - Resend-Aufruf sendet nun `html` **und** `text`.
2. **Standard-Vorlage in `app_settings`** aktualisieren (Seed/Update-Migration), damit vorhandene Installationen sofort einen sinnvollen Default-Text bekommen (bestehende benutzerdefinierte Texte bleiben unangetastet — nur wenn Feld leer oder Default).
3. **Preview-Dialog** in `src/pages/superadmin/Einstellungen.tsx`:
   - Statt Rohtext den gleichen HTML-Renderer clientseitig ausführen (kleine TS-Helper-Funktion, geteilt via `src/lib/emailTemplate.ts` und in Edge Function importiert bzw. dupliziert, da Deno/Node-Trennung).
   - Vorschau in einem `<iframe srcDoc={...}>` rendern, damit Styles isoliert sind.
   - Betreff-Zeile darüber anzeigen.

## Technische Details

- Kein neues Package nötig; HTML wird als Template-String gebaut.
- Farben als Konstanten: `--brand: #7bed9f`, Text `#1a2e1f`, Muted `#6b7a70`, Card `#ffffff`, Page `#f5f7f5`.
- Absender-Domain bleibt wie in `app_settings.resend_from_email` konfiguriert.
- Keine Änderung am Speicher-/Storage-Flow der Bewerbung.

## Nicht Teil des Plans

- Keine Änderung an Signup/Auth-Mails (separates Modul).
- Kein Rebranding anderer Seiten.
