# Login-Domain auf sekretariat24.app umstellen

Alle verbliebenen Stellen mit `@sekretariat-24.de` werden auf `@sekretariat24.app` umgestellt.

## Änderungen

Mitarbeiter anlegen/bearbeiten:
- `src/pages/superadmin/MitarbeiterWizard.tsx` — `EMAIL_SUFFIX` (Zeile 58) und das angezeigte Suffix im Eingabefeld (Zeile 1045) → `@sekretariat24.app`
- `supabase/functions/create-employee-account/index.ts` — Zod-Validierung `endsWith("@sekretariat-24.de")` (Zeile 103) → `@sekretariat24.app`, danach neu deployen

Platzhalter/Vorschauen (nur Anzeige):
- `src/pages/superadmin/Manager.tsx` (Zeile 216) — Platzhalter `manager@sekretariat24.app`
- `src/pages/superadmin/Einstellungen.tsx` (Zeile 111) — Vorschau-Login `m.mustermann@sekretariat24.app`
- `src/pages/superadmin/Einstellungen.tsx` (Zeile 227) — Absender-Platzhalter `no-reply@sekretariat24.app`
- `src/lib/mitarbeiter-mock.ts` (Zeile 51) — Mock-Login-E-Mail

Bereits korrekt: alle Portal-/Button-Links in Edge Functions, Buchungslink, `/auth`-Kontaktadresse.

## Bestehende Konten

Bereits angelegte Mitarbeiterkonten (z. B. `m.peters@sekretariat-24.de`) behalten ihre Login-Adresse — die Umstellung gilt für neu angelegte Konten. Eine Massen-Umstellung bestehender Auth-Accounts wäre ein separater Schritt (Passwörter bleiben, aber alle Mitarbeiter müssten die neue Login-Adresse nutzen). Sag Bescheid, wenn das auch passieren soll.

## Technik

- Reine String-Änderungen, keine DB-Migration.
- `create-employee-account` wird per `deploy_edge_functions` neu deployed.
