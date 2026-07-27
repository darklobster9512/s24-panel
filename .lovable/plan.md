````text
Ziel: Die Scrollbar innerhalb der Superadmin-Sidebar (dunkelblauer Hintergrund #130f40) soll das Brand-Design verwenden – dezente, schmale Scrollbar mit grünem Thumb und dunklem Track.

Geplante Änderungen:
1. In `src/components/superadmin/AppSidebar.tsx` eine Markierung/Klasse an `SidebarContent` oder der Sidebar anbringen, damit das Styling gezielt auf die Sidebar-Scrollbar wirkt (z. B. `data-sidebar-scrollbar`).
2. In `src/styles.css` einen CSS-Block für Webkit- und Firefox-Scrollbars ergänzen:
   - `scrollbar-width: thin` (Firefox)
   - `scrollbar-color: var(--primary) var(--ink)` (Firefox)
   - Für Webkit: `::-webkit-scrollbar { width: 6px; }`, Track in transparent/dunkelblau, Thumb in Primary-Grün mit abgerundeten Ecken und Hover-State in etwas hellerem Grün.
3. Sicherstellen, dass die Scrollbar nicht global überschrieben wird, sondern nur innerhalb der Sidebar greift.

Keine Änderungen an anderen Komponenten oder an der Funktionalität der Sidebar geplant.
````