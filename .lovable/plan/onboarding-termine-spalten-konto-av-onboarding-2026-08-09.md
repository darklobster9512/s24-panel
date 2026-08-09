# Onboarding-Termine: Spalten Konto, AV, Onboarding

Die Tabelle unter `/superadmin/onboarding-termine` bekommt drei zusätzliche Statusspalten, die live aus der Datenbank ermittelt werden.

## Spalten

1. **Konto** — grüner Haken, wenn ein Mitarbeiterkonto mit dem Namen des Bewerbers existiert, sonst rotes X.
2. **AV** (Arbeitsvertrag) — grüner Haken, wenn der Vertrag des Mitarbeiters abgeschlossen ist; gelber Haken, wenn er auf Daten oder auf Bestätigung wartet; rotes X, wenn kein Vertrag vorhanden ist (oder kein Konto).
3. **Onboarding** — grüner Haken, wenn beim Mitarbeiterkonto Onboarding aktiviert ist, sonst rotes X.

Jede Zelle bekommt einen Tooltip mit Klartext (z. B. „Warte auf Bestätigung", „Kein Mitarbeiterkonto").

## Technische Details

- Keine Datenbankänderung nötig, nur Lesezugriffe.
- Beim Laden der Termine zusätzlich `employees` (`id, first_name, last_name, onboarding_enabled`) und `employee_contracts` (`employee_id, status`) laden.
- Zuordnung Termin → Mitarbeiter über Vor-/Nachname (getrimmt, case-insensitive); zusätzlich Fallback über `personal_email` = `email` des Termins, falls der Name nicht passt.
- AV-Status aus `employee_contracts.status`: `completed` → grün, `pending_employee` / `pending_admin` → gelb, sonst X. Bei mehreren Verträgen zählt der weiteste Status.
- Grid-Spaltendefinition in `src/pages/superadmin/OnboardingTermine.tsx` erweitern (Header und Zeilen), Icons `Check` / `X` aus lucide-react, Farben über bestehende Tokens.
