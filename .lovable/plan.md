## Änderung
Die Login-E-Mail-Domain für Mitarbeiter wird von `@sekreteriat24.de` auf `@sekretariat-24.de` umgestellt.

## Betroffene Stellen
1. **`src/pages/superadmin/MitarbeiterWizard.tsx`**
   - Konstante `EMAIL_SUFFIX` von `@sekreteriat24.de` auf `@sekretariat-24.de` ändern.
   - Anzeige-Text im Formularfeld ("@sekreteriat24.de") aktualisieren.

2. **`supabase/functions/create-employee-account/index.ts`**
   - Zod-Validierung `endsWith("@sekreteriat24.de")` auf `@sekretariat-24.de` ändern.
   - Edge Function anschließend neu deployen.

3. **`src/lib/mitarbeiter-mock.ts`** (optional, aber empfohlen)
   - Mock-Login-E-Mail `sofia@sekreteriat24.de` auf `@sekretariat-24.de` anpassen, damit Demo-Daten konsistent bleiben.

## Keine weiteren Änderungen
- Manager-Accounts (`@sekretariat-24.de`) sind bereits korrekt.
- Kunden-/Bewerbungs-Links und Telegram-Notifications bleiben unverändert.

## Nach dem Deploy
- Bestehende Mitarbeiter-Accounts mit `@sekreteriat24.de` behalten ihre alte Adresse; nur neue Anlagen verwenden `@sekretariat-24.de`.