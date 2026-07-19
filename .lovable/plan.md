Anpassung der Sidebar-Gruppierungs-Labels in `src/components/superadmin/AppSidebar.tsx` und `src/components/mitarbeiter/AppSidebar.tsx`.

Aktueller Zustand:
- Die Sidebar-Menüpunkte nutzen `text-sidebar-foreground/80`.
- Die Gruppentitel (z. B. „Allgemein“, „Arbeit“, „Persönlich“) nutzen `text-foreground/80`, wodurch sie auf dem dunklen Sidebar-Hintergrund schlecht lesbar sind.

Geplante Änderung:
- Die `SidebarGroupLabel`-Komponente in beiden Sidebars auf `text-sidebar-foreground/80` (bzw. ohne separate Farbabweichung) umstellen, sodass die Gruppentitel optisch zur gleichen Farbfamilie wie die darunterliegenden Menüpunkte gehören.
- Trennpunkt vor dem Label bleibt als primärer Akzent unverändert erhalten.
- Keine Änderungen an Datenbank, Edge Functions oder Routen.

Betroffene Dateien:
- `src/components/superadmin/AppSidebar.tsx`
- `src/components/mitarbeiter/AppSidebar.tsx`

Validierung:
- Typecheck/Build nach den Änderungen ausführen, um sicherzustellen, dass keine Token-Typfehler entstehen.