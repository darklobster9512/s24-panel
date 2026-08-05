# Livechat: Statustext ersetzen durch Offline-Zeit

## Ziel
Das freie Textfeld "Statustext" im Status-Panel des Livechat-Reiters entfällt. Stattdessen stellt der Manager Bürozeiten ein: ab welcher Uhrzeit er als offline angezeigt wird (und ab wann wieder online). Außerhalb dieses Fensters zeigt das Mitarbeiter-Widget automatisch "Offline" — unabhängig vom manuell gewählten Status.

## Änderungen

### Status-Panel (Manager/Superadmin)
- Feld "Statustext (optional)" wird entfernt.
- Neu: Schalter "Automatisch offline außerhalb der Zeiten" plus zwei Zeitfelder:
  - "Online ab" (z. B. 09:00)
  - "Offline ab" (z. B. 18:00)
- Beim Speichern werden Anzeigename und Zeiten gemeinsam gesichert.
- Kleine Hinweiszeile unter den Feldern, z. B. "Außerhalb 09:00–18:00 erscheinst du als offline."

### Anzeige
- Der effektive Status = manuell gewählter Status, aber "offline", wenn die aktuelle Uhrzeit außerhalb des Fensters liegt.
- Mitarbeiter-Widget: zeigt nur noch Name + effektiven Statuslabel (Online/Abwesend/Offline), kein freier Statustext mehr.
- Die Anzeige aktualisiert sich minütlich, damit der Wechsel zur eingestellten Uhrzeit ohne Reload passiert.
- Überschreitet das Fenster Mitternacht (z. B. 20:00–06:00), wird das korrekt als durchgehendes Fenster behandelt.

## Technisch
- Migration auf `public.chat_agent_settings`: Spalten `offline_after time`, `online_from time`, `auto_offline boolean default true`; Spalte `status_text` entfällt.
- `src/hooks/use-chat.ts`: `AgentSettings`-Typ und Select anpassen; Helfer `effectiveAgentStatus(settings, now)` exportieren, der das Zeitfenster (lokale Browserzeit) auswertet.
- `src/pages/superadmin/Livechat.tsx`: `statusTextDraft` entfernen, Zeit-Inputs (`type="time"`) und Auto-Offline-Switch ergänzen, `saveProfile` erweitert.
- `src/components/chat/MitarbeiterChatWidget.tsx`: `status_text` entfernen, `effectiveAgentStatus` verwenden, Minuten-Ticker via `useEffect`/`setInterval`.
