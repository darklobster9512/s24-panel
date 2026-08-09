# Notiz aus Bewerbungsgespräch übernehmen

## Ziel
Beim Anlegen eines Onboarding-Termins wird das Notizfeld automatisch mit der Notiz aus dem Bewerbungsgespräch des ausgewählten Bewerbers vorbefüllt — manuell weiterhin frei änderbar.

## Umsetzung
- Beim Auswählen einer Bewerbung wird zusätzlich zum Startdatum auch die Notiz aus dem zugehörigen Bewerbungsgespräch geladen.
- Ist eine Notiz hinterlegt und das Feld noch leer, wird sie eingesetzt. Bereits eingegebener Text wird nicht überschrieben.
- Ist keine Notiz vorhanden, bleibt das Feld leer.
- Beim Wechsel/Zurücksetzen der Auswahl wird das Feld wie bisher geleert.

## Technisches
- `src/pages/superadmin/OnboardingTermine.tsx`: bestehende Abfrage auf `interview_appointments` um `notes` erweitern und `setNotes` im selben Effekt befüllen (nur wenn aktuell leer).
