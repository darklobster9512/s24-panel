## Ziel
E-Mail im Sidebar-Footer ausblenden und die Sidebar insgesamt visuell aufwerten (Superadmin + Mitarbeiter).

## Änderungen

### 1. `SidebarUserFooter.tsx`
- E-Mail-Zeile komplett entfernen.
- Footer-Card kompakter: Avatar + Name (fett) + kleine Rollen-Badge in Primär-Grün darunter.
- Logout-Button als Icon-Button rechts, mit Hover-State (rot-tint).
- Collapsed: nur Avatar mit Rollen-Dot als kleines Indikator-Badge unten rechts.

### 2. Sidebar-Optik (`superadmin/AppSidebar.tsx` + `mitarbeiter/AppSidebar.tsx`)
- **Header/Brand**: größerer, klarerer Brand-Block mit dezentem Gradient-Hintergrund, klare Trennung durch Border-Bottom.
- **Group-Labels**: kleiner, mehr Letter-Spacing, muted-foreground, mehr vertikaler Abstand zu Items.
- **Menu-Items**:
  - Default: transparent, Icon in muted-foreground, sanfter `hover:bg-sidebar-accent/60`.
  - Aktiv: statt runder Pille → abgerundetes Rechteck (`rounded-lg`) mit Primär-Grün-Hintergrund, kräftigem Text, subtiler Schatten und einem 3px-Akzentbalken links. Wirkt hochwertiger als die aktuelle Vollpille und fügt sich besser in Sidebar-Grid ein.
  - Konsistente Höhe (`h-9`), Icon-Container mit fester Breite für sauberes Alignment.
- **Spacing**: mehr Padding im Sidebar-Content, Groups mit klarem Abstand.
- **Border**: rechte Border der Sidebar mit sanftem Verlauf/leichter Schatten für Tiefe.

### 3. Nicht betroffen
- Routing, Auth-Logik, DB — nur Präsentation.
- Kunde-Panel (kein Sidebar-Layout).

## Offene Frage
Aktiv-Style-Präferenz: Ich schlage abgerundetes Rechteck mit linkem Akzentbalken vor (moderner, professioneller als volle Pille). Falls du die Pillen-Form beibehalten willst, sag Bescheid — dann bleibt `rounded-full` und ich verfeinere nur Padding/Schatten.
