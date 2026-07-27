## Ziel

Neuer Reiter `/superadmin/manager`, über den der Superadmin Manager-Accounts (E-Mail + Passwort) anlegen und löschen kann. Ein Manager loggt sich normal über `/auth` ein, landet direkt auf `/superadmin/bewerbungsgespraeche` und sieht in der Sidebar ausschließlich diesen Punkt. Alle anderen Reiter/Routen sind ausgeblendet und serverseitig gesperrt.

## Datenbank

1. Enum `app_role` um den Wert `manager` erweitern.
2. Neue Tabelle `public.managers`: `user_id`, `email`, `display_name` (optional), `created_by`, Zeitstempel + Update-Trigger. GRANTs für `authenticated` (nur Superadmin-Policies) und `service_role`, RLS an, Policies: nur Superadmins dürfen lesen/anlegen/ändern/löschen.
3. `handle_new_user` anpassen: `manager` darf **nicht** per Self-Signup vergeben werden (bleibt bei `kunde`); die Rolle wird ausschließlich von der Edge Function per Service-Role gesetzt.
4. RLS-Policies für den Manager-Arbeitsbereich ergänzen (jeweils zusätzlich zu den bestehenden Superadmin-Policies, via `has_role(auth.uid(),'manager')`):
   - `interview_appointments`: lesen, ändern, löschen
   - `applications`: lesen und ändern (Ranking/Status auf der Terminliste + Detailseite)
   - `activity_log`: lesen und eintragen
   - `app_settings`: nur lesen (für Firmenname/Akzentfarbe in der UI)
   - Storage-Bucket `applications`: Lesezugriff für Manager (Lebenslauf-Einbettung auf der Detailseite)

## Backend

- Neue Edge Function `create-manager-account`: prüft, dass der Aufrufer Superadmin ist, validiert E-Mail/Passwort (Zod), legt den Auth-User per Service-Role an (`email_confirm: true`), setzt in `user_roles` die Rolle `manager` (statt der Trigger-Default-Rolle) und schreibt den Eintrag in `managers`.
- Neue Edge Function `delete-manager-account`: Superadmin-Check, löscht Auth-User und Managers-Zeile.

## Frontend

- `src/hooks/use-auth.ts`: `AppRole` um `manager` erweitern, `roleHome('manager')` → `/superadmin/bewerbungsgespraeche`.
- `src/App.tsx`: Superadmin-Block bleibt wie er ist; zusätzlich die beiden Bewerbungsgespräch-Routen für `allow={["superadmin","manager"]}` freigeben (eigener Guard-Block mit demselben `SuperadminLayout`), damit ein Manager keine andere Superadmin-Route erreicht.
- `src/components/superadmin/AppSidebar.tsx`: Rolle aus `useAuth` lesen. Bei `manager` nur die Gruppe mit „Bewerbungsgespräche“ rendern (inkl. Badge), alle anderen Gruppen und der Header-Link auf die Übersicht entfallen.
- Neue Seite `src/pages/superadmin/Manager.tsx`: Tabelle aller Manager (E-Mail, angelegt am), Button „Manager anlegen“ öffnet Dialog mit E-Mail, Passwort (inkl. Generator wie beim Mitarbeiter-Wizard) und Speichern über die Edge Function; Zeilen-Aktion „Löschen“ mit Bestätigung. Aktionen werden ins `activity_log` geschrieben.
- Sidebar-Eintrag „Manager“ (Icon `ShieldCheck`) in der Gruppe System, nur für Superadmins sichtbar; Route `manager` in `App.tsx` registrieren.

## Hinweise

- Passwörter werden nur beim Anlegen übergeben und nicht in der Datenbank gespeichert.
- Nach der Migration wird der Supabase-Linter geprüft und relevante Warnungen behoben.
