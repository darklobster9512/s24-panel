## Ziel
SIP-Zugangsdaten werden nicht mehr pro Kunde, sondern pro Mitarbeiter gepflegt. Auf `/mitarbeiter/profil` sieht der eingeloggte Mitarbeiter seine eigenen SIP-Daten.

## Datenbank (Migration)
- `employees`: neue Spalten
  - `sip_phone_number text`
  - `sip_server text`
  - `sip_username text`
  - `sip_password text`
- `clients`: die 4 SIP-Spalten (`sip_phone_number`, `sip_server`, `sip_username`, `sip_password`) entfernen.
- Bestehende RLS-Policies auf `employees` bleiben unverändert (Mitarbeiter darf eigene Zeile lesen, Superadmin alles).

## Superadmin — Mitarbeiter-Wizard
`src/pages/superadmin/MitarbeiterWizard.tsx`:
- Neuer Step „SIP-Daten" (Telefonnummer, Server, Benutzername, Passwort mit Show/Hide-Toggle).
- Speichern der Felder in `employees` beim Anlegen und Bearbeiten.
- `MitarbeiterDetail.tsx`: SIP-Daten als eigener Abschnitt anzeigen (analog zur bisherigen Kunden-Anzeige, mit Copy-Buttons).

## Superadmin — Kunden-Wizard
`src/pages/superadmin/KundenWizard.tsx`:
- SIP-Step (aktuell Step 5) komplett entfernen → Wizard zurück auf 4 Steps.
- Zod-Schema, Defaults und Save-Logik um die 4 SIP-Felder bereinigen.

## Mitarbeiter — Profil
`src/pages/mitarbeiter/Profil.tsx`:
- Assignments/Signed-URL-Logik für SIP-Blöcke pro Kunde entfernen.
- Neue Panel „SIP-Zugangsdaten (Phonerlite)" mit den Feldern aus `employees` (eine Karte statt einer pro Kunde), Show/Hide + Copy.
- „Meine Kunden" bleibt informativ ohne SIP-Anzeige (oder wird ganz entfernt — Vorschlag: entfernen, da nicht mehr relevant).

## Aufräumen
- `useAssignedClients` liefert weiterhin Kundendaten, aber ohne SIP-Felder (waren dort nicht drin — nichts zu ändern).
- Typen kommen nach der Migration automatisch aus `src/integrations/supabase/types.ts`.

## Offene Frage
Sollen die bereits in `clients` eingetragenen SIP-Daten vor dem Drop verworfen werden, oder soll ich vorher versuchen sie auf die zugewiesenen Mitarbeiter zu übertragen? Da SIP-Zugänge pro Person eindeutig sind, empfehle ich **verwerfen** und im Mitarbeiter-Wizard neu eintragen.
