# Startdatum bei Onboarding-Terminen

## Ziel
Im Dialog "Onboarding-Termin anlegen" kommt unter dem Notizfeld ein Feld **Startdatum**. Wird ein Bewerber ausgewählt, wird ein bereits im Bewerbungsgespräch hinterlegtes Startdatum automatisch vorbefüllt — manuell überschreibbar.

## Umsetzung

1. **Datenbank**: Neue Spalte `start_date` (Datum, optional) in `onboarding_appointments`.

2. **Auto-Befüllung**: Beim Auswählen einer Bewerbung wird der zugehörige Datensatz aus `interview_appointments` geladen (`start_date`, `start_asap`).
   - Ist ein Startdatum hinterlegt: Feld wird damit vorbefüllt.
   - Ist "schnellstmöglich" gesetzt und kein Datum vorhanden: Hinweis "schnellstmöglich" wird angezeigt, Feld bleibt leer.
   - Nichts hinterlegt: Feld bleibt leer.

3. **Dialog-UI**: Datumsauswahl (Date-Input) unter dem Notizfeld, jederzeit änderbar. Feld ist optional.

4. **Anzeige**: Startdatum wird beim gespeicherten Termin in der Terminliste angezeigt (Spalte bzw. Zeile "Start: TT.MM.JJJJ", sonst "—").

## Technisches
- Migration: `ALTER TABLE public.onboarding_appointments ADD COLUMN start_date date`.
- `src/pages/superadmin/OnboardingTermine.tsx`: neuer State `startDate`, Laden aus `interview_appointments` per `application_id` bei Auswahl, Feld im Dialog, `start_date` beim Insert mitspeichern, Reset in `resetDialog`, Spalte in Tabelle/Typ `Row`.
