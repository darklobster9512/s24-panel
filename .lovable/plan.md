## Ziel

Digitaler Arbeitsvertrags-Workflow: Superadmin weist Vorlage zu → Mitarbeiter füllt Daten aus & signiert → Superadmin bestätigt → PDF wird generiert und für beide Seiten verfügbar.

## Datenbank

Neue Tabelle `public.employee_contracts`:
- `employee_id` (FK → employees, unique — nur ein aktiver Vertrag)
- `template_id` (FK → contract_templates)
- `status` enum: `pending_employee` | `pending_admin` | `completed`
- `employee_signature_data_url` (text, PNG base64 vom Canvas)
- `signed_at`, `admin_confirmed_at`, `admin_confirmed_by`
- `pdf_path` (Pfad in `contract-assets` Bucket)
- Standard-Timestamps

RLS-Policies:
- Mitarbeiter: SELECT/UPDATE nur eigener Vertrag (`employees.user_id = auth.uid()`)
- Superadmin: Full access
- Beim „ersetzen" wird bestehender Datensatz gelöscht (inkl. PDF im Storage), dann neu erstellt.

Bucket `contract-assets` existiert bereits — PDFs unter `contracts/<employee_id>.pdf`.

## Superadmin: Mitarbeiter Wizard/Detail

**Step 2 „Vertrag & Gehalt"** erweitert um:
- Switch „Arbeitsvertrag zuweisen"
- Wenn aktiv: Select mit `contract_templates` → speichert in `employee_contracts` mit status `pending_employee`
- Bei Bearbeiten: aktuellen Zustand anzeigen (Status-Badge, „Vorlage ändern" ersetzt bestehenden Vertrag komplett)

**Neuer Reiter `/superadmin/arbeitsvertraege`**:
- Liste aller `employee_contracts` mit Status-Filter
- Detail-Ansicht: Mitarbeiter-Daten (readonly), Vertragsvorschau mit ausgefüllten Platzhaltern, Mitarbeiter-Signatur, Button „Bestätigen & PDF erstellen"
- Bei Bestätigung: PDF client-seitig generieren (jsPDF + html2canvas) mit Firmenunterschrift + Mitarbeiterunterschrift → in Storage → `pdf_path` speichern → status `completed`

## Mitarbeiter-Bereich

**Sidebar**: Dynamischer Menüpunkt „Arbeitsvertrag" (mit Alert-Icon) erscheint nur wenn `employee_contracts` mit status ≠ `completed` existiert. Bei `completed` verschwindet der Punkt.

**Route `/mitarbeiter/arbeitsvertrag`** — 3-Phasen-Flow:
1. **Vorschau & Bestätigung**: Vertrag mit unausgefüllten Platzhaltern rendern, Checkbox „Ich habe den Vertrag gelesen", Button „Weiter zu meinen Daten"
2. **Daten-Wizard**: Alle Felder aus Step 3 „Persönliches" des Mitarbeiter-Wizards (Geburtsdatum, Geburtsort, Nationalität, Familienstand, IBAN, BIC, Bank, Steuer-ID, SV-Nummer, Krankenkasse, Adresse). Speichert direkt in `employees`.
3. **Signieren**: Vertragsvorlage mit eingesetzten Platzhaltern + Canvas-Unterschrift (react-signature-canvas). Speichert `employee_signature_data_url`, setzt status auf `pending_admin`.

Nach Abschluss: Info-Screen „Warten auf Bestätigung durch Superadmin".

**`/mitarbeiter/profil`**: Bei status `completed` neue Card „Mein Arbeitsvertrag" mit Download-Button (signed URL aus `contract-assets`).

## PDF-Generierung

Client-seitig via `jsPDF` + `html2canvas`:
- HTML-Div mit gerendertem TipTap-HTML + eingesetzten Platzhaltern
- Am Ende: Firmenunterschrift (aus `company_signature`) links, Mitarbeiterunterschrift rechts, jeweils als `<img>`
- `html2canvas` → Canvas → jsPDF (A4, multi-page bei Bedarf)
- Blob → Upload nach `contract-assets/contracts/<employee_id>.pdf`

## Platzhalter

Bestehende Mapping-Logik aus `src/lib/contract-placeholders.ts` nutzen; Helper `renderTemplate(html, employee)` der `{{ vorname }}` etc. mit Employee-Daten ersetzt. Wird an drei Stellen verwendet: Superadmin-Preview, Mitarbeiter-Signatur-Screen, PDF-Generierung.

## Technische Details

```text
Statusfluss:
  Superadmin weist Vorlage zu   -> pending_employee
  Mitarbeiter signiert          -> pending_admin
  Superadmin bestätigt (+ PDF)  -> completed

Sidebar-Logik (Mitarbeiter):
  useQuery('my-contract') -> zeigt Menüpunkt wenn status ∈ {pending_employee, pending_admin}

Ersetzen bestehender Vertrag:
  DELETE FROM employee_contracts WHERE employee_id = ?
  DELETE storage-objekt (falls pdf_path vorhanden)
  INSERT neuer Vertrag
```

## Neue/geänderte Dateien

- Migration: `employee_contracts` + RLS
- `src/lib/contract-render.ts` — Platzhalter-Ersetzung + PDF-Generierung
- `src/pages/superadmin/MitarbeiterWizard.tsx` — Step 2 erweitern
- `src/pages/superadmin/Arbeitsvertraege.tsx` — neue Übersichts+Detailseite
- `src/pages/mitarbeiter/Arbeitsvertrag.tsx` — 3-Phasen-Flow
- `src/pages/mitarbeiter/Profil.tsx` — Download-Card
- `src/components/mitarbeiter/AppSidebar.tsx` — dynamischer Menüpunkt
- `src/components/superadmin/AppSidebar.tsx` — Reiter „Arbeitsverträge"
- `src/App.tsx` — Routen
- Dependencies: `jspdf`, `html2canvas`, `react-signature-canvas`

## Nicht enthalten
- Vertrags-Historie (alte Verträge werden ersetzt/gelöscht)
- Signatur via Upload oder getippt
- E-Mail-Benachrichtigungen bei Statuswechsel