## Ziel

`/superadmin/vertraege` wird zur zentralen Verwaltung von Arbeitsvertrags‑Vorlagen und der Firmenunterschrift — analog zum Referenzprojekt `vic-exploit` (Contracts‑Tab in Einstellungen + Vertragsvorlagen‑Editor). Die bestehende Mockup‑Tabelle mit Mitarbeiter/Kunden‑Verträgen wird entfernt und durch die echte Funktionalität ersetzt.

## Umfang

1. Vertragsvorlagen (CRUD)
   - Übersicht als Karten‑Grid (Titel, Kategorie, Version, Aktiv/Inaktiv, „zuletzt bearbeitet")
   - Aktionen pro Karte: Bearbeiten, Duplizieren, Löschen
   - Button „Neue Vorlage" → Editor
2. Vorlagen‑Editor unter `/superadmin/vertraege/:templateId` (`neu` für neue Vorlage)
   - Felder: Titel, Kategorie (Minijob/Teilzeit/Vollzeit/Werkstudent/Ausbildung), Monatsgehalt, Aktiv‑Switch
   - TipTap‑Rich‑Text‑Editor mit Toolbar (Bold, Italic, Underline, Strike, H1‑H3, Listen, Ausrichtung, Link, Bild‑Upload, Undo/Redo)
   - Rechtes Panel „Verfügbare Platzhalter" mit klickbaren Tokens ({{ vorname }}, {{ startdatum }}, {{ monatsgehalt }}, …), gruppiert nach Persönliche Daten / Adresse / Bankdaten / Vertrag & Firma
   - Aktionen: Abbrechen, Speichern
3. Firmenunterschrift (Signatur‑Optionen)
   - Card „Firmenunterschrift" auf `/superadmin/vertraege`
   - Aktuelle Unterschrift + Meta (hochgeladen/generiert vor X)
   - Felder: Name des Unterzeichners, Titel (auto‑save, debounced)
   - Bild hochladen (max 2 MB), Download, Löschen
   - „Neue Unterschrift generieren" → Dialog mit 4 Stilen (Elegant / Professional / Cursive / Bold) und Live‑SVG‑Preview

## Datenmodell (Supabase)

Neue Tabellen im `public` Schema — ohne `branding_id`, da dieses Projekt einmandantig ist. Zugriff nur für Superadmins via `has_role`.

```
contract_templates
  id uuid pk, title text, category text, monthly_salary numeric(10,2),
  content_html text, version int default 1, is_active bool default true,
  created_by uuid, created_at, updated_at

company_signature   (Singleton: ein Row pro Projekt)
  id uuid pk, signer_name text, signer_title text,
  signature_url text, signature_source text ('generated'|'uploaded'),
  signature_style text ('elegant'|'professional'|'cursive'|'bold'),
  created_at, updated_at
```

- GRANTs für `authenticated` + `service_role`, RLS aktiv, Policies: nur `has_role(auth.uid(),'superadmin')` darf lesen/schreiben.
- `updated_at`‑Trigger via bestehender `update_updated_at_column()`.

Storage:
- Neuer Bucket `contract-assets` (public read), Ordner `signatures/…` und `images/…`. Insert/Update/Delete nur für Superadmins.

## Routen

- `/superadmin/vertraege` → Übersicht (Vorlagen‑Grid + Signatur‑Card)
- `/superadmin/vertraege/:templateId` → Editor (`templateId === "neu"` = neu)

`src/App.tsx` bekommt die zweite Route.

## Technische Details

- Neue Packages: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-text-align`.
- Signatur‑Generierung läuft **client‑side**: SVG wird im Browser erzeugt (gleiche Geometrie wie im Referenzprojekt via `signature-styles.ts`) und als `.svg` in den Bucket hochgeladen; Google‑Fonts werden im Editor per `<link>` im `index.html` geladen, damit die Cursive‑Fonts (Allura, Caveat, La Belle Aurore, Nothing You Could Do) rendern. Kein Edge‑Function nötig.
- Datei‑Uploads (Signatur‑Upload und Editor‑Bilder) über `supabase.storage`.
- Alle „Branding"‑Bezüge aus dem Referenzcode entfallen (kein `useActiveBranding`).

## Neue/geänderte Dateien

- `src/pages/superadmin/Vertraege.tsx` (Umbau: Vorlagen‑Grid + Signatur‑Card)
- `src/pages/superadmin/VertragsvorlageEditor.tsx` (neu)
- `src/components/superadmin/vertraege/TipTapEditor.tsx` (neu)
- `src/components/superadmin/vertraege/ContractPlaceholdersPanel.tsx` (neu)
- `src/components/superadmin/vertraege/SignatureGeneratorDialog.tsx` (neu)
- `src/components/superadmin/vertraege/SignaturePreview.tsx` (neu)
- `src/lib/signature-styles.ts` (neu, 1:1 aus Referenz)
- `src/lib/contract-placeholders.ts` (neu, 1:1 aus Referenz)
- `src/App.tsx` (Route für Editor ergänzen)
- `index.html` (Google‑Fonts für Signatur‑Stile)
- Supabase‑Migration für die zwei Tabellen + Storage‑Bucket + Policies

## Nicht enthalten

- Zuweisen einer Vorlage an einen konkreten Mitarbeiter / Signatur‑Workflow durch Mitarbeiter (kann später als eigener Schritt kommen — dafür braucht es u. a. eine `employee_contracts`‑Tabelle und Auth‑Login für Mitarbeiter).
- Der bisherige Mockup‑Tab „Kunden"/„Mitarbeiter"‑Verträge auf `/superadmin/vertraege` entfällt.
