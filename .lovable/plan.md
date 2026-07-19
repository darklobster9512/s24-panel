Sidebar-Design optimieren

1. Divider entfernen
   - Entferne `border-t`/`border-b` Klassen aus `SidebarHeader`, `SidebarFooter` und ggf. `SidebarContent`-Trennungen in `src/components/superadmin/AppSidebar.tsx` und `src/components/mitarbeiter/AppSidebar.tsx`.

2. Gruppierungs-Labels besser sichtbar machen
   - Ersetze die aktuellen dezenten grauen Labels (`text-muted-foreground/70`) durch stärkere Typografie: `text-[11px]`, `font-bold`, `text-foreground/80`, `uppercase tracking-wider`, mit etwas mehr Abstand und dezenterem visueller Trennung (z. B. kleiner Akzentpunkt oder Linie links). Labels sollen klar als Gruppenüberschriften erkennbar sein.

3. Weiße Outline um User-Footer entfernen
   - Entferne `border border-sidebar-border/50` und `bg-sidebar-accent/30` aus der Footer-Box in `src/components/SidebarUserFooter.tsx`. Stattdessen ein flacher, simpler Footer ohne Rahmen, passend zur restlichen Sidebar.

Technische Details:
- Betroffene Dateien: `src/components/superadmin/AppSidebar.tsx`, `src/components/mitarbeiter/AppSidebar.tsx`, `src/components/SidebarUserFooter.tsx`.
- Keine Backend-Änderungen, keine Datenbank-Änderungen.
- Fokus auf Styling-Anpassungen mit bestehenden Design-Tokens.