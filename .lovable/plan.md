## Sidebar: Aktive Reiter als grüne Pille

### Ziel
Optische Hervorhebung des aktiven Sidebar-Reiters: grüner Hintergrund (#7bed9f) mit abgerundeten Ecken (Pille), passend zum bestehenden Light-Theme und der Marke Sekreteriat24.

### Änderungen

1. **Datei: `src/components/superadmin/AppSidebar.tsx`**
   - Den `SidebarMenuButton` um Styling erweitern, das bei `isActive` einen grünen Pillen-Hintergrund (`bg-primary`, `text-ink-deep`, `rounded-full`) erhält.
   - Sicherstellen, dass der aktive Zustand im Collapsed-Mode weiterhin gut erkennbar bleibt (Icon zentriert, eventuell Tooltips).
   - Inaktive Reiter behalten das aktuelle neutrale Styling (`hover:bg-muted/50`).
   - Grün als Textfarbe nur auf dem aktiven Reiter, damit der Kontrast zur grünen Fläche stimmt.

2. **Visuelles Verhalten**
   - Aktiver Reiter: grüne Pille, dunkle Schrift/Symbol.
   - Hover inaktiver Reiter: leichter grauer Hintergrund (bestehendes Verhalten).
   - Keine Änderung an der Sidebar-Struktur, den Gruppen oder den Links selbst.

### Technische Details
- Nutzt die bereits definierten Design-Tokens: `--primary` (#7bed9f), `--primary-foreground` (#0f1a2e), `--radius` (1rem).
- Keine neuen Abhängigkeiten, keine Datenbank- oder Auth-Änderungen.
- Nach der Änderung wird die Sidebar im Browser auf korrekte Darstellung in normaler und eingeklappter Ansicht geprüft.
