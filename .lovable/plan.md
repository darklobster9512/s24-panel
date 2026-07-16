## Ziel
`/superadmin/kunden` an Supabase anbinden: Kunden-Tabelle anlegen, Anlage-Dialog mit allen gewünschten Feldern, Liste zeigt echte Daten.

## 1. Datenbank (Migration)

Neue Tabelle `public.clients`:

| Feld | Typ | Pflicht |
|---|---|---|
| id | uuid PK | ✓ |
| company_name | text | ✓ |
| website | text | ✓ |
| company_description | text | ✓ |
| industry | text | ✓ |
| contact_person | text | ✓ |
| street | text | ✓ |
| postal_code | text | ✓ |
| city | text | ✓ |
| vat_id | text | ✓ |
| phone | text | ✓ |
| email | text | ✓ |
| contact_phone | text | – |
| contact_email | text | – |
| logo_url | text | – |
| greeting_text | text | ✓ |
| forwarding_enabled | boolean (default false) | ✓ |
| created_by | uuid (auth.users) | ✓ |
| created_at / updated_at | timestamptz | ✓ |

- `updated_at`-Trigger (nutzt vorhandene `update_updated_at_column`)
- GRANTs: `authenticated` (SELECT/INSERT/UPDATE/DELETE), `service_role` (ALL)
- RLS aktiv, Policies:
  - `Superadmins can manage all clients` — `ALL` mit `has_role(auth.uid(), 'superadmin')`
  - (kunde/mitarbeiter-Zugriff erst später bei Zuweisungen)

## 2. Storage

Public Bucket `client-logos` via Storage-Tool anlegen.
RLS auf `storage.objects`:
- Public `SELECT` für Bucket `client-logos`
- `INSERT/UPDATE/DELETE` nur für Superadmins

## 3. Frontend `/superadmin/kunden`

**Datenlayer:** `useQuery(['clients'])` via `@tanstack/react-query` (bereits in Projekt) → `supabase.from('clients').select('*').order('created_at', { ascending: false })`.

**Liste** (`src/pages/superadmin/Kunden.tsx`):
- Mocks entfernen, echte Daten
- Suche filtert client-side über `company_name`, `email`, `city`
- Spalten: Unternehmen, Branche, Stadt, Telefon, Weiterleitung, Erstellt
- "Kunde anlegen"-Button öffnet Dialog

**Neuer Dialog** (`src/components/superadmin/ClientCreateDialog.tsx`):
- shadcn `Dialog` + `Form` (react-hook-form + zod)
- Zod-Schema mit Trim, max-Längen, `email()`, `url().optional()` für Website
- Felder gruppiert:
  - **Unternehmen:** Name, Website, Firmeninhalt (Textarea), Branche, UST-ID
  - **Kontakt Firma:** Telefon, E-Mail
  - **Adresse:** Straße & Hausnummer, PLZ, Stadt
  - **Ansprechpartner:** Name, Telefon (optional), E-Mail (optional)
  - **Konfiguration:** Logo-Upload (optional, `<input type="file" accept="image/*">`), Begrüßungstext (Textarea), Weiterleitung erwünscht (Checkbox)
- Submit-Flow:
  1. Wenn Logo gewählt: `supabase.storage.from('client-logos').upload(<uuid>-<filename>, file)` → `getPublicUrl` → `logo_url`
  2. `supabase.from('clients').insert({ ..., created_by: user.id })`
  3. Toast, Dialog schließen, `queryClient.invalidateQueries(['clients'])`

## 4. Nicht enthalten (später)
- Bearbeiten/Löschen von Kunden
- Verknüpfung Mitarbeiter ↔ Kunde (Reiter „Zuweisungen")
- Sichtbarkeit für Kunden-/Mitarbeiter-Rolle
