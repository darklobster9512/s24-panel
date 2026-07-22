# Plan: Bewerbungen-Modul im Superadmin

## Ziel
Neuer Reiter `/superadmin/bewerbungen` mit Tabelle aller eingegangener Bewerbungen. Eine öffentliche Edge Function nimmt Bewerbungen (inkl. Lebenslauf-Upload) von der Landingpage entgegen.

## Datenbank

### Tabelle `public.applications`
Felder:
- `vorname`, `nachname`, `email`, `handynummer`
- `geburtsdatum` (date)
- `staatsangehoerigkeit`
- `anstellung` (Vollzeit / Teilzeit / Minijob / Werkstudent — als text)
- `lebenslauf_path` (Pfad im Storage), `lebenslauf_filename`, `lebenslauf_mime`
- `status` (default `neu` → `gesichtet`, `abgelehnt`, `angenommen`)
- Standard: `id`, `created_at`, `updated_at`

### RLS
- Nur Superadmin darf SELECT/UPDATE/DELETE.
- Keine INSERT-Policy für anon/authenticated — Inserts laufen ausschließlich über die Edge Function mit Service Role.

### Storage-Bucket `applications` (privat)
- Signed URLs für Lebenslauf-Download im Panel.
- RLS: nur Superadmin darf lesen (via storage.objects policies mit `has_role`).

## Edge Function `submit-application` (public, `verify_jwt = false`)
- Nimmt `multipart/form-data` entgegen (Textfelder + Datei).
- Validierung mit Zod: Pflichtfelder, E-Mail-Format, Handynummer-Regex, Geburtsdatum plausibel, Anstellung als Enum.
- Datei-Validierung: MIME `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`; Max 5 MB.
- Lädt Datei via Service Role in Bucket `applications/<uuid>-<sanitized-filename>` hoch.
- Insert in `applications` mit Storage-Pfad.
- CORS offen (`*`), damit die externe Landingpage posten kann.
- Rate Limit: einfache IP-basierte Prüfung (letzte 60s max 3 Requests) über einen In-Memory-Zähler.
- Rückgabe: `{ ok: true }` oder Fehlermeldung mit 400/413/500.

## Frontend

### Sidebar
- Neuer Menüpunkt „Bewerbungen“ in der Gruppe „Betrieb“ in `src/components/superadmin/AppSidebar.tsx` mit Badge = Anzahl `status = 'neu'`.

### Route
- `src/pages/superadmin/Bewerbungen.tsx`, eingebunden in `src/App.tsx` unter `/superadmin/bewerbungen`.

### Seite
- Tabelle (im Stil der bestehenden Superadmin-Tabellen wie `/superadmin/anrufe`) mit Spalten:
  - Datum & Uhrzeit (aus `created_at`, `de-DE` Format)
  - Name (Vor- + Nachname)
  - E-Mail
  - Handy
  - Geburtsdatum
  - Staatsangehörigkeit
  - Anstellung
  - Lebenslauf (Button „Öffnen“ → generiert Signed URL zur Datei)
  - Status (Badge, per Dropdown änderbar)
- Suchfeld (Name/E-Mail) + Statusfilter.
- Detail-Sheet/Drawer beim Klick auf eine Zeile mit allen Feldern und Aktion „Lebenslauf herunterladen".
- Daten über React Query aus Supabase, Realtime-Subscription für neue Einträge.

## Landingpage-Integration (Referenz)
Ich stelle im Anschluss ein cURL-/Fetch-Beispiel bereit, das die Karriere-Seite genau so aufrufen kann:

```text
POST https://<project>.supabase.co/functions/v1/submit-application
Content-Type: multipart/form-data
Felder: vorname, nachname, email, handynummer, geburtsdatum,
        staatsangehoerigkeit, anstellung, lebenslauf (File)
```

Kein Auth-Header nötig (public endpoint).

## Reihenfolge der Umsetzung
1. Migration: Tabelle `applications` + RLS + Storage-Bucket-Policies.
2. Storage-Bucket `applications` (privat) anlegen.
3. Edge Function `submit-application` erstellen und deployen.
4. Sidebar-Eintrag + Route + Seite bauen.
5. Test-Insert prüfen, cURL-Snippet für Landingpage liefern.
