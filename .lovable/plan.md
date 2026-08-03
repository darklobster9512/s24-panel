## Ziel
Der Mitarbeiter gibt im Arbeitsvertrag-Wizard zusätzlich Straße + Hausnummer, PLZ und Stadt ein. Diese Daten erscheinen auch im Superadmin-Mitarbeiter-Wizard (Schritt 3 „Persönliches“) sowie in der Mitarbeiter-Detailansicht und werden im Vertrag an den Variablen `{{ strasse }}`, `{{ plz }}`, `{{ stadt }}`, `{{ adresse }}` eingesetzt.

## Datenbank
Migration: drei neue optionale Textspalten in `public.employees`:
- `street` (Straße + Hausnummer)
- `postal_code`
- `city`

## Mitarbeiter-Arbeitsvertrag-Wizard (`src/pages/mitarbeiter/Arbeitsvertrag.tsx`)
- Schritt „Persönliche Daten“ um drei Pflichtfelder erweitern (Straße & Hausnummer, PLZ, Stadt) — im Zod-Schema und in der Schrittvalidierung.
- Vorbelegung aus bestehenden Mitarbeiterdaten, Speicherung beim Signieren zusammen mit den übrigen Feldern.
- Live-Vorschau: `renderContractHtml` erhält `strasse`, `plz`, `stadt` aus den Formularwerten (Fallback auf gespeicherte Werte).

## Superadmin
- `MitarbeiterWizard.tsx`: Schritt 3 „Persönliches“ um die drei Felder erweitern (optional), inkl. Schema, Defaults, Feldliste und Laden beim Bearbeiten.
- `MitarbeiterDetail.tsx`: Adresse als zusätzliche Zeile anzeigen.
- `ArbeitsvertragDetail.tsx`: Adressfelder an `renderContractHtml` übergeben (damit Vorschau und PDF die Variablen befüllen) und in der Datenübersicht anzeigen.

## Technische Details
- `renderContractHtml` und `contract-placeholders.ts` unterstützen die Tokens bereits — nur die Datenzuführung fehlt.
- Vertragsvorlagen selbst bleiben unverändert; leere Werte werden weiterhin als `____________` gerendert.
