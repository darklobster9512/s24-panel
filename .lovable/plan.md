Fix: Sidebar-Logo beim Einklappen nicht verzerren

Problem: Das Logo-Icon in `SidebarHeader` ist mit `h-9 w-9` (36px) fest skaliert. Die eingeklappte Sidebar ist nur 3rem (48px) breit; mit `px-2` (16px Padding) bleiben nur 32px. Dadurch wird das Icon gestaucht/verzerrt.

Schritte:
1. In `src/components/superadmin/AppSidebar.tsx` und `src/components/mitarbeiter/AppSidebar.tsx` den Header-Container anpassen:
   - `justify-center` statt `items-center gap-2.5`, wenn eingeklappt (`collapsed`).
2. Logo-Icon bedingt kleiner skalieren:
   - Eingeklappt: `h-7 w-7` (28px) oder `h-8 w-8` (32px).
   - Ausgeklappt: unverändert `h-9 w-9`.
3. Überlappung/Komprimierung in der eingeklappten Sidebar verhindern (z.B. kein horizontaler Padding-Overflow).
4. Preview prüfen: Sidebar ein- und ausklappen, Logo bleibt proportional und nicht verzerrt.

Betroffene Dateien:
- `src/components/superadmin/AppSidebar.tsx`
- `src/components/mitarbeiter/AppSidebar.tsx`