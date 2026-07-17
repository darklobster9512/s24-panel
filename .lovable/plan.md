## Ziel
`/superadmin/zuweisungen` neu gestalten und an Supabase anbinden. Statt Matrix bekommt jeder Mitarbeiter eine eigene Sektion mit Karten der zugewiesenen Kunden und einer „+"-Karte, die ein Dialog mit den verfügbaren Kunden öffnet.

## Datenbank

### Migration: Tabelle `assignments`

Verknüpft Mitarbeiter (`employees.id`) mit Kunden (`clients.id`) — Many-to-Many.

Felder:
- `id uuid pk`
- `employee_id uuid not null references public.employees(id) on delete cascade`
- `client_id uuid not null references public.clients(id) on delete cascade`
- `created_by uuid not null`
- `created_at timestamptz default now()`
- `UNIQUE (employee_id, client_id)`
- Index auf `employee_id`, `client_id`

Grants & RLS:
- `GRANT SELECT, INSERT, DELETE ON public.assignments TO authenticated`
- `GRANT ALL ON public.assignments TO service_role`
- RLS: nur Superadmins (`has_role(auth.uid(),'superadmin')`) dürfen SELECT/INSERT/DELETE.

Kein `updated_at`-Trigger nötig (rein zuweisen/entfernen, keine Updates).

## Frontend

### `src/pages/superadmin/Zuweisungen.tsx` neu aufbauen

Layout:
- `PageHeader` mit Titel + Untertitel, kein „Speichern"-Button (Änderungen sind live).
- Darunter eine vertikale Liste, für **jeden aktiven Mitarbeiter** (nur `is_draft = false`) eine Sektion:

```text
┌─ Sofia Weber ────────────────────────────────────────────────┐
│  Vollzeit · sofia.w@sekreteriat24.de                         │
│                                                              │
│  [Kunden-Card] [Kunden-Card] [Kunden-Card] [ + Zuweisen ]    │
└──────────────────────────────────────────────────────────────┘
```

Mitarbeiter-Sektion:
- `Panel` mit Kopfzeile: Avatar/Initialen, Name, Vertragsart, Login-Email.
- Grid darunter (`grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3`) mit:
  - Kunden-Cards für jede Zuweisung: Logo/Initiale, Firmenname, Branche, kleines „x"-Icon (hover) zum Entfernen.
  - Zum Schluss eine gestrichelte **„+ Zuweisen"-Karte** (gleiche Größe), Klick öffnet den Dialog.

### Dialog: „Kunde zuweisen"
- `Dialog` aus shadcn.
- Zeigt Titel „Kunde für {Mitarbeiter} zuweisen".
- Suchfeld (Filter über `company_name`).
- Liste der Kunden, die **noch nicht** diesem Mitarbeiter zugewiesen sind (nur `is_draft = false`).
- Klick auf einen Eintrag → Insert in `assignments`, Dialog schließt, Card taucht in der Sektion auf.
- Leerzustand: „Keine weiteren Kunden verfügbar".

### Datenfluss
- Bei Mount: parallel `employees` (aktiv), `clients` (aktiv), `assignments` laden.
- Client-seitig zu einer Map `employeeId → Client[]` gruppieren.
- Mutationen (Insert/Delete auf `assignments`) → optimistisch UI updaten, danach reload/refetch bei Fehler zurückrollen. Toast-Feedback.

### Kunden-Card entfernen
- Kleines `X`-Icon rechts oben in der Card (nur bei Hover sichtbar).
- Bestätigung via kurzem `confirm`/Toast-Action reicht — Löschung via `DELETE FROM assignments WHERE id = ...`.

### Leere Zustände
- Keine Mitarbeiter aktiv: Hinweis-Karte mit Link zu `/superadmin/mitarbeiter/anlegen`.
- Mitarbeiter ohne Zuweisungen: nur die „+"-Card wird gerendert.

## Nicht angefasst
- Mitarbeiter- und Kunden-Module (nur lesend genutzt).
- Auth, Rollen, Design-Tokens, andere Superadmin-Seiten.

## Technische Details
- Neue Tabelle `assignments` mit RLS auf Superadmin beschränkt.
- Keine Edge Function nötig — reine Client-Queries mit RLS-Schutz.
- Types werden nach Migration automatisch neu generiert; `Zuweisungen.tsx` nutzt danach `Tables<'assignments'>`.
