# Passwort ändern bei Mitarbeiter bearbeiten

Aktuell ist das Passwortfeld im Bearbeiten-Modus gesperrt, sobald ein Login-Account existiert (nur die Login-E-Mail soll unveränderlich bleiben). Künftig kann der Superadmin das Passwort neu setzen.

## Bearbeiten-Formular (Schritt „Zugang")

- Passwortfeld und „Generieren"-Button sind bei bestehendem Account wieder aktiv; die Login-E-Mail bleibt weiterhin gesperrt.
- Hinweistext unter dem Feld: „Neues Passwort eintragen und speichern, um es zu ändern."
- Beim Speichern wird das Passwort nur geändert, wenn das Feld verändert wurde; ansonsten bleibt alles wie bisher.
- Nach erfolgreicher Änderung: Bestätigungsmeldung „Passwort aktualisiert".

## Ablauf im Hintergrund

- Neue serverseitige Funktion `update-employee-password`: prüft, dass der Aufrufer die Rolle Superadmin hat, setzt das Passwort im Login-System des Mitarbeiters und speichert es zusätzlich im Klartextfeld `password_plain` (wie bisher beim Anlegen, damit es im Panel sichtbar bleibt).
- Es wird keine E-Mail an den Mitarbeiter verschickt — die neuen Daten stehen im Panel.
- Die Aktion wird im Aktivitätsprotokoll vermerkt (ohne das Passwort selbst).

## Technisches

- `supabase/functions/update-employee-password/index.ts` (neu): validiert JWT des Aufrufers, prüft `has_role(uid,'superadmin')`, nutzt Service-Role-Client für `auth.admin.updateUserById` und das Update auf `employees.password_plain`. Registrierung in `supabase/config.toml`.
- `src/pages/superadmin/MitarbeiterWizard.tsx`: `accountLocked` nur noch für Login-E-Mail nutzen; im Passwortfeld eigenes Flag. In `saveMutation`/`draftMutation` `password_plain` weiterhin nicht direkt per Tabellen-Update schreiben, stattdessen bei geändertem Wert (`form.formState.dirtyFields.password_plain`, min. 6 Zeichen) die neue Edge Function aufrufen.
- Keine Datenbankänderungen nötig.
