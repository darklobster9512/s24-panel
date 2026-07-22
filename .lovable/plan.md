# Bestätigungsmail: Header-Band + bessere Absätze

## Änderungen am HTML-Template (`renderApplicationEmailHtml`)

Datei: `src/lib/applicationEmail.ts` und Spiegelung in `supabase/functions/submit-application/index.ts`.

1. **Logo in Header-Band**
   - Die freistehende Wortmarke oberhalb der Card entfällt.
   - Stattdessen bekommt die weiße Card oben ein eigenes Header-Segment (heller grüner Tint `#7bed9f14`, dünne Trennlinie darunter) mit dem Logo (`Sekreteriat` + `24` in Akzentgrün) linksbündig, Padding 24px 32px.
   - Die bisherige dünne 4px-Akzentleiste bleibt als Abschluss unter dem Header.

2. **Bessere Satzabsätze im Body**
   - Padding der Content-Sektion von `36px 36px 12px` auf `32px 36px 8px` reduzieren, damit der Header sauber anschließt.
   - Absatz-Abstand: `margin-bottom` pro `<p>` von 16px auf 20px erhöhen, `line-height` von 1.65 auf 1.7.
   - Einzelne `\n` (weiche Umbrüche) werden nicht mehr zu `<br/>`, sondern als Leerzeichen behandelt — nur `\n\n` (Doppelumbruch) erzeugt einen neuen `<p>`-Block. So entstehen echte Absätze mit klaren Lücken statt gedrängter Zeilen.
   - Erster Absatz (Anrede) bekommt zusätzlich `margin-bottom:24px` und ein leicht dunkleres Gewicht (500), damit er sich absetzt.

3. **Info-Box unverändert** (Wie geht es weiter?), Footer unverändert.

## Preview

Der Einstellungs-Dialog nutzt bereits `renderApplicationEmailHtml` im iframe — die Änderungen sind sofort sichtbar. Keine weiteren UI-Änderungen nötig.

## Deploy

Edge Function `submit-application` neu deployen, damit die Änderung am Renderer produktiv wird.
