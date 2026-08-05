# Livechat-Widget: Mobile Vollbild + dunkelblauer Header

## Ziel
Das Livechat-Widget im Mitarbeiter-Panel soll auf Mobilgeräten den kompletten Bildschirm einnehmen und auf dem Desktop einen Header in derselben dunkelblauen Farbe wie die Sidebar bekommen.

## Änderungen

### 1. Mobile: Vollbild
- Unter der `md`-Breakpoint-Grenze öffnet sich das Widget als Vollbild-Overlay (gesamte Höhe/Breite, keine abgerundeten Ecken, kein Abstand zum Rand).
- Ab `md` bleibt das bisherige schwebende Panel unten rechts (360 x 520 px, abgerundet, Schatten).
- Im Vollbild-Modus wird der runde Chat-Button ausgeblendet, solange der Chat offen ist; geschlossen wird über das X im Header.
- Scroll-Sperre des Hintergrunds, solange das Vollbild offen ist.

### 2. Desktop: Header-Farbe
- Header-Hintergrund auf das Sidebar-Token (dunkelblau, `--color-sidebar` / `sidebar-foreground`) umstellen — inklusive Name, Statuszeile und Schließen-Button in passender heller Schrift.
- Obere Ecken des Panels bleiben abgerundet, der Header wird sauber abgeschnitten.

## Technisch
- Datei: `src/components/chat/MitarbeiterChatWidget.tsx`
- Responsives Layout über Tailwind-Klassen (`inset-0 md:inset-auto md:bottom-24 md:right-6 ...`), keine zusätzliche JS-Breakpoint-Logik nötig.
- Farben ausschließlich über semantische Tokens `bg-sidebar` / `text-sidebar-foreground`, keine Hardcodes.
- `ChatThread` bleibt unverändert.
