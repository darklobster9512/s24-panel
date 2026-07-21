Badge für offene Arbeitsverträge korrigieren, damit abgeschlossene Verträge nicht mitgezählt werden.

Schritte:
1. In `src/components/superadmin/AppSidebar.tsx` die Count-Query anpassen:
   - Statt nur `status = 'pending_admin'` werden alle nicht abgeschlossenen Status gezählt (`pending_admin` und `pending_employee`).
   - Abgeschlossene Verträge (`completed`) werden explizit ausgeschlossen.
2. Query-Key anpassen (`pending-contracts-count` → `open-contracts-count`), damit React Query die aktualisierte Logik nicht aus dem Cache nimmt.
3. Prüfen, dass das Badge bei 0 offenen Verträgen weiterhin ausgeblendet bleibt.

Technische Details:
- Datei: `src/components/superadmin/AppSidebar.tsx`
- Aktuelle Query: `.eq("status", "pending_admin")`
- Neue Query: `.in("status", ["pending_admin", "pending_employee"])` bzw. `.neq("status", "completed")`
- Keine Datenbank-Änderung nötig; die Status-Werte existieren bereits im `employee_contract_status` Enum.