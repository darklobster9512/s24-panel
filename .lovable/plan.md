## Ziel
`/superadmin/einstellungen` an Supabase anbinden, Integrationen entfernen, Resend-Karte hinzufügen und Bestätigungsmail bei neuen Bewerbungen versenden.

## Änderungen

### 1. Datenbank — neue Tabelle `public.app_settings`
Singleton-Zeile mit RLS „nur Superadmin lesen/schreiben".
Felder:
- Firmendaten: `company_name`, `company_address`, `vat_id`
- Branding: `accent_color`, `logo_text`
- Resend: `resend_api_key` (Text), `resend_from_name`, `resend_from_email`
- Bewerbungsmail: `application_email_enabled` (bool), `application_email_subject`, `application_email_body`

Grants für `authenticated` + `service_role`, RLS-Policy per `has_role(auth.uid(), 'superadmin')`.

### 2. Settings-Seite (`src/pages/superadmin/Einstellungen.tsx`)
- Integrationen-Karte entfernen
- Steuernummer entfernen
- Firmendaten- und Branding-Karte an `app_settings` binden (Load via React Query, Save-Button)
- Neue **Resend-Karte**:
  - Input „Resend API Key" (Passwort-Feld, mit Show/Hide-Toggle)
  - Absender-Name, Absender-E-Mail
  - Switch „Bestätigungsmail bei neuer Bewerbung senden"
  - Betreff-Input
  - Body-Textarea mit Hinweis auf Platzhalter (`{{vorname}}`, `{{nachname}}`, `{{email}}`)
  - Speichern-Button
  - **„Vorschau"-Button** → Dialog mit gerendertem Betreff + Body am Dummy-Bewerber „Max Mustermann"

### 3. Edge Function-Anpassung
`supabase/functions/submit-application/index.ts`:
- Nach erfolgreichem Insert `app_settings` via Service-Role laden
- Falls `application_email_enabled` und API-Key gesetzt: Resend-Aufruf an `https://api.resend.com/emails` mit dem in der DB gespeicherten Key
- Platzhalter im Betreff und Body ersetzen
- Fehler nur loggen, Bewerbung nicht failen lassen

### 4. Placeholder-Helper
Kleine Utility (client + Deno-side): `renderTemplate(str, vars)` — identisch für Preview und Versand.

## Sicherheitshinweis
API-Key liegt in Klartext in der DB. RLS beschränkt Zugriff strikt auf Superadmin-Rolle; Service-Role liest ihn serverseitig. Kein Frontend-Leak, da nur `/superadmin` ihn abrufen darf.
