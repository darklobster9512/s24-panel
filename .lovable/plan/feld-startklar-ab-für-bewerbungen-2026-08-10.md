# Feld "Startklar ab" für Bewerbungen

Die Landingpage soll optional ein Datum mitsenden, ab wann sich der Bewerber selbst als startklar bezeichnet. Dieses Feld bleibt getrennt vom bestehenden Startdatum (interne Notiz nach dem Gespräch, liegt an `interview_appointments`).

## Was gemacht wird

1. **Datenbank**: Neue Spalte `startklar_ab` (Datum, optional) in der Tabelle `applications`.
2. **Edge Function `submit-application`**: Nimmt optional das Formularfeld `startklar_ab` im Format `YYYY-MM-DD` entgegen, validiert es und speichert es. Fehlt es, bleibt es leer — bestehende Landingpages funktionieren unverändert weiter.
3. **Bewerbungsliste `/superadmin/bewerbungen`**: Neue Spalte "Startklar" hinter "Stelle" mit deutschem Datumsformat (z. B. 01.09.2026) bzw. "—" wenn nicht angegeben. Auch im Detail-Dialog wird das Feld angezeigt.

## Technische Details

- Migration: `ALTER TABLE public.applications ADD COLUMN startklar_ab date;` (nullable, keine weiteren Policy-Änderungen nötig).
- `supabase/functions/submit-application/index.ts`: Zod-Schema um `startklar_ab: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()` erweitern, leere Werte als `null` einfügen.
- `src/pages/superadmin/Bewerbungen.tsx`: Typ, Select-Query, Tabellen-Grid (Spaltenbreiten anpassen) und Detail-Dialog um das Feld erweitern.
