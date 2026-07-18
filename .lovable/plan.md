## Ziel
Abmelden-Button aus dem Header in einen Sidebar-Footer verschieben — darüber Name + E-Mail des eingeloggten Nutzers.

## Betroffene Bereiche
- **Superadmin** (`src/components/superadmin/AppSidebar.tsx` + Header in `SuperadminLayout.tsx`)
- **Mitarbeiter** (`src/components/mitarbeiter/AppSidebar.tsx` + Header in `MitarbeiterLayout.tsx`)
- **Kunde** hat aktuell keine Sidebar (nutzt `DashboardShell` mit Header). Da der User explizit „Sidebar ganz nach unten" sagt, lasse ich das Kunde-Panel unverändert — es hat keinen Sidebar-Kontext. Falls doch gewünscht, separater Schritt.

## Neue Komponente
`src/components/SidebarUserFooter.tsx` — wiederverwendbar für beide Sidebars:
- Nutzt `useAuth()` für `user`
- Zusätzliche Query auf `profiles.full_name` (oder Employee `first_name/last_name` für Mitarbeiter — fallback über profiles, das reicht für alle Rollen); bei leerem Namen: E-Mail-Präfix
- Layout: Avatar-Kreis mit Initialen · Name (fett, truncate) + E-Mail (klein, muted) · Logout-Icon-Button rechts
- Collapsed-Zustand (`useSidebar().state === "collapsed"`): nur Avatar + Logout-Icon
- Ruft `signOut()` + `navigate("/auth", { replace: true })`

## Änderungen
1. **`SidebarUserFooter.tsx`** neu erstellen.
2. **`superadmin/AppSidebar.tsx`**: `SidebarFooter` importieren, `<SidebarUserFooter />` am Ende einfügen.
3. **`mitarbeiter/AppSidebar.tsx`**: gleich.
4. **`SuperadminLayout.tsx`**: E-Mail-Anzeige + Abmelden-Button aus Header entfernen; `SidebarTrigger` und optionaler Titel bleiben.
5. **`MitarbeiterLayout.tsx`**: gleiche Header-Aufräumung.

## Nicht enthalten
- Kunde-Dashboard (kein Sidebar-Layout)
- Design-Refactor des DashboardShell
