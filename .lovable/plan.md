# SMS-Versand via seven.io beim Annehmen einer Bewerbung

Wenn in `/superadmin/bewerbungen` eine Bewerbung angenommen wird (dort, wo heute die Einladungs-E-Mail mit Buchungslink rausgeht), wird zusätzlich eine SMS an die Handynummer des Bewerbers geschickt — mit einem Shortlink auf `https://sekretariat24.app/r/<code>`, der zur Bewerbungsgespräch-Seite weiterleitet.

## Ablauf

1. Superadmin klickt „Annehmen“ → wie bisher: Buchungstoken erzeugen, Einladungs-E-Mail via Resend.
2. Zusätzlich: Shortlink-Code anlegen, Ziel = `https://sekretariat24.app/bewerbungsgespraech/<token>`.
3. SMS über seven.io versenden, Text aus der Vorlage in den Einstellungen, z. B.:
   „Hallo {vorname}, danke für deine Bewerbung bei {unternehmen}. Buche dein Bewerbungsgespräch hier: {link}“
4. Ergebnis wird im Erfolgs-/Fehler-Toast angezeigt; schlägt die SMS fehl, bleibt die E-Mail trotzdem gültig.
5. Öffnet der Bewerber `sekretariat24.app/r/<code>`, leitet die Seite direkt auf die Buchungsseite weiter.

## Einstellungen (`/superadmin/einstellungen`)

Neuer Abschnitt „SMS (seven.io)“:
- SMS-Versand aktiviert (Schalter)
- seven.io API Key (maskiertes Feld)
- Absendername (max. 11 Zeichen, alphanumerisch — seven.io-Limit)
- SMS-Text mit Platzhaltern `{vorname}`, `{nachname}`, `{unternehmen}`, `{link}`

## Technische Umsetzung

Datenbank (eine Migration):
- Neue Tabelle `public.short_links` (`id`, `code` unique, `target_url`, `created_at`) mit `GRANT SELECT` für `anon` + `authenticated` (öffentliches Auflösen des Redirects), `GRANT ALL` für `service_role`; RLS: SELECT für alle, INSERT nur `service_role`/superadmin.
- Neue Tabelle `public.sms_logs` (Empfänger, Text, Status, Fehlermeldung, `application_id`, `created_at`) — nur superadmin lesbar, Insert über service_role.
- Neue Spalten in `app_settings`: `sms_enabled`, `seven_api_key`, `sms_sender_name`, `sms_interview_text`.

Edge Function:
- `send-interview-invite` wird erweitert: nach erfolgreichem Mailversand Shortlink anlegen (6-stelliger Code, Kollisionsprüfung), SMS an `applications.handynummer` über `https://gateway.seven.io/api/sms` (Header `X-Api-Key`, Body `to`/`text`/`from`) senden, Nummer auf E.164 normalisieren (`0…` → `+49…`), Ergebnis in `sms_logs` schreiben und im Response als `sms: { ok, error }` zurückgeben. Der API-Key kommt aus `app_settings`, damit er wie gewünscht in den Einstellungen gepflegt wird.

Frontend:
- Neue Route `/r/:code` mit einer schlanken Redirect-Seite, die `short_links` abfragt und per `window.location.href` weiterleitet.
- `src/pages/superadmin/Bewerbungen.tsx`: Toast erweitern („E-Mail + SMS gesendet“ bzw. Hinweis, wenn die SMS fehlschlug).
- `src/pages/superadmin/Einstellungen.tsx`: neuer SMS-Abschnitt inkl. Speichern der neuen Felder.
