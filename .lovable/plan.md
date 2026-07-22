## Bestätigungsmail überarbeiten

**Header**
- Logo „Sekreteriat**24**" horizontal zentriert im Header-Band (statt linksbündig)
- Dezenter, schmalerer Header mit mehr Weißraum

**Anrede & Einleitung (klare Absätze)**
```
Hallo {Vorname} {Nachname},

vielen Dank für deine Bewerbung bei Sekreteriat24.

Wir haben deine Unterlagen erhalten und prüfen sie sorgfältig. In Kürze melden wir uns persönlich bei dir zurück.
```
Jeder Block als eigener `<p>` mit sauberem Abstand (24px), keine zusammengeklebten Sätze mehr.

**„Wie geht es weiter" – neuer, seriöser Text**
Statt Marketing-Ton eine sachliche 3-Punkt-Übersicht:
1. **Prüfung deiner Unterlagen** – Unser Team sichtet deine Bewerbung sorgfältig.
2. **Persönliche Rückmeldung** – Du erhältst innerhalb weniger Werktage eine Nachricht von uns.
3. **Nächste Schritte** – Bei passender Qualifikation laden wir dich zu einem Kennenlerngespräch ein.

**Ton & Design allgemein**
- Formeller, ruhiger Wortlaut – keine Ausrufezeichen, keine Floskeln
- Grußformel: „Mit freundlichen Grüßen\nDein Team von Sekreteriat24"
- Info-Box dezenter (dünnerer Rand, kleinerer Akzent), keine Emojis
- Konsistente Typo-Hierarchie, mehr vertikaler Rhythmus (padding 40px, paragraph-margin 24px)

**Betroffene Dateien**
- `src/lib/applicationEmail.ts` – HTML/Text-Template
- `supabase/functions/submit-application/index.ts` – identisches Template gespiegelt, danach redeploy

Preview im Einstellungs-Dialog aktualisiert sich automatisch (iframe rendert Template).
