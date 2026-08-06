# Panel-Link per E-Mail: Versand über E-Mail-Adresse statt UUID

Der Button „Panel-Link per E-Mail" ruft die Caller-API künftig mit der E-Mail-Adresse des Bewerbers auf statt mit der Termin-UUID.

## Änderung

- `src/pages/mitarbeiter/RecruitmentErfassen.tsx` (Zeile 142): Aufruf ändert sich von
  `callerApi("send_panel_link_email", { appointmentId: interviewId })` zu
  `callerApi("send_panel_link_email", { email })`.
- Verhalten sonst unverändert: Button nur sichtbar bei hinterlegter E-Mail, Spinner während des Requests, Erfolgs-Toast „Panel-Link an <E-Mail> gesendet", Fehler-Toast mit der `error`-Meldung der API.
- Der Proxy (`supabase/functions/caller-api-proxy/index.ts`) reicht Body-Felder unverändert weiter und setzt `x-caller-key` — hier ist keine Anpassung nötig, `send_panel_link_email` ist bereits erlaubt.

Keine Datenbankänderungen nötig.
