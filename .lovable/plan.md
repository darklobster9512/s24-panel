Sobald sipgate ein `answer`-Event schickt, wird der Mitarbeiter, der den Anruf angenommen hat, in seinem Browser automatisch zu `/mitarbeiter/erfassen` weitergeleitet — Kunde ist vorausgewählt (via `to`-Nummer), Anrufernummer eingetragen (via `from`), Timer läuft. Beim `hangup`-Event wird der Timer automatisch gestoppt.

## Mapping Mitarbeiter ↔ sipgate

Die Spalte `employees.sipgate_user_id` existiert schon. Ich baue sie ins Mitarbeiter-Anlegen/-Bearbeiten Formular ein (Step „Zugangsdaten"): freies Textfeld, z. B. `w1` oder `4004168w1`.

Matching-Logik im Webhook bei `answer`:
1. Exakter Match auf `sipgate_user_id` gegen `fullUserId` (`4004168w1`).
2. Fallback: Match gegen kurze `userId` (`w1`).
3. Fallback: Namensabgleich `user` (`Fabian Gerker`) gegen `first_name || ' ' || last_name`.

Passt keiner, wird nur `answered_at`/`status` gesetzt, kein Redirect.

## Änderungen

### 1. Webhook (`supabase/functions/sipgate-webhook/index.ts`)
- `answer`: `employees` nachschlagen (Prio sipgate_user_id → Namensfallback), `answered_by_employee_id` und `handled_by_employee_id` auf `sipgate_calls` setzen.
- `hangup`: bleibt wie gehabt — findet den Call per `callId`, setzt `status='ended'`, `ended_at=now()`. Passt automatisch zu from/to, weil `callId` beim newCall gespeichert wurde.

### 2. Mitarbeiter-Wizard (`src/pages/superadmin/MitarbeiterWizard.tsx` + Detail)
- Feld „sipgate User-ID" im Zugangsdaten-Step (optional).

### 3. Auto-Redirect + Auto-Stop (neu: `src/hooks/use-auto-answer-redirect.ts`)
- Läuft global im Mitarbeiter-Layout.
- Ermittelt einmalig die eigene `employees.id`.
- Realtime-Subscription auf `sipgate_calls` UPDATE:
  - **Answer-Fall**: `answered_by_employee_id === myEmployeeId` UND `status === 'answered'` UND `answered_at` in den letzten 60 s UND Call-ID noch nicht gesehen → `navigate('/mitarbeiter/erfassen?call=<id>&auto=1')`.
  - **Hangup-Fall**: `answered_by_employee_id === myEmployeeId` UND `status === 'ended'` → Event ins `window` dispatchen (`sipgate:hangup` mit `detail: { callId, from, to }`), damit die Erfassen-Seite darauf reagieren kann.

### 4. Erfassen-Seite (`src/pages/mitarbeiter/Erfassen.tsx`)
- Listener auf `sipgate:hangup`: wenn `event.detail.callId === aktuelle callId` **oder** `from === anruferNummer` und `to === Kundennummer`, dann:
  - `setRunning(false)`
  - Dauer aus `Date.now() - start` einfrieren
  - Toast „Anruf beendet — Timer gestoppt"
- Kein Auto-Save; Mitarbeiter klickt weiterhin selbst „Speichern".

### 5. Einbinden im Layout (`src/components/mitarbeiter/MitarbeiterLayout.tsx`)
- `useAutoAnswerRedirect()` einmal im Root aufrufen.

## Randfälle

- **Mehrere Tabs**: alle Tabs navigieren/stoppen — akzeptiert.
- **Hangup ohne vorherigen Answer für diesen User**: kein Auto-Stop, Call wird nur in DB beendet.
- **Kein Match auf sipgate_user_id**: kein Redirect, kein Auto-Stop, Call landet trotzdem im Log.
- **Alte `answered_at` (>60 s) beim ersten Login**: kein Redirect, verhindert Kapern der Seite.

## Verifikation

- Simulierten `newCall → answer → hangup` schicken; prüfen dass `answered_by_employee_id`, `handled_by_employee_id`, `ended_at` gesetzt werden.
- Browser-Test: eingeloggt als Mitarbeiter, Answer simulieren → Redirect + Timer läuft; Hangup simulieren → Timer stoppt automatisch.
