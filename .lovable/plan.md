# Alle E-Mail-/Benachrichtigungs-Links auf sekretariat24.app umstellen

Überall, wo in E-Mails oder Benachrichtigungen ein Button/Link auf das alte Portal `https://app.sekretariat-24.de` zeigt, wird die Domain auf `https://sekretariat24.app` geändert.

## Betroffene Stellen

Edge Functions (Portal-/Button-Links):
- `supabase/functions/create-employee-account/index.ts` — `PORTAL_URL` (Mitarbeiter-Zugangsdaten-Mail)
- `supabase/functions/telegram-notify/index.ts` — `PORTAL`
- `supabase/functions/telegram-webhook/index.ts` — `PORTAL`
- `supabase/functions/call-note-notify/index.ts` — `PORTAL`
- `supabase/functions/chat-message-notify/index.ts` — `PORTAL`
- `supabase/functions/interview-reminder/index.ts` — `PORTAL`
- `supabase/functions/onboarding-reminder/index.ts` — `PORTAL`

Frontend:
- `src/pages/superadmin/Bewerbungen.tsx` (Zeile 305) — kopierter Buchungslink → `https://sekretariat24.app/bewerbungsgespraech/{token}`
- `src/pages/superadmin/Einstellungen.tsx` (Zeile 113) — Vorschau-`portal_url`

Bereits korrekt: `send-interview-invite` (Buchungslink), `/auth` (info@sekretariat24.app).

## Nicht geändert

Die Login-/Absender-E-Mail-Adressen mit `@sekretariat-24.de` (Mitarbeiter-Konten, Platzhalter in Formularen) bleiben unverändert — hier geht es nur um die Link-Domain. Sag Bescheid, wenn die Adressen ebenfalls umziehen sollen.

## Technik

- Reine String-Änderungen, keine DB-Migration.
- Alle geänderten Edge Functions werden per `deploy_edge_functions` neu deployed.
