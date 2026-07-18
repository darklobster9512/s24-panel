
## Ziel
`/mitarbeiter/kunden` (Übersicht) und `/mitarbeiter/kunden/:id` (Detail) laden echte Daten aus Supabase — nur die dem eingeloggten Mitarbeiter zugewiesenen Kunden. Anrufe/Notizen/Tickets bleiben vorerst Mock (eigene Anbindung später).

## Aktueller Stand (verifiziert)
- Tabellen `employees` (mit `user_id`), `assignments` (`employee_id`, `client_id`), `clients` (mit `logo_url`, `greeting_text`, `forwarding_enabled`, SIP-Feldern etc.) sind vorhanden.
- RLS-Policies existieren aktuell **nur für Superadmins**. Mitarbeiter können nichts lesen — muss ergänzt werden.
- Bucket `client-logos` ist privat → signierte URLs nötig (gleicher Ansatz wie in `/superadmin/zuweisungen`).

## Umsetzung

### 1. RLS-Migration (neue Policies, nichts Bestehendes anfassen)
Ziel: Mitarbeiter sieht genau die Zeilen, für die eine `assignments`-Zeile mit seiner `employees.user_id = auth.uid()` existiert.

Security-Definer-Helper, damit RLS auf `clients` keinen Umweg über `assignments` mit weiteren Policies braucht:

```sql
create or replace function public.is_client_assigned_to_me(_client_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.assignments a
    join public.employees e on e.id = a.employee_id
    where a.client_id = _client_id and e.user_id = auth.uid()
  )
$$;
```

Policies:
- `clients` SELECT für `authenticated`: `public.is_client_assigned_to_me(id)` (zusätzlich zur bestehenden Superadmin-ALL-Policy — RLS ist OR-verknüpft).
- `assignments` SELECT für `authenticated`: `exists (select 1 from employees e where e.id = employee_id and e.user_id = auth.uid())` (zusätzlich zur Superadmin-Policy).
- `employees` SELECT für `authenticated`: `user_id = auth.uid()` (eigener Datensatz, für Cockpit/Profil später nützlich).

GRANTs prüfen und ggf. `GRANT SELECT ON public.clients, public.assignments, public.employees TO authenticated` ergänzen.

### 2. Neuer Hook `useAssignedClients` (Ersatz)
`src/hooks/use-assigned-clients.ts` von Mock auf Supabase umstellen:
- Query: `assignments` → join `clients` (nested select) → gefiltert per RLS automatisch auf den eingeloggten User.
- Zusätzlich: für jedes Kunden-Logo eine signierte URL via `supabase.storage.from('client-logos').createSignedUrl(path, 3600)` erzeugen (analog Superadmin-Zuweisungen), Map `clientId → signedUrl`.
- Rückgabe: `{ clients, loading, error, byId, isAssigned, logoUrls }`. Typ `Client` neu aus DB-Spalten (kein Emoji-Logo mehr).

### 3. Feldmapping DB → UI
| UI (Mock)              | DB (`clients`)         |
|------------------------|------------------------|
| `name`                 | `company_name`         |
| `branche`              | `industry`             |
| `telefon`              | `phone`                |
| `logo` (Emoji)         | `logo_url` → signed URL (Fallback: Initiale) |
| `firmeninhalt`         | `company_description`  |
| `begruessung`          | `greeting_text`        |
| `weiterleitung`        | `forwarding_enabled`   |
| `ansprechpartner`      | `contact_person`       |
| `ansprechpartnerTel`   | `contact_phone`        |
| `adresse`              | `street`, `postal_code`, `city` zusammenbauen |

### 4. UI-Anpassungen
- `src/pages/mitarbeiter/Kunden.tsx`: Loading-Skeletons + Empty-State ("Dir wurden noch keine Kunden zugewiesen"), Suchfilter auf neue Felder umstellen.
- `src/components/mitarbeiter/MitarbeiterLayout.tsx` → `ClientLogo`: `logo` optional String-URL akzeptieren; wenn URL vorhanden `<img>` rendern, sonst Initialen.
- `src/pages/mitarbeiter/KundeDetail.tsx`: gleiche Feldnamen wie oben; Anrufe/Notizen/Tickets bleiben `MOCK_*` mit Hinweis-Badge "Mockup" (klare Trennung, wird später einzeln angebunden).
- Draft-Kunden (`is_draft = true`) werden nicht angezeigt — Filter in Query.

### 5. Nicht Teil dieses Schritts
- Anrufe, Notizen, Tickets (bleiben Mock)
- Cockpit-KPIs, Live-Anrufe, Statistik, Erfassen — bleiben Mock
- Realtime auf `assignments` (kann später ergänzt werden)

## Verifikation nach Umsetzung
- Als Mitarbeiter einloggen → nur zugewiesene Kunden sichtbar.
- Logo-URLs werden signiert geladen (Netzwerk-Check).
- Als Kunde/anderer Mitarbeiter → keine fremden Kunden sichtbar (RLS-Test).
