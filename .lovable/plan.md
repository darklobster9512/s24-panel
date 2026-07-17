## Ziel
Im Kunden-Wizard (`/superadmin/kunden/anlegen` und `/bearbeiten/:id`) einen zusätzlichen Step "SIP-Daten" einfügen, in dem die Zugangsdaten für PhonerLite hinterlegt werden.

## Datenbank

Migration auf `public.clients` — 4 neue Spalten (alle nullable, damit Drafts und Bestandsdatensätze weiter funktionieren):

- `sip_phone_number text`
- `sip_server text`
- `sip_username text`
- `sip_password text`

Keine Änderung an RLS/Grants nötig — bestehende Policies decken die Spalten ab. Da Passwörter im Klartext gespeichert werden (analog zu `employees.password_plain` für PhonerLite-Zwecke), keine zusätzliche Verschlüsselung — konsistent zur bisherigen Entscheidung.

## Frontend

### `src/pages/superadmin/KundenWizard.tsx`

Neuer Step **"SIP-Daten"** wird als **5. und letzter Step** hinter "Zusatz" (oder aktuellem letztem Step) eingefügt. Damit hat der Wizard wieder 5 Steps:

```text
1. Firma
2. Adresse & Kontakt
3. Ansprechpartner
4. Zusatz (Logo, Begrüßung, Weiterleitung)
5. SIP-Daten   ← neu
```

Felder im neuen Step (2-Spalten-Grid, konsistent zum Rest):

- **Telefonnummer** (`sip_phone_number`) — Text/Tel input
- **Server** (`sip_server`) — Text input, Placeholder z.B. `sip.provider.de`
- **Benutzername** (`sip_username`) — Text input
- **Passwort** (`sip_password`) — Password input mit Show/Hide-Toggle (Auge-Icon), analog zur Passwort-Anzeige beim Mitarbeiter

Kurzer Hinweistext oben im Step: „Diese Zugangsdaten werden für PhonerLite verwendet."

### Schemas & State

- `draftSchema` und `fullSchema` in `KundenWizard.tsx` um die 4 Felder erweitern (alle `.optional()` im Draft; im `fullSchema` ebenfalls optional, da SIP-Daten evtl. nachgereicht werden — falls Pflicht gewünscht, siehe Rückfrage unten).
- `defaultValues` um leere Strings ergänzen.
- Insert/Update-Payload für `clients` erweitert.
- Bei Bearbeiten-Route: bestehende Werte in Form laden.

### Kundenliste
Keine Änderung — SIP-Daten werden nicht in der Übersicht angezeigt.

## Nicht angefasst
- Mitarbeiter, Zuweisungen, Auth, andere Superadmin-Seiten.
- Grants/RLS auf `clients`.

## Offene Rückfrage
Sollen die SIP-Daten beim finalen Aktivieren (kein Draft) **Pflicht** sein, oder immer optional bleiben? Ich gehe im Plan aktuell von *optional* aus.
