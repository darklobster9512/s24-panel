## Ziel
Bewerbungsgespräch-Einladungsmail komplett stimmig machen:
- Echter, klickbarer Button „Termin auswählen" statt Text-Link (Vorschau + Versand).
- Default-Text: Unterlagen wurden geprüft, wir möchten die Person näher kennenlernen.
- Die 3-Schritt-„Der weitere Ablauf"-Card darf NICHT mehr sagen, dass wir die Unterlagen erst sichten – der Ablauf muss zur Einladung passen.

## Umsetzung

1. **Shared Renderer** (`src/lib/applicationEmail.ts`)
   - `ApplicationEmailInput` optional erweitern:
     - `cta?: { label: string; url: string }`
     - `steps?: Array<{ title: string; body: string }>` (überschreibt die Default-Steps).
   - CTA: nach dem Body-Absatz zentrierter Button-Block (Table-Layout, Akzentfarbe, weißer Text, abgerundet, klickbarer `<a>`).
   - Steps: wenn `steps` übergeben ist, statt der bisherigen drei fixen Zeilen die übergebenen rendern (Nummer + Titel + Body, identisches Styling).
   - Bestehende Bewerbungs-Bestätigungsmail bleibt unverändert (keine `cta`/`steps` → alter Default).

2. **Edge Function `send-interview-invite`**
   - Inline-Renderer analog erweitern (CTA + Steps).
   - Beim Versand mitgeben:
     - `cta: { label: "Termin auswählen", url: bookingUrl }`
     - `steps`:
       1. „Termin wählen" – „Such dir über den Button oben einen passenden Zeitraum aus."
       2. „Kurzes Kennenlerngespräch" – „Wir sprechen ca. 20–30 Minuten online über deine Erfahrung und offene Fragen."
       3. „Rückmeldung & nächste Schritte" – „Direkt im Anschluss klären wir gemeinsam, wie es weitergeht."
   - Falls im Body noch `{{booking_url}}` steht, entfernen – Link ist der Button.

3. **Einstellungen · Vorschau** (`src/pages/superadmin/Einstellungen.tsx`)
   - Im Interview-Preview-Iframe `cta` und dieselben `steps` übergeben, damit die Vorschau 1:1 der Versand-Mail entspricht.
   - Body im Preview NICHT mehr um `➔ Termin auswählen: {{booking_url}}` erweitern.
   - Hinweistext unter dem Textarea: Button und Ablauf-Card werden automatisch eingefügt; Platzhalter `{{vorname}}`, `{{nachname}}`, `{{email}}`.

4. **Neuer Default-Text** (Insert-Tool auf `app_settings`)
   - Betreff: `Bewerbungsgespräch bei {{company_name}} – wir möchten dich kennenlernen`
   - Body:
     ```
     Hallo {{vorname}},

     vielen Dank für deine Bewerbung. Wir haben uns deine Unterlagen in Ruhe angeschaut und möchten dich gerne näher kennenlernen.

     Bitte wähle über den Button unten einen Termin, der dir für ein kurzes Bewerbungsgespräch passt. Das Gespräch dauert ca. 20–30 Minuten und findet online statt.

     Wir freuen uns auf dich!
     ```

## Verifikation
- Vorschau in `/superadmin/einstellungen` zeigt: neuen Text, grünen Button, neue 3-Schritt-Card ohne „Unterlagen sichten".
- Testversand über „Genehmigen & Termin-Link senden"; HTML enthält `<a href=".../bewerbungsgespraech/<token>">Termin auswählen</a>` und die neuen Steps.
