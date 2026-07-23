## Ziel

Neuer Reiter **Bewerbungsgespräche** im Superadmin-Panel. Wenn eine Bewerbung genehmigt wird, geht eine Mail (im bestehenden Sekretariat24-Style) mit einem individuellen Buchungslink raus. Der Bewerber wählt einen Termin, dieser erscheint dann im Reiter.

## Umsetzung

### 1. Datenbank (Migration)

**Neue Tabelle `public.interview_appointments`**
- `application_id` (FK → applications, ON DELETE CASCADE, UNIQUE)
- `appointment_date` (date), `appointment_time` (time)
- `status` (text, Default `neu`): `neu | erfolgreich | fehlgeschlagen | abgesagt`
- `notes` (text)
- `booking_token` (uuid, UNIQUE, Default `gen_random_uuid()`) — für öffentlichen Link
- `booked_at`, `created_at`, `updated_at`

**Neue Spalten auf `public.applications`**
- `booking_token` uuid UNIQUE — wird beim Genehmigen gesetzt
- Status-Werte werden erweitert um `bewerbungsgespraech` (Link versendet) und `termin_gebucht`

**Neue Spalten auf `public.app_settings`** (für Konfiguration & Mail-Template)
- `interview_email_enabled` bool Default true
- `interview_email_subject` text
- `interview_email_body` text (mit Platzhaltern `{{vorname}}`, `{{nachname}}`, `{{booking_url}}`)
- `interview_slot_start` time Default `09:00`
- `interview_slot_end` time Default `18:00`
- `interview_slot_interval_minutes` int Default 30
- `interview_available_weekdays` int[] Default `{1,2,3,4,5}`

**GRANTs & RLS**
```
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_appointments TO authenticated;
GRANT ALL ON public.interview_appointments TO service_role;
GRANT SELECT ON public.interview_appointments TO anon;  -- öffentliche Buchungsseite
```
Policies:
- `authenticated`: `has_role(auth.uid(),'superadmin')` darf alles (SELECT/INSERT/UPDATE/DELETE)
- `anon` SELECT: nur wenn per Token gefiltert (Frontend nutzt `.eq("booking_token", token)`) — Policy `USING (true)` auf SELECT wäre offen; besser: SECURITY DEFINER RPCs `get_interview_by_token(_token)`, `book_interview_slot(_token, _date, _time)` und `list_booked_slots_public()` → nur diese RPCs für anon freigeben, direkte Tabellen-Reads für anon bleiben zu.

Neue RPCs (SECURITY DEFINER, `SET search_path=public`):
- `get_interview_by_token(_token uuid)` → Termin + Bewerber-Vorname/Nachname
- `book_interview_slot(_token uuid, _date date, _time time)` → prüft Token gültig, Slot frei, schreibt Termin, setzt `applications.status='termin_gebucht'`
- `list_booked_slots()` → gibt nur `{date,time}` zurück (keine PII), damit die Buchungsseite belegte Slots ausgraut

### 2. Genehmigen-Aktion in `src/pages/superadmin/Bewerbungen.tsx`

- Neuer Button „Genehmigen & Termin-Link senden" im Detail-Sheet und in der Zeile (nur wenn Status ≠ `bewerbungsgespraech`/`termin_gebucht`).
- Aktion: generiert `booking_token` (falls fehlt), setzt Status `bewerbungsgespraech`, ruft Edge Function `send-interview-invite` auf.

### 3. Edge Function `send-interview-invite`

- Analog zu `submit-application`: Resend-Versand via `renderApplicationEmailHtml`/`renderApplicationEmailText` (bestehende `src/lib/applicationEmail.ts` — gleicher Style).
- Liest `app_settings.interview_email_*`, ersetzt Platzhalter (`{{vorname}}`, `{{nachname}}`, `{{booking_url}}`).
- `booking_url` = `${SITE_URL}/bewerbungsgespraech/${booking_token}`.
- `verify_jwt = true`; nur vom Frontend mit Superadmin-Session aufrufbar (Rollen-Check via `has_role`).

### 4. Öffentliche Buchungsseite `/bewerbungsgespraech/:token`

Neue Datei `src/pages/BewerbungsgespraechPublic.tsx` (Route in `src/App.tsx` **vor** den Auth-geschützten Routen, ohne `RequireRole`):
- Lädt via `supabase.rpc("get_interview_by_token", { _token })`.
- Zeigt Sekretariat24-Header (dunkelblau + grüner Akzent), Bewerbername, Kalender + Zeitslots.
- Slots aus `app_settings.interview_slot_*` generieren, belegte via `list_booked_slots()` ausgrauen.
- Bestätigung → `book_interview_slot(...)` → Success-View mit Termin.
- Wenn schon gebucht: Zusammenfassung + „Termin ändern"-Option (löscht alten, bucht neu).

### 5. Neuer Reiter `/superadmin/bewerbungsgespraeche`

Neue Datei `src/pages/superadmin/Bewerbungsgespraeche.tsx`:
- Tabelle: Bewerber (Name/Email/Handy aus join `applications`), Termin (Datum/Uhrzeit), Status-Badge, Aktionen: „Erfolgreich"/„Fehlgeschlagen"/„Absagen"/„Löschen".
- Filter: „Heute/Morgen", „Vergangene", „Zukünftige" (Buttons wie in Referenz), Suchfeld.
- Realtime-Subscription auf `interview_appointments`.
- Sidebar-Eintrag in `src/components/superadmin/AppSidebar.tsx` unter „Betrieb" (Icon `Calendar`), Badge = Anzahl heutiger Termine.

### 6. Einstellungen-Erweiterung `src/pages/superadmin/Einstellungen.tsx`

Neuer Abschnitt „Bewerbungsgespräch-Einladung":
- Toggle enabled, Subject-Input, Body-Textarea (gleiche Platzhalter-UX wie Bewerbungs-Mail, zusätzlich `{{booking_url}}`).
- Konfiguration der verfügbaren Slot-Zeiten (Start/Ende, Intervall, Wochentage).
- Vorschau-Button öffnet Dialog mit `renderApplicationEmailHtml` — analog zur bestehenden Preview, damit Style-Konsistenz sichtbar ist.

### 7. Wichtige Sicherheits-Details

- Token ist Zufalls-UUID → nicht erratbar; keine Auth nötig, aber auch keine sensiblen Daten in RPC-Response (nur Vorname/Nachname + evtl. Firmenname).
- `book_interview_slot` prüft Slot-Kollision serverseitig (kein Client-Trust).
- Keine E-Mail/Handy an anon zurückgeben.
- Alle neuen Tabellen/Spalten mit expliziten GRANTs.

### 8. Reihenfolge

1. Migration ausführen (Tabelle, Spalten, RPCs, RLS, GRANTs)
2. Edge Function `send-interview-invite` deployen
3. Frontend: neue Seiten, Sidebar, Einstellungen, Genehmigen-Button
