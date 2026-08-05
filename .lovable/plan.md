# Telegram-Benachrichtigung für Livechat-Nachrichten

## Ziel
Sobald ein Mitarbeiter im Livechat-Widget eine Nachricht schickt, geht eine Telegram-Benachrichtigung raus mit Name des Mitarbeiters und dem Nachrichtentext. Nachrichten von Manager/Superadmin lösen keine Benachrichtigung aus.

## Empfänger-Steuerung
- Neue Kategorie „Livechat" in den Telegram-Empfängern (`telegram_recipients.notify_chat`), analog zu Bewerbungen/Notizen.
- Zusätzlicher Schalter in der Tabelle auf `/superadmin/telegram`, damit pro Chat-Gruppe entschieden werden kann, ob Livechat-Meldungen ankommen.
- Standardwert für neue und bestehende Empfänger: aus. So kommt es nicht ungewollt zu Nachrichtenfluten; der Schalter wird bewusst aktiviert.

## Ablauf
1. Mitarbeiter sendet im Widget eine Nachricht → wird wie bisher zuerst in `chat_messages` gespeichert.
2. Danach ruft das Frontend die neue Edge Function `chat-message-notify` mit der Message-ID auf; ein Fehler dabei blockiert das Senden nicht.
3. Die Funktion prüft den angemeldeten Benutzer, lädt die Nachricht samt Mitarbeiter über die Konversation, bricht ab, falls die Nachricht nicht von einem Mitarbeiter stammt, und verschickt an alle aktiven Empfänger mit aktivierter Livechat-Kategorie.

## Nachrichtenformat
```text
💬 Neue Livechat-Nachricht
━━━━━━━━━━━━━━━━━━
🎧 Mitarbeiter: Stefannie Maier
📝 <Nachrichtentext>
```
Plus Button „Livechat öffnen" zum Superadmin-Livechat, wie bei den bestehenden Benachrichtigungen.

## Technisch
- Migration: Spalte `notify_chat boolean not null default false` auf `public.telegram_recipients`.
- Neue Edge Function `supabase/functions/chat-message-notify/index.ts` — Aufbau analog `call-note-notify`: JWT-Prüfung, Service-Role-Client, Empfänger-Query auf `is_active` + `notify_chat`, `sendMessage` per `TELEGRAM_BOT_TOKEN`, HTML-Escaping, Fehler-Logging inkl. „0 Empfänger".
- Frontend: Aufruf nach erfolgreichem Insert in `src/hooks/use-chat.ts` (nur bei `sender_role === "mitarbeiter"`), damit sowohl Widget als auch künftige Mitarbeiter-Oberflächen abgedeckt sind.
- UI: zusätzliche Spalte mit Schalter in `src/pages/superadmin/Telegram.tsx`.
