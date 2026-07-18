## Ziel
`/mitarbeiter/profil` an Supabase anbinden — echte Mitarbeiterdaten aus `employees` + SIP-Daten des zugewiesenen Kunden anzeigen. Passwort-Ändern-Sektion entfällt.

## Datenquellen
- `employees` (via `user_id = auth.uid()`): `first_name`, `last_name`, `login_email`, `personal_email`, `personal_phone`, `contract_type`, `start_date`
- `clients` (via `assignments` → nur zugewiesene Kunden, gefiltert über bestehende RLS + `is_client_assigned_to_me`): `sip_server`, `sip_username`, `sip_password`, `sip_phone_number`, `company_name`, `logo_url`

## RLS-Check
Mitarbeiter braucht `SELECT` auf eigene Zeile in `employees`. Aktuell existieren nur 2 Policies auf `employees` (vermutlich Superadmin). Vor der UI-Arbeit prüfen und ggf. Policy `"Employees can view own row"` mit `USING (user_id = auth.uid())` per Migration ergänzen. Für `clients` sind Policies mit `is_client_assigned_to_me` bereits vorhanden.

## UI-Änderungen `src/pages/mitarbeiter/Profil.tsx`
1. **Passwort-Sektion komplett entfernen** (inkl. Import `KeyRound`).
2. **Persönliche Daten** aus `employees`:
   - Name = `first_name + last_name`
   - Login E-Mail = `login_email`
   - Private E-Mail = `personal_email`
   - Telefon = `personal_phone`
3. **Vertrag** aus `employees`:
   - Vertragsart = `contract_type` (Vollzeit/Teilzeit)
   - Startdatum = `start_date` (formatiert `dd.MM.yyyy`)
   - Status = "Aktiv"
4. **SIP-Zugangsdaten** — pro zugewiesenem Kunden ein eigener Block (Mitarbeiter kann mehrere Kunden haben, jeder Kunde hat eigene SIP-Credentials für Phonerlite):
   - Kopf: Kundenlogo + `company_name` + `sip_phone_number`
   - Zeilen: Server, Benutzername, Passwort (Show/Hide + Copy) — bereits vorhandenes Row-Layout wiederverwenden
   - Wenn keine Zuweisungen: leerer Zustand („Noch keine Kunden zugewiesen").
   - Wenn Kunde keine SIP-Daten hat: Hinweis „SIP-Daten noch nicht hinterlegt".
5. Loading (Skeleton) + Error-Toast, Mock-Import `CURRENT_EMPLOYEE` entfernen.

## Datenladen
Einzelner `useEffect`:
- `employees` where `user_id = auth.uid()` → single row
- `assignments` join `clients` (analog `use-assigned-clients`) für SIP-Blöcke; signierte Logo-URLs wie in bestehendem Hook

## Nicht enthalten
- Passwort ändern (entfernt)
- Bearbeiten der eigenen Daten (read-only)
