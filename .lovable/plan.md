## Problem

Beim Hochladen einer Unterschrift schreibt `src/pages/superadmin/Vertraege.tsx` (Zeile 146) den Wert `signature_source: "upload"`. Die Tabelle `company_signature` erlaubt laut Check-Constraint nur `'generated'` oder `'uploaded'` (Migration `20260717162617_...sql`, Zeile 36). Daher schlägt das Speichern fehl.

## Fix

- In `src/pages/superadmin/Vertraege.tsx` beim Upsert `signature_source: "upload"` → `"uploaded"` ändern.
- Kurz prüfen, ob an anderer Stelle im UI auf `"upload"` verglichen wird (Anzeige „Hochgeladen“ vs. „Generiert“) und ggf. angleichen.

Keine Datenbankänderung nötig.