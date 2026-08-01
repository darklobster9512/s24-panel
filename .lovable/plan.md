## Ziel

Ein optionaler „Outbound Recruitment"-Modus: Mitarbeiter mit hinterlegtem Caller-API-Key sehen statt Live-Anrufen einen Bewerbungsgespräche-Reiter, dessen Termine über die externe Caller-API kommen und regelmäßig automatisch aktualisiert werden. Kunden können als Recruitment-Kunden markiert werden (Call-Skript-PDF statt Begrüßungstext, Schritt 4 deaktiviert). Der bestehende Inbound-Flow bleibt unverändert.

---

## 1. Datenbank

**Tabelle `employees`**
- `outbound_recruitment` boolean, default false
- `caller_api_key` text, nullable (nur serverseitig gelesen)

**Tabelle `clients`**
- `is_recruitment` boolean, default false
- `call_script_path` text, nullable (Pfad im Storage)

**Storage**
- Neuer privater Bucket `call-scripts` + RLS-Policies: Superadmin schreibt, zugewiesene Mitarbeiter lesen (signed URLs).

**Sicherheit:** Der Caller-Key wird nie an den Browser ausgeliefert. Das Frontend erhält lediglich das Flag `outbound_recruitment`.

---

## 2. Edge Function `caller-api-proxy`

Neue Function als Proxy zur externen API:
- Validiert das JWT des angemeldeten Mitarbeiters.
- Holt den `caller_api_key` seines Employee-Datensatzes serverseitig.
- Leitet den JSON-Body (`action` + Parameter) an `https://laozvnaupdecerpvwzmh.supabase.co/functions/v1/caller-api` weiter, Header `x-caller-key`.
- Erlaubt-Liste der Actions: `meta`, `list_interviews`, `set_status`, `send_panel_link`, `send_reminder`, `resend_success_email`.
- Gibt Status und Fehlerbody der Upstream-API unverändert zurück (400/401/403/429).

Frontend-Hook `useCallerApi()` kapselt die Aufrufe.

---

## 3. Automatische Aktualisierung (Polling)

- Die Termin-Liste läuft über React Query mit `refetchInterval: 5 * 60 * 1000` (alle 5 Minuten) plus `refetchOnWindowFocus`, sodass neue Termine automatisch erscheinen.
- Polling pausiert, wenn der Tab im Hintergrund ist (`refetchIntervalInBackground: false`), und stoppt bei wiederholten Fehlern/429, um Rate-Limits zu schonen.
- Kleine Statuszeile über der Tabelle: „Zuletzt aktualisiert vor X Min." plus manueller **Aktualisieren**-Button.
- Wenn beim Refresh neue Termine gegenüber dem letzten Stand dazukommen, erscheint ein dezenter Toast („2 neue Termine").
- Nach `set_status`, `send_panel_link` oder `send_reminder` wird die Liste sofort invalidiert.

---

## 4. Superadmin: Mitarbeiter-Wizard (Step 2)

In `MitarbeiterWizard.tsx`, Schritt „Account & Vertrag":
- Toggle **„Outbound Recruitment aktivieren"**.
- Bei Aktivierung erscheint das Feld **Caller API Key** (maskiert, Sichtbarkeits-Toggle, Pflichtfeld wenn Toggle an).
- Im Bearbeiten-Modus wird ein bereits gesetzter Key maskiert angezeigt; leer lassen = unverändert.

---

## 5. Superadmin: Kunden-Wizard

- **Schritt 5 (Konfiguration):** Toggle **„Recruitment-Kunde"**. Wenn aktiv:
  - Begrüßungstext-Feld ausgeblendet und aus der Validierung genommen.
  - Stattdessen Upload-Feld für **Call-Skript (PDF)** inkl. Vorschau/Ersetzen/Entfernen.
- **Schritt 4 (Rufnummern):** wird bei Recruitment-Kunden übersprungen/deaktiviert, Nummern-Pflicht entfällt.

---

## 6. Mitarbeiter-Panel: Sidebar & neue Seite

- `MitarbeiterSidebar`: Bei `outbound_recruitment` wird „Live-Anrufe" durch **„Bewerbungsgespräche"** (`/mitarbeiter/bewerbungsgespraeche`) ersetzt. Alle anderen sehen weiterhin Live-Anrufe.
- Neue Seite `src/pages/mitarbeiter/Bewerbungsgespraeche.tsx` im UI-Stil von `/superadmin/bewerbungsgespraeche`:
  - Umschalter **Anstehende / Vergangene** (`default` + `future` bzw. `past`).
  - Suchfeld, Pagination gegen `list_interviews`.
  - Spalten: Datum, Uhrzeit, Name, Telefon, E-Mail, Anstellungsart, Status, Aktionen.
  - Aktionen: **Anruf starten** → `/mitarbeiter/erfassen?interview=<id>`, plus Panel-Link/Erinnerung.
  - Branding/Label aus `meta`.

---

## 7. `/mitarbeiter/erfassen` – Recruitment-Variante

Zweiter Modus, ausgelöst durch `?interview=<id>`; der bestehende Inbound-Modus bleibt unangetastet.

- **Kunden-Card:** der einzige zugewiesene Kunde ist vorausgewählt. Statt Begrüßungstext ein Button **„Call-Skript öffnen"** → Dialog mit PDF-Viewer (signed URL).
- **Anrufer-Card:** Name, Telefon, E-Mail aus dem Interview vorbefüllt.
- **Statt „Anliegen"-Card** eine Aktions-Card:
  - „Panel-Link per SMS senden" (`send_panel_link`)
  - „Erinnerung senden" (`send_reminder` mit Preview-Dialog, Text editierbar)
  - Großes Textfeld für die Gesprächsnotiz
  - Auswahl **Erfolgreich / Fehlgeschlagen** (Notiz bei „Fehlgeschlagen" Pflicht)
- **Speichern & Schließen:** sendet `set_status` mit Status und Notiz und navigiert zurück zum Terminkalender. Kein `call_notes`-Eintrag im eigenen System.
- Gesprächs-Timer bleibt erhalten.

---

## Technische Details

- Neue Route `/mitarbeiter/bewerbungsgespraeche` in `App.tsx`, geschützt wie die übrigen Mitarbeiter-Routen.
- Neuer Hook `use-outbound-profile.ts` liefert `{ outboundRecruitment, clientId }` für Sidebar und Erfassen-Seite.
- Alle API-Aufrufe laufen ausschließlich über die Proxy-Function; der Caller-Key erscheint nie im Client-Bundle oder in Netzwerk-Responses.
- Fehler der Upstream-API (`{ error }`) als Toast, 429 mit Hinweis auf Rate-Limit und pausiertem Polling.
- Bestehende Live-Anruf-, Webhook- und `call_notes`-Logik wird nicht verändert.
