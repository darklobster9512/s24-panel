# Panel-Link per E-Mail bei Outbound-Anrufen

Im Recruiting-Anruf-Screen (`/mitarbeiter/anruf-erfassen`, Outbound) kommt neben „Panel-Link per SMS senden“ ein zweiter Button „Panel-Link per E-Mail“ mit Mail-Icon.

## Verhalten

- Button nur aktiv, wenn beim Bewerber eine E-Mail-Adresse hinterlegt ist; ohne E-Mail wird er ausgeblendet.
- Während des Requests: Button deaktiviert, Spinner statt Icon.
- Erfolg: Toast „Panel-Link an <E-Mail> gesendet“.
- Fehler: Toast mit der `error`-Meldung der API (z. B. „Keine E-Mail-Adresse hinterlegt“).

## Technische Umsetzung

- `supabase/functions/caller-api-proxy/index.ts`: `send_panel_link_email` in `ALLOWED_ACTIONS` aufnehmen (nicht in `READONLY_ACTIONS`, also weiterhin nur für den eigenen Mitarbeiter-Account). Der Proxy reicht Body-Felder unverändert an die Upstream-Function weiter, inklusive `appointmentId`.
- `src/hooks/use-caller-api.ts`: `"send_panel_link_email"` zum `CallerAction`-Typ hinzufügen.
- `src/pages/mitarbeiter/RecruitmentErfassen.tsx`: Funktion `sendPanelLinkEmail()` analog zu `sendPanelLink()`, Aufruf `callerApi("send_panel_link_email", { appointmentId: interviewId })` (camelCase, wie von der API erwartet), eigener `busy`-Key `"panel-mail"`; Button mit `Mail`-Icon in derselben Button-Reihe, gerendert nur wenn `iv?.email` vorhanden.

Keine Datenbankänderungen nötig.
