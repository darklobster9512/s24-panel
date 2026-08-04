# Optionales Feld "Stelle" für Bewerbungen

## Ziel
Die Landingpage kann beim Absenden einer Bewerbung optional angeben, auf welche Stelle sich beworben wurde. Der Wert wird gespeichert und im Superadmin-Bereich angezeigt.

## Datenbank
Neue Spalte `stelle` (Text, optional/leer erlaubt) in der Tabelle `applications`. Bestehende Bewerbungen bleiben unverändert und haben dort keinen Wert.

## Edge Function `submit-application`
- Nimmt das zusätzliche Formularfeld `stelle` entgegen.
- Optional: fehlt es oder ist es leer, wird nichts gespeichert (kein Fehler).
- Validierung: Text, max. 150 Zeichen, wird getrimmt.
- Wird zusammen mit den übrigen Daten in `applications` geschrieben.
- Die Telegram-Benachrichtigung zeigt die Stelle mit an, wenn vorhanden.

## Anzeige im Panel
- `/superadmin/bewerbungen`: Stelle in der Detailansicht der Bewerbung, und sie wird in der Suche berücksichtigt.

## So überträgt die Landingpage das Feld

Der Request bleibt exakt wie bisher: `POST` als `multipart/form-data` an
`https://erwuhvouxkaxczzbjrle.supabase.co/functions/v1/submit-application`

Neu ist nur ein zusätzliches Feld `stelle`.

Bestehende Felder (alle Pflicht):
`vorname`, `nachname`, `email`, `handynummer`, `geburtsdatum` (Format `YYYY-MM-DD`), `staatsangehoerigkeit`, `anstellung`, `lebenslauf` (Datei: PDF/DOC/DOCX, max. 10 MB)

Neues Feld (optional):
`stelle` – Freitext, z. B. `Recruiter (m/w/d)` oder `Kundenberater Inbound`

HTML-Beispiel (versteckt, je Landingpage fest gesetzt):

```html
<input type="hidden" name="stelle" value="Recruiter (m/w/d)" />
```

JavaScript-Beispiel:

```js
const fd = new FormData(formEl);
fd.append("stelle", "Recruiter (m/w/d)"); // optional, weglassen = leer

await fetch(
  "https://erwuhvouxkaxczzbjrle.supabase.co/functions/v1/submit-application",
  { method: "POST", body: fd }
);
```

Wichtig: kein `Content-Type`-Header manuell setzen (der Browser setzt die multipart-Boundary selbst), und kein Auth-Header nötig – die Funktion ist öffentlich.

## Technische Details
- Migration: `ALTER TABLE public.applications ADD COLUMN stelle text` (nullable).
- `supabase/functions/submit-application/index.ts`: Zod-Schema um `stelle: z.string().trim().max(150).optional()` erweitern, Wert aus `form.get('stelle')` lesen, leeren String zu `null` normalisieren, im Insert ergänzen und im Telegram-Payload mitgeben.
- `src/pages/superadmin/Bewerbungen.tsx`: Typ um `stelle: string | null`, Detail-Feld und Suchfeld ergänzen.
