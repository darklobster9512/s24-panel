## Superadmin Panel – Struktur & Reiter

Sidebar-Layout (shadcn `Sidebar`, collapsible), Header mit Suche + User-Menü, Content-Bereich pro Route. Alle Daten als Mockup, damit du das Layout siehst — echte Supabase-Anbindung machen wir schrittweise danach.

### Vorgeschlagene Reiter

**1. Übersicht (`/superadmin`)**
- KPI-Karten: Kunden, Mitarbeiter, Anrufe heute, offene Tickets, offene Auszahlungen
- Live-Status Mitarbeiter (Verfügbar / Im Gespräch / Pause)
- Letzte Anrufe, letzte Tickets, System-Events
- Umsatz-Chart (12 Monate)

**2. Kunden (`/superadmin/kunden`)**
- Tabelle: Name, Firma, Plan, zugewiesene Mitarbeiter, Anrufe/Monat, Status
- Aktionen: Kunde anlegen, bearbeiten, deaktivieren
- Detailseite: Stammdaten, zugewiesene Mitarbeiter, Anruf-Historie, Notizen, Tickets, Rechnungen

**3. Mitarbeiter (`/superadmin/mitarbeiter`)**
- Tabelle: Name, Rolle, zugewiesene Kunden, Anrufe/Monat, Status, Vertragstyp
- Aktionen: Mitarbeiter anlegen (Einladung per E-Mail), bearbeiten, deaktivieren
- Detailseite: Stammdaten, zugewiesene Kunden, Performance, Arbeitsvertrag, Auszahlungen

**4. Zuweisungen (`/superadmin/zuweisungen`)**
- Matrix Mitarbeiter × Kunden mit Toggle
- Bulk-Aktionen (mehrere Kunden einem Mitarbeiter zuweisen)
- Auf dieser Basis darf der Mitarbeiter Calls/Notizen zu genau diesen Kunden anlegen

**5. Anrufe (`/superadmin/anrufe`)**
- Globales Anruf-Log über alle Kunden/Mitarbeiter
- Filter: Datum, Kunde, Mitarbeiter, Richtung, Dauer, Status
- Detailansicht: Transkript-Platzhalter, Notizen, Tags, Anhänge

**6. Notizen (`/superadmin/notizen`)**
- Suchbare Liste aller Call-Notizen, Filter nach Kunde/Mitarbeiter/Zeitraum
- Detailansicht mit verknüpftem Anruf und Kunde

**7. Tickets (`/superadmin/tickets`)**
- Board oder Tabelle mit Status (Neu / In Bearbeitung / Wartet / Erledigt)
- Trennung: Kunden-Tickets vs. Mitarbeiter-Tickets (Tab-Filter)
- Priorität, Zuständigkeit, letzte Aktivität

**8. Verträge (`/superadmin/vertraege`)**
- Arbeitsverträge Mitarbeiter: Typ (Vollzeit/Teilzeit/Freelance), Stundensatz/Gehalt, Startdatum, PDF-Platzhalter
- Kundenverträge: Plan, Laufzeit, Kündigungsfrist

**9. Auszahlungen (`/superadmin/auszahlungen`)**
- Tabelle: Mitarbeiter, Zeitraum, Stunden/Calls, Betrag, Status (Offen / Freigegeben / Ausgezahlt)
- Aktionen: Freigeben, als ausgezahlt markieren, Export CSV

**10. Abrechnung (`/superadmin/abrechnung`)** *(optional)*
- Kunden-Rechnungen, Umsätze, offene Posten, Mahnwesen-Mock

**11. Einstellungen (`/superadmin/einstellungen`)**
- Firmendaten, Rollen & Berechtigungen, Integrationen (Telefonie, E-Mail), Branding

### Technisches

- Neues Layout `SuperadminLayout` mit `SidebarProvider` + `AppSidebar` (Icons + Labels, collapse zu Icon-Rail)
- Route-Struktur: `/superadmin` als Parent mit `<Outlet/>`, Child-Routes je Reiter, alles unter bestehendem `RequireRole allow={["superadmin"]}`
- Neue Dateien unter `src/pages/superadmin/` (Overview, Kunden, Mitarbeiter, Zuweisungen, Anrufe, Notizen, Tickets, Vertraege, Auszahlungen, Einstellungen) — alles Mockup-Daten, keine DB-Schema-Änderungen in diesem Schritt
- `DashboardShell` bleibt für Kunde/Mitarbeiter unverändert; Superadmin bekommt eigenes Shell mit Sidebar
- Styling konsistent mit bestehendem Design (bg-mesh, shadow-card-elegant, `text-primary` = #7bed9f)

### Rückfragen

1. Alle 11 Reiter oder erstmal ein reduziertes Set (z.B. Übersicht, Kunden, Mitarbeiter, Zuweisungen, Anrufe, Tickets, Auszahlungen)?
2. Sollen die Anlegen/Bearbeiten-Dialoge schon als funktionale Modals gebaut werden (mit Formvalidierung, ohne DB) oder reines Read-Only-Mockup?
3. Abrechnung/Rechnungen an Kunden als eigener Reiter, oder erstmal weglassen?
