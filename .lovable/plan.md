## Ziel

Kunden-Popup ersetzen durch einen mehrstufigen Wizard auf eigenen Routen:
- `/superadmin/kunden/anlegen` — neuer Kunde
- `/superadmin/kunden/bearbeiten/:id` — bestehenden Kunden bearbeiten

## Wizard-Schritte

Die 16 Felder werden auf 5 sinnvolle Schritte verteilt, jeweils mit "Zurück" / "Weiter" und einer Fortschrittsanzeige oben:

1. **Unternehmen** — Unternehmensname, Website, Branche, USt-ID, Firmeninhalt
2. **Adresse** — Straße & Hausnummer, PLZ, Stadt
3. **Kontakt Firma** — Telefon, E-Mail
4. **Ansprechpartner** — Name, Telefon (optional), E-Mail (optional)
5. **Konfiguration & Abschluss** — Logo-Upload, Begrüßungstext, Weiterleitung-Checkbox, Zusammenfassung + "Speichern"

Pro Schritt wird nur das Teilschema validiert (`form.trigger([...fields])`), bevor "Weiter" freigegeben wird. Beim letzten Schritt speichert der Wizard über Supabase und leitet zurück auf `/superadmin/kunden`.

## Änderungen an Dateien

- **Neu**: `src/pages/superadmin/KundenWizard.tsx` — die Wizard-Seite. Nimmt optional `clientId` aus der URL; im Edit-Modus lädt sie den Datensatz und macht `update` statt `insert`. Logo bleibt beim Bearbeiten optional (nur ersetzen, wenn neues File gewählt).
- **Neu**: `src/components/superadmin/wizard/` mit einem `StepIndicator` und 5 kleinen Step-Komponenten (jede rendert nur ihre Felder auf dem gemeinsamen `useForm`).
- **Bearbeiten**: `src/pages/superadmin/Kunden.tsx`
  - "Kunde anlegen"-Button wird zu einem `Link` auf `/superadmin/kunden/anlegen` (kein Dialog mehr).
  - Neue Aktions-Spalte pro Zeile mit "Bearbeiten"-Link auf `/superadmin/kunden/bearbeiten/:id`.
- **Bearbeiten**: `src/App.tsx` — zwei neue Routen unter dem bestehenden Superadmin-Guard.
- **Löschen**: `src/components/superadmin/ClientCreateDialog.tsx` wird nicht mehr benötigt und wird entfernt.

## Technisches

- Weiterhin `react-hook-form` + `zod` mit dem bestehenden Schema, aber Validierung pro Schritt via `form.trigger`.
- Styling im gleichen Card-Look wie die restlichen Superadmin-Seiten (Card mit Header, Stepper-Leiste, Inhalt, Footer mit Buttons).
- Storage-Upload und Insert-/Update-Logik werden 1:1 aus dem alten Dialog übernommen.
- Nach erfolgreichem Speichern: Toast + `navigate("/superadmin/kunden")` + Query invalidieren.

Nicht verändert: Datenbank, RLS, Storage-Bucket.