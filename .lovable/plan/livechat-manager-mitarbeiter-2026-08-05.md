# Livechat: Manager ↔ Mitarbeiter

Ein 1:1-Chat pro Mitarbeiter. Manager bekommt einen Livechat-Reiter mit Konversationsliste, Mitarbeiter ein schwebendes Chat-Widget im Panel. Aufbau orientiert sich am Referenzprojekt (Realtime über Supabase, Lesebestätigung, Nachrichten bearbeiten, Tippt-gerade-Anzeige, Online-Status).

## Manager: Reiter „Livechat" (/superadmin/livechat)

Zweispaltig:

```text
+---------------------------+--------------------------------------+
| Suche Mitarbeiter         |  Max Peters        • online          |
| ------------------------- | ------------------------------------ |
| Max Peters      2  12:04  |  [Nachrichtenverlauf]                |
| Lisa Krämer         gest. |  eigene Nachrichten rechts,          |
| Tom Wagner          Mo    |  Mitarbeiter links                   |
|                           |  ✓ gesendet  ✓✓ gelesen 12:05        |
| --- Mein Status ---       | ------------------------------------ |
| ● Online / Abwesend / Off |  [Nachricht schreiben...]     [Senden]|
+---------------------------+--------------------------------------+
```

- Liste aller Mitarbeiter (auch ohne bisherigen Chat) mit letzter Nachricht, Zeitstempel, Ungelesen-Zähler, Online-Punkt (aktiv in den letzten 2 Minuten).
- Statusfeld unten links: Anzeigename (Standard „Daniel Schreiber") und Status Online / Abwesend / Offline plus optionaler Statustext. Wirkt sofort im Widget aller Mitarbeiter.
- Sidebar-Eintrag „Livechat" mit Badge für ungelesene Nachrichten (sichtbar für Manager und Superadmin).

## Mitarbeiter: Chat-Widget

- Schwebender Button unten rechts in jedem Mitarbeiter-Panel-Screen, mit Ungelesen-Badge.
- Geöffnetes Panel: Kopfzeile ohne Bild – nur Name „Daniel Schreiber" plus Statuspunkt und Text (Online / Abwesend / Offline).
- Verlauf, Eingabefeld, automatisches Markieren als gelesen beim Öffnen.

## Funktionen in beiden Ansichten

- Realtime: neue, geänderte und gelöschte Nachrichten erscheinen sofort.
- Lesebestätigung: ein Haken gesendet, zwei Haken gelesen mit Uhrzeit.
- Nachricht bearbeiten (eigene Nachrichten, Kennzeichnung „bearbeitet") und löschen (Platzhalter „Nachricht gelöscht").
- „Tippt gerade…"-Anzeige über einen flüchtigen Realtime-Kanal (nicht in der Datenbank).
- Datumstrenner, Auto-Scroll, Enter zum Senden, Shift+Enter für Zeilenumbruch.
- Nachrichten sind reiner Text; Dateianhänge sind in dieser Runde nicht enthalten.

## Technisches

Migration:
- `public.chat_conversations`: `employee_id` (unique, Referenz `employees`), `last_message_at`, `employee_active_at`.
- `public.chat_messages`: `conversation_id`, `sender_role` (`manager` | `mitarbeiter`), `sender_user_id`, `content`, `edited_at`, `deleted_at`, `read`, `read_at`, Zeitstempel.
- `public.chat_agent_settings` (Singleton): `display_name`, `status` (`online` | `away` | `offline`), `status_text`.
- GRANTs für `authenticated` und `service_role`; RLS: Manager/Superadmin über `has_role` auf alle Konversationen; Mitarbeiter nur auf die Konversation, deren `employee_id` zu seinem `user_id` gehört (Security-Definer-Funktion `is_my_conversation`). Agent-Settings: alle Authentifizierten lesen, nur Manager/Superadmin schreiben.
- Realtime-Publikation für `chat_messages` und `chat_conversations`, `REPLICA IDENTITY FULL`.
- Trigger für `updated_at` / `last_message_at`.

Code:
- `src/hooks/useChat.ts` – Laden, Realtime-Abo (Cleanup über `removeChannel`), Senden, Bearbeiten, Löschen, Gelesen-Markierung.
- `src/hooks/useChatTyping.ts` – Broadcast-Kanal für Tippanzeige, Heartbeat für Online-Status des Mitarbeiters.
- `src/components/chat/ChatThread.tsx` – gemeinsamer Nachrichtenverlauf für beide Seiten.
- `src/components/chat/MitarbeiterChatWidget.tsx` – eingebunden im Mitarbeiter-Layout.
- `src/pages/superadmin/Livechat.tsx` + Route in `src/App.tsx` unter `RequireRole allow={["superadmin","manager"]}`.
- Sidebar-Eintrag samt Unread-Badge in `src/components/superadmin/AppSidebar.tsx`.
