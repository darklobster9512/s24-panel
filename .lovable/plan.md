````text
Ziel: Der grüne Scrollbar-Thumb in der Superadmin-Sidebar ist zu grell. Er soll dezenter/dunkler werden.

Geplante Änderungen:
1. In `src/styles.css` den `.custom-sidebar-scrollbar::-webkit-scrollbar-thumb` anpassen:
   - Thumb nicht mehr in vollem Primary-Grün (#7bed9f), sondern in einer dunkleren, gedämpften Grün-Variante (z. B. #2dd47a oder #22c55e), leicht transparent, damit er sich sanfter vom dunkelblauen Sidebar-Hintergrund abhebt.
   - Hover-State ebenfalls etwas heller, aber nicht grell.
2. Falls gewünscht, den Track sehr leicht mit einem dunklen Blau hinterlegen (z. B. `rgba(15, 26, 46, 0.4)`), damit der Scrollbar-Balken besser sichtbar ist, aber dezent bleibt.
3. Keine Änderungen an der Funktionalität oder der Breite der Scrollbar.

Keine weiteren Dateien betroffen.
````