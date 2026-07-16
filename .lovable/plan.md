## Änderungen

1. **Logo-Text umbenennen** — überall wo aktuell „Assistify Pro" steht, ersetzen durch „Sekreteriat**24**", wobei die „24" in der Akzentfarbe (`text-primary`, #7bed9f) gerendert wird:
   - `src/pages/Auth.tsx` (Branding-Panel links)
   - `src/components/DashboardShell.tsx` (Header-Logo in allen drei Dashboards)
   - `src/pages/Auth.tsx` — Willkommens-Untertitel bleibt generisch

2. **Auth-Card höher machen** — Card ist aktuell nur so hoch wie der Formular-Inhalt. Ich gebe der Card eine Mindesthöhe (z. B. `min-h-[640px]`), damit sie deutlich vertikal wächst. Das linke Branding-Panel füllt den Extra-Platz automatisch (bereits `flex flex-col justify-between`), und rechts wird das Formular zentriert. Betroffen: der Grid-Wrapper in `src/pages/Auth.tsx`.

Keine sonstigen Änderungen — Farben, Layout-Split 50/50 und Funktionalität bleiben identisch.