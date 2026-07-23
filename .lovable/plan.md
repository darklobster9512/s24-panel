# Fixes: Termin-Link, Betreff & Anrede

## 1. Hardcoded Domain für Termin-Link
Statt `window.location.origin` bzw. `req.headers.get('origin')` immer `https://app.sekretariat-24.de` als Basis verwenden.

- **`supabase/functions/send-interview-invite/index.ts`** (Zeilen 214–216):
  - `baseUrl` fix auf `https://app.sekretariat-24.de` setzen. `site_url`-Parameter ignorieren.
  - `bookingUrl = \`https://app.sekretariat-24.de/bewerbungsgespraech/${token}\``
- **`src/pages/superadmin/Bewerbungen.tsx`** (Zeile 286, `copyBookingLink`):
  - `url = \`https://app.sekretariat-24.de/bewerbungsgespraech/${token}\``

## 2. E-Mail Betreff
Aktuell: `Bewerbungsgespräch bei {{company_name}} – wir möchten dich kennenlernen`
→ `{{company_name}}` ist `aigis one GmbH`, deshalb erscheint dort nicht „Sekretariat24".

Fix per SQL Update auf `app_settings`:
- Neuer Betreff: `Bewerbungsgespräch bei Sekretariat24 – wir möchten Sie kennenlernen`

## 3. Anrede: SIE + voller Name
Body in `app_settings.interview_email_body` auf Sie-Form umstellen und vollen Namen verwenden:

```
Sehr geehrte/r Frau/Herr {{vorname}} {{nachname}},

vielen Dank für Ihre Bewerbung. Wir haben uns Ihre Unterlagen in Ruhe angeschaut und möchten Sie gerne näher kennenlernen.

Bitte wählen Sie über den Button unten einen Termin, der Ihnen für ein kurzes Bewerbungsgespräch passt. Das Gespräch dauert ca. 20–30 Minuten und findet online statt.

Wir freuen uns auf Sie!
```

(Die Platzhalter `{{vorname}}` und `{{nachname}}` sind bereits im `vars`-Objekt der Edge Function vorhanden – kein Code-Change nötig.)

## Verifikation
- `tsgo` Typecheck
- Edge Function `send-interview-invite` wird automatisch neu deployt
- Vorschau in `Einstellungen.tsx` zeigt neuen Betreff + Sie-Anrede korrekt
