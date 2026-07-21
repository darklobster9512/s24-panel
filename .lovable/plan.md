Das Ticket-System wird vollständig aus dem Portal entfernt — sowohl Mitarbeiter- als auch Superadmin-Bereich, inkl. Routen, Sidebar-Einträgen, Mock-Daten und der Ticket-Checkbox auf der Erfassungs-Seite.

### 1. Routen & Seiten entfernen
- `src/App.tsx`:
  - Imports `SuperadminTickets` und `MitarbeiterTickets` entfernen.
  - Routen `path="tickets"` unter `/superadmin` und `/mitarbeiter` entfernen.
- Dateien löschen:
  - `src/pages/superadmin/Tickets.tsx`
  - `src/pages/mitarbeiter/Tickets.tsx`

### 2. Sidebar-Einträge entfernen
- `src/components/mitarbeiter/AppSidebar.tsx`: „Tickets"-Eintrag und `Ticket`-Icon-Import entfernen.
- `src/components/superadmin/AppSidebar.tsx`: „Tickets"-Eintrag und `Ticket`-Icon-Import entfernen.

### 3. Ticket-Bezüge in anderen Seiten entfernen
- `src/pages/mitarbeiter/Erfassen.tsx`:
  - State `ticketErstellen` inkl. `setTicketErstellen`, das Checkbox-UI („Ticket erstellen (Aufgabe für Kunde)") und der Payload-Key `ticket_erstellen` beim Insert in `call_notes` entfernen.
- `src/pages/mitarbeiter/KundeDetail.tsx`:
  - Panel „Offene Tickets" komplett entfernen inkl. Filter/Import von `MOCK_TICKETS`.
- `src/pages/mitarbeiter/Statistik.tsx`:
  - `StatCard` „Tickets erstellt" und `Ticket`-Icon-Import entfernen.
- `src/pages/superadmin/Einstellungen.tsx`:
  - Text „Eigene Anrufe, Notizen, Tickets" auf „Eigene Anrufe, Notizen" kürzen.
- `src/lib/mitarbeiter-mock.ts`:
  - Interface `MockTicket` und Array `MOCK_TICKETS` entfernen.

### 4. Datenbank-Schema aufräumen
- Migration: Spalte `ticket_erstellen` aus `public.call_notes` entfernen (`ALTER TABLE public.call_notes DROP COLUMN ticket_erstellen`).
- Keine weiteren Tabellen zu droppen (es gibt keine separate `tickets`-Tabelle).

### 5. Verifikation
- Build (`bun run build`) muss ohne TS-Fehler durchlaufen.
- `rg -i ticket src/ supabase/` sollte danach keine relevanten Treffer mehr liefern.