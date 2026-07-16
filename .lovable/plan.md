## Ziel
Wizard freischalten für freie Navigation + Draft-Speicherung.

## Änderungen

### 1. DB-Migration: `clients` Tabelle
- Neue Spalte `is_draft BOOLEAN NOT NULL DEFAULT false`.
- Alle Pflichtfelder auf `NULLABLE` setzen (`company_name`, `website`, `company_description`, `industry`, `contact_person`, `street`, `postal_code`, `city`, `vat_id`, `phone`, `email`, `greeting_text`), damit unvollständige Drafts gespeichert werden können.

### 2. `src/pages/superadmin/KundenWizard.tsx`
- **Freie Navigation**: `Stepper` erlaubt Klick auf jeden Step (kein `disabled`, kein `i <= current`-Guard). „Weiter"-Button ohne `form.trigger`-Validierung.
- **Zwei Zod-Schemas**:
  - `draftSchema` — alles optional (für Draft-Speicherung).
  - `fullSchema` — bestehendes strenges Schema (für finales „Kunde anlegen").
- Resolver auf `draftSchema` setzen; beim finalen Submit manuell `fullSchema.parse` prüfen und Fehler in Form-State schreiben (mit Sprung zum ersten fehlerhaften Step).
- **Neuer Button „Als Entwurf speichern"** (mit `Save`-Icon, `variant="outline"`) neben Zurück/Weiter, immer sichtbar. Speichert aktuelle Werte + `is_draft: true`, ohne Validierung, mit Logo-Upload falls vorhanden. Anschließend Redirect zu `/superadmin/kunden` oder `bearbeiten/:id` (bei Neuanlage: umschalten auf Edit-Route mit neuer ID).
- **Finaler Submit** setzt `is_draft: false`.
- Leere Strings werden beim Speichern zu `null` konvertiert (nicht nur `contact_*`, sondern alle jetzt nullable Felder).

### 3. `src/pages/superadmin/Kunden.tsx`
- Draft-Badge in der Kunden-Tabelle anzeigen (Kunden mit `is_draft = true` visuell markieren, z.B. „Entwurf"-Pill).

## Technische Notizen
- Reihenfolge: erst Migration (macht Spalten nullable, fügt `is_draft` hinzu), dann Code-Anpassung nach Typen-Regen.
- Bestehende Kunden bleiben unverändert (Default `is_draft = false`).
- RLS bleibt gleich (Superadmin-Only Policy deckt beides ab).
