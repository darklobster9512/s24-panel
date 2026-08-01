## Ziel
„Erinnerung senden" soll ohne Popup direkt die Anfrage an die Caller-API schicken.

## Umsetzung

**`src/pages/mitarbeiter/RecruitmentErfassen.tsx`**
- `openReminder()` entfällt; der Button ruft direkt eine kombinierte `sendReminder()` auf:
  1. `send_reminder` mit `preview: true` → Standardtext holen
  2. Sofort `send_reminder` mit `text` aus der Vorschau senden
- Während des Vorgangs bleibt der Button im Lade-/Disabled-Zustand (`busy === "reminder"`); danach Toast „Erinnerung gesendet" bzw. Fehler-Toast.
- Dialog `reminderOpen` inkl. States `reminderOpen`/`reminderText`, Textarea und Dialog-JSX werden entfernt; ungenutzte Imports bereinigt.
- Liefert die Vorschau keinen Text, wird der Fehler als Toast gemeldet statt still zu scheitern.

## Technische Details
- Keine DB- oder Edge-Function-Änderung; die Seite `Bewerbungsgespraeche.tsx` sendet bereits nach demselben Muster (preview → send).
