# Livechat-Widget: Gelesene Nachrichten merken

## Problem
Der Ungelesen-Zähler am Chat-Button wird aktuell nur im Komponenten-State gemerkt. Nach einem Seitenwechsel oder Reload gilt jede Manager-Nachricht wieder als ungelesen und das Badge erscheint erneut.

## Lösung
Den Lesezustand lokal im Browser des Mitarbeiters speichern, weiterhin ohne Lesebestätigung an den Manager.

- Beim Öffnen des Chats wird der Zeitpunkt der zuletzt gesehenen Manager-Nachricht dauerhaft gespeichert (pro Konversation, im `localStorage`).
- Beim Laden des Widgets wird dieser Wert gelesen; als ungelesen zählen nur Manager-Nachrichten, die danach eingegangen sind.
- Solange der Chat geöffnet ist, wird der Marker bei jeder neuen eingehenden Nachricht mitgezogen, sodass das Badge nicht aufblitzt.
- Es wird weiterhin kein `read`-Flag in der Datenbank gesetzt — der Manager sieht unverändert nur einen Haken.

## Technisch
- Datei: `src/components/chat/MitarbeiterChatWidget.tsx`
- Speicher-Key: `s24:chat:lastSeen:<conversationId>`, Wert = ISO-Zeitstempel der letzten gesehenen Nachricht.
- Ersetzt den bisherigen `seenIds`-State; Zählung über `created_at > lastSeen`.
- Zugriff auf `localStorage` defensiv gekapselt (try/catch), damit blockierter Storage das Widget nicht bricht.
