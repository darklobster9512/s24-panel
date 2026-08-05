# Livechat-Widget: keine Lesebestätigung + Zeitstempel rechtsbündig

## Änderungen

### 1. Keine Lesebestätigung im Mitarbeiter-Widget
- Das Widget markiert Nachrichten des Managers nicht mehr als gelesen — es wird also keine Lesebestätigung an den Manager gesendet.
- Bei eigenen (Mitarbeiter-)Nachrichten wird immer nur ein einzelner Haken plus Uhrzeit angezeigt, nie der doppelte "gelesen"-Haken.
- Der Manager-/Superadmin-Bereich bleibt unverändert (dort weiterhin Lesebestätigung wie bisher).
- Ungelesen-Zähler am Widget-Button bleibt lokal erhalten, wird beim Öffnen aber nur optisch zurückgesetzt, ohne Schreibvorgang.

### 2. Uhrzeit rechtsbündig
Aktuell reservieren die (unsichtbaren) Bearbeiten-/Löschen-Icons rechts neben der Uhrzeit Platz, wodurch Uhrzeit und Haken nach links versetzt wirken. Künftig:
- Uhrzeit und Haken stehen bei eigenen Nachrichten bündig am rechten Rand der Blase.
- Die Bearbeiten-/Löschen-Icons rutschen links neben die Uhrzeit und belegen im Ruhezustand keinen Platz mehr (kein Layout-Sprung beim Hover).

## Technisch
- `src/components/chat/ChatThread.tsx`: neue Prop `readReceipts?: boolean` (Default `true`); bei `false` immer `Check` statt `CheckCheck`. Hover-Aktionen in der Meta-Zeile vor den Zeitstempel verschieben und mit `hidden group-hover:flex` (statt `opacity-0`) rendern, damit der rechte Abschluss exakt bündig ist.
- `src/components/chat/MitarbeiterChatWidget.tsx`: `markRead()`-Aufruf entfernen, lokalen `seen`-State für den Badge nutzen, `readReceipts={false}` an `ChatThread` übergeben.
