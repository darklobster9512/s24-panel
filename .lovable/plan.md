## Ziel
`/superadmin/mitarbeiter` an Supabase anbinden — analog zum Kunden-Modul: Liste, 3-Step Wizard zum Anlegen/Bearbeiten, Draft-Speicherung, Edge Function zum Erstellen des Auth-Accounts, Detailansicht mit maskierter Passwort-Anzeige.

## Datenbank

### Migration 1: Tabelle `employees`

Felder:

**Person (Pflicht bei Final-Submit)**
- `first_name text`
- `last_name text`
- `personal_email text` — private Email
- `personal_phone text`

**Account & Vertrag (Pflicht bei Final-Submit)**
- `login_local_part text` — Teil vor `@sekreteriat24.de`
- `login_email text` — full email, generated column oder beim Insert gesetzt (`{local}@sekreteriat24.de`)
- `password_plain text` — Klartext-Passwort (bewusste Anforderung)
- `contract_type text` — `vollzeit` | `teilzeit` (via CHECK)
- `start_date date`
- `salary numeric(10,2)`

**Persönliches (alle optional)**
- `birth_date date`, `birth_place text`, `nationality text`, `marital_status text`
- `iban text`, `bic text`, `bank_name text`
- `tax_id text`, `social_security_number text`, `health_insurance text`

**System**
- `id uuid pk`, `user_id uuid` (nullable — wird beim finalen Anlegen mit auth.users.id verknüpft)
- `is_draft boolean default true`
- `created_by uuid`, `created_at`, `updated_at`

**Constraints & Grants**
- `UNIQUE (login_email) WHERE is_draft = false`
- GRANTs: `authenticated` (SELECT/INSERT/UPDATE/DELETE), `service_role` ALL
- RLS: Nur Superadmins (`has_role(auth.uid(),'superadmin')`) — für alle CRUD-Operationen
- Trigger `update_updated_at_column` auf UPDATE

## Edge Function: `create-employee-account`

- Verify JWT via `getClaims`, dann `has_role(user_id,'superadmin')` prüfen — sonst 403.
- Input (Zod): `employee_id uuid`, `login_email string`, `password string`.
- Erzeugt via `supabase.auth.admin.createUser({ email, password, email_confirm: true })` mit Service Role Key.
- Weist Rolle `mitarbeiter` in `user_roles` zu.
- Setzt `employees.user_id` und `employees.is_draft = false`.
- Rollback: bei Fehler nach `createUser` wird der auth user wieder entfernt.

## Frontend

### Neue Dateien
- `src/pages/superadmin/MitarbeiterWizard.tsx` — 3-Step Desktop-Layout (Sidebar-Stepper links, Formular rechts, Sticky Footer), analog zu KundenWizard.
- `src/pages/superadmin/MitarbeiterDetail.tsx` — Detailansicht mit Show/Copy-Passwort.

### Routen in `src/App.tsx`
- `/superadmin/mitarbeiter/anlegen` → `MitarbeiterWizard mode="create"`
- `/superadmin/mitarbeiter/bearbeiten/:id` → `MitarbeiterWizard mode="edit"`
- `/superadmin/mitarbeiter/:id` → `MitarbeiterDetail`

### Wizard-Steps

1. **Person** — Vorname, Nachname, Persönliche Email, Persönliche Telefonnummer
2. **Account & Vertrag**
   - Login-Email: Input für Local-Part + fest angeklebtes Suffix `@sekreteriat24.de` (via Input-Group, das Suffix rendert als `<span>` rechts im Feld)
   - Passwort: Input + Button „Passwort generieren" (8 Zeichen `A–Z a–z 0–9` via `crypto.getRandomValues`) + Show/Hide-Toggle
   - Vertragsart-Select (Vollzeit/Teilzeit), Startdatum, Gehalt (numerisch, €)
3. **Persönliches (optional)** — 2-Column Grid mit allen 10 optionalen Feldern

### Draft- & Submit-Logik (analog Kunden)
- Zwei Zod-Schemas: `draftSchema` (alles optional) und `fullSchema` (Pflichtfelder Step 1+2).
- Buttons im Sticky Footer: „Als Entwurf speichern", „Zurück", „Weiter" / auf Step 3 „Mitarbeiter anlegen".
- Bei finalem Submit: erst `employees` upsert (draft), dann Edge Function `create-employee-account` aufrufen. Erst nach Erfolg zurück zur Liste + Toast mit Login-Daten.
- Bearbeiten: Passwort/Login-Email nach initialem Anlegen read-only (Account existiert bereits in `auth.users`).

### Liste `src/pages/superadmin/Mitarbeiter.tsx`
- Mock durch Supabase-Query ersetzen (`employees` mit `user_roles`-Join optional).
- Spalten: Name, Login-Email, Vertragsart, Startdatum, Status-Badge (Entwurf/Aktiv).
- „Mitarbeiter einladen"-Button → `/superadmin/mitarbeiter/anlegen`.
- Zeilen-Aktionen: Details, Bearbeiten, Löschen (Löschen entfernt DB-Zeile + auth user via Edge Function `delete-employee-account`, wenn `user_id` gesetzt).

### Detailansicht
- Stammdaten-Cards, Passwort-Card mit maskiertem Wert + Eye-Toggle + Copy-Button (`navigator.clipboard`).
- Deep-Link zu Bearbeiten.

## Sicherheitshinweis
Klartext-Passwörter in der DB sind auf ausdrücklichen Wunsch. RLS beschränkt Zugriff auf Superadmins — trotzdem sollte klar sein: bei DB-Kompromittierung sind alle Mitarbeiter-Panel-Zugänge offen.

## Nicht angefasst
Kunden-Modul, Auth-Flow, Rollen-Enum, Design-Tokens.
