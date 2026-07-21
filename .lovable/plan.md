# Badge für offene Arbeitsverträge in Superadmin-Sidebar

## Ziel
Im Superadmin-Sidebar-Menüpunkt **Arbeitsverträge** soll ein kleiner Badge mit der Anzahl der offenen Arbeitsverträge angezeigt werden — also Verträge mit Status `pending_admin` (warten auf Bestätigung).

## Datei
- `src/components/superadmin/AppSidebar.tsx`

## Umsetzung

1. **Datenabfrage**
   - In `SuperadminSidebar` eine `useQuery` hinzufügen, die von `employee_contracts` die Anzahl der Zeilen mit `status = 'pending_admin'` abruft.
   - Query-Key: `["pending-contracts-count"]`.

2. **Badge-Anzeige**
   - Die `finItems`-Definition erweitern, sodass einzelne Items ein optionales `badge` (Zahl oder null) erhalten können.
   - Im `renderGroup`-Loop rechts neben dem Titel ein kleines Badge rendern, wenn `item.badge > 0`.
   - Stil: kompaktes `Badge` (z. B. shadcn `Badge` oder eigenes `span`) in Akzentfarbe/Primary, abgerundet, mit der Zahl.
   - Im eingeklappten Sidebar-Zustand (`collapsed`) wird das Badge ausgeblendet, um Platz zu sparen.

3. **RLS-Prüfung**
   - Vor der Umsetzung prüfen, ob die aktuellen RLS-Policies auf `employee_contracts` dem Superadmin das Lesen aller Einträge erlauben. Falls nicht, wird eine passende Policy ergänzt (z. B. über `public.has_role(auth.uid(), 'superadmin')`).

4. **Reaktivität**
   - Die Anzahl aktualisiert sich automatisch, wenn sich der Status eines Vertrags ändert (z. B. durch Admin-Bestätigung oder Mitarbeiter-Signatur), weil die Query-Invalidierung in den bestehenden Mutations bereits erfolgt.

## Ergebnis
Der Superadmin sieht auf einen Blick, wie viele Arbeitsverträge noch auf seine Bestätigung warten, ohne die Seite besuchen zu müssen.