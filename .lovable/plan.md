# Warum bei Melanie Lontzek keine SMS kam

Ursache ist geprüft: In den Einstellungen ist der Schalter für den SMS-Versand **deaktiviert** (`sms_enabled = false`). Der seven.io API-Key, der Absendername („Sekretariat“) und der SMS-Text sind hinterlegt, aber die Funktion überspringt den Versand, solange der Schalter aus ist. Deshalb wurde nur die E-Mail verschickt und es existiert kein SMS-Log-Eintrag.

Die Bewerbung selbst ist korrekt verarbeitet: Status `bewerbungsgespraech`, Buchungstoken vorhanden, Handynummer `017631263501` (wird sauber zu `+4917631263501` normalisiert).

## Lösung

1. SMS-Versand aktivieren — entweder du setzt den Schalter „SMS-Versand aktiviert“ unter `/superadmin/einstellungen` selbst, oder ich aktiviere ihn per Datenbank-Update.
2. Danach für Melanie die SMS nachträglich auslösen: Über den Bewerbungs-Dialog erneut „Annehmen“ klicken — der bestehende Buchungstoken bleibt erhalten, es wird nur erneut E-Mail + SMS verschickt.

## Optionale Verbesserung

Damit so etwas nicht unbemerkt bleibt: Im Toast nach dem Annehmen zusätzlich den Hinweis „SMS übersprungen – Versand in den Einstellungen deaktiviert“ anzeigen (heute wird der Grund `disabled` still verschluckt).
