````text
Ziel: Der Scrollbar-Thumb in der Sidebar soll nicht mehr grün sein, sondern zur dunkelblauen Sidebar-Hintergrundfarbe (#130f40) passen, nur leicht heller, damit er dezent sichtbar ist.

Geplante Änderungen:
1. In `src/styles.css` den `.custom-sidebar-scrollbar::-webkit-scrollbar-thumb` anpassen:
   - Thumb-Farbe auf eine hellere Variante des Sidebar-Hintergrundblaus setzen (z. B. `#1a1c4e` oder `#232654`), leicht transparent, damit er sich subtil abhebt.
   - Hover-State auf eine noch etwas hellere Nuance (z. B. `#2a2d6e`) setzen, aber immer noch im blauen Farbbereich bleiben.
2. Firefox-`scrollbar-color` entsprechend anpassen (Thumb: helles Blau, Track: transparent).
3. Keine weiteren Änderungen an Breite, Funktionalität oder anderen Komponenten.

Keine weiteren Dateien betroffen.
````