# Mailbox-Ergebnis bei /mitarbeiter/erfassen (Outbound)

## Ziel
Der Button "Erinnerung senden" entfällt. Stattdessen gibt es neben "Erfolgreich" und "Fehlgeschlagen" ein drittes Ergebnis "Mailbox", das beim Speichern die Aktion `set_mailbox` an die Caller-API überträgt.

## Änderungen

### 1. UI (`src/pages/mitarbeiter/RecruitmentErfassen.tsx`)
- "Erinnerung senden"-Button samt zugehöriger Funktion `sendReminder` entfernen (Icon-Import aufräumen).
- Dritter Ergebnis-Button "Mailbox" (Voicemail-Icon), gleiche Optik wie die anderen, aktiv hervorgehoben.
- Ergebnis-Zustand um `"mailbox"` erweitern; Notiz bleibt bei Mailbox optional (Pflicht nur weiterhin bei "Fehlgeschlagen").

### 2. Speichern
- Lokale Notiz in `call_notes` wird wie bisher zuerst gespeichert, Präfix `[Mailbox]`, Standardtext "Mailbox erreicht" wenn kein Text eingegeben wurde.
- Danach der Caller-API-Call:
  - Erfolgreich/Fehlgeschlagen: unverändert `set_status`.
  - Mailbox: `{ "action": "set_mailbox", "appointment_id": "<id>", "note": "<optional>" }`.

### 3. Proxy und Typen
- `set_mailbox` in `src/hooks/use-caller-api.ts` (`CallerAction`) ergänzen.
- `set_mailbox` in der Edge Function `caller-api-proxy` zu den erlaubten Aktionen hinzufügen (nicht readonly, also nur für den eigenen Account, nicht für Superadmin-Fremdzugriff). Der Proxy setzt den `x-caller-key`-Header bereits selbst.
- Prüfen, ob `send_reminder` noch anderswo genutzt wird; falls nicht, aus der Action-Liste entfernen.

## Technische Notizen
Der Request geht weiterhin über die Proxy-Edge-Function, damit der Caller-Key nicht im Browser landet; der Proxy leitet Body und Key an die externe Caller-API weiter.
