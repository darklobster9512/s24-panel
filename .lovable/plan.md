## Ziel
Neue E-Mail-Vorlage „Zugangsdaten Mitarbeiterkonto“ im gleichen Design wie die bestehenden Mails. Sie geht automatisch an die persönliche E-Mail des Mitarbeiters, sobald das Konto über den Mitarbeiter-Wizard angelegt wurde – mit Login-E-Mail, Passwort im Klartext und einem Button zu `https://app.sekretariat-24.de`.

## Datenbank
Migration: drei Spalten in `public.app_settings`
- `welcome_email_enabled` (Standard: an)
- `welcome_email_subject` (Standard-Betreff, z. B. „Deine Zugangsdaten für dein Mitarbeiterkonto“)
- `welcome_email_body` (Standardtext mit Platzhaltern)

Platzhalter im Text: `{{ vorname }}`, `{{ nachname }}`, `{{ voller_name }}`, `{{ login_email }}`, `{{ passwort }}`, `{{ portal_url }}`.

## Versand (Edge Function `create-employee-account`)
- Nach erfolgreichem Anlegen des Accounts: Einstellungen laden (Resend-Key, Absender, Welcome-Template, Firmendaten).
- Persönliche E-Mail des Mitarbeiters aus `employees` lesen; fehlt sie oder ist der Versand deaktiviert/Resend nicht konfiguriert, wird übersprungen.
- HTML mit dem bestehenden Mail-Renderer (Mirror von `renderApplicationEmailHtml`) erzeugen:
  - Info-Card „Deine Zugangsdaten“ mit Login-E-Mail und Passwort
  - CTA-Button „Jetzt einloggen“ → `https://app.sekretariat-24.de` (hardcoded)
  - Ablauf-Schritte: Einloggen · Arbeitsvertrag ausfüllen · digital unterschreiben
- Der Mailversand darf das Anlegen nie blockieren (try/catch, Rückgabe `email_sent`).

## Einstellungen-Seite
- Neuer Abschnitt „Zugangsdaten-E-Mail (Mitarbeiter)“ analog zu den bestehenden Blöcken: Toggle, Betreff, Textfeld, Speichern-Button.
- Vorschau-Dialog mit `renderApplicationEmailHtml` (Info-Card + CTA + Schritte), Beispielwerte für Login-E-Mail und Passwort.
- Hinweis auf verfügbare Platzhalter.

## Technische Details
- Der Renderer in `src/lib/applicationEmail.ts` unterstützt `infoCard`, `cta` und `steps` bereits — keine Änderung nötig.
- Die Edge Function erhält eine eigene Kopie des Renderers (wie in `interview-booked-notify`), da `src/` nicht mitdeployt wird.
- Passwort im Klartext wird nur an die persönliche E-Mail versendet (bewusste Anforderung).
