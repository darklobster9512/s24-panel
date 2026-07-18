## /mitarbeiter Panel — Mockup-Plan

Alle Seiten reine Frontend-Mockups mit Dummy-Daten. Keine DB/Edge-Function-Anbindung. Softphone bleibt lokal (Phonerlite) — das Panel ist der Kontext- und Dokumentations-Layer. Sekretärinnen sehen nur Anrufe/Daten ihrer **zugewiesenen** Kunden (im Mockup: gefilterte Dummy-Liste).

### Layout & Shell

Neue Datei `src/components/mitarbeiter/MitarbeiterLayout.tsx` mit Sidebar analog zum Superadmin-Panel (gleiche grüne Pillen-Optik). Struktur:

```text
Sidebar                Content
──────────           ─────────────────────────
Cockpit              Header (Titel, Status-Pill „Verfügbar/Pause/Im Anruf")
Meine Kunden         + „Anruf starten"-Button (global)
Live-Anrufe          
Anruf erfassen       [Outlet]
Notizen              
Tickets              
Meine Statistik      
Profil & Vertrag     
```

Route-Änderung in `src/App.tsx`: aus der Single-Route `/mitarbeiter` wird ein Layout mit Kind-Routen. Bestehende `src/pages/Mitarbeiter.tsx` wird durch `Cockpit.tsx` ersetzt.

### Reiter im Detail

**1. Cockpit** (`/mitarbeiter`)
Startseite. Status-Toggle (Verfügbar / Pause / Nicht bereit), 4 KPI-Cards (Anrufe heute, Ø Gesprächszeit, Offene Notizen, Zugewiesene Kunden), Panel „Meine zugewiesenen Kunden" als kompakte Logo-Grid, Panel „Letzte Anrufe" (Timeline).

**2. Meine Kunden** (`/mitarbeiter/kunden`)
Grid aus Kunden-Cards (Logo, Name, Branche, Telefon). Klick → `/mitarbeiter/kunden/:id` mit vollem Kunden-Cockpit: Firmendaten, Firmeninhalt, Begrüßungstext, Weiterleitungs-Nummer, Ansprechpartner, letzte Anrufe/Notizen/Tickets für diesen Kunden, Button „Anruf für diesen Kunden erfassen".

**3. Live-Anrufe** (`/mitarbeiter/live`)
Realtime-Liste (Mockup) eingehender Anrufe für zugewiesene Kunden. Card pro Anruf: Kundenlogo, Anrufernummer, gerufene Nummer, Wartezeit-Ticker. Button „Erfassen starten" öffnet den Erfassungs-Flow mit vorbelegten Feldern (später aus sipgate `newCall`-Webhook). Info-Banner oben: „Anrufe werden über sipgate Push-API automatisch erkannt — aktuell Mockup-Daten."

**4. Anruf erfassen** (`/mitarbeiter/erfassen`)
Der zentrale Arbeits-Screen. 2-Spalten-Layout:
- **Links (Kontext):** Kundenauswahl-Card (falls nicht aus Live-Anruf vorbelegt) → nach Auswahl Anzeige von Firmeninhalt, Begrüßungstext, Ansprechpartner, Weiterleitung Ja/Nein.
- **Rechts (Formular):** Start/Stop-Button mit Timer (manuell, da lokales Softphone). Felder: Anrufer Name, Anrufer Telefon, Anrufer Email (optional), Anliegen (Textarea), Kategorie-Dropdown (Rückruf / Termin / Info / Beschwerde / Weiterleitung), Priorität, Weitergeleitet-an, Ticket-erstellen-Checkbox, Rückruf-erwünscht-Checkbox mit Zeit. Buttons: „Speichern & Neu", „Speichern & Schließen".

**5. Notizen** (`/mitarbeiter/notizen`)
Liste aller eigenen Notizen (nur eigene / nur zugewiesene Kunden), Suche, Filter nach Kunde/Datum/Kategorie. Card-Layout wie Superadmin-Notizen aber mit Bearbeiten-Button.

**6. Tickets** (`/mitarbeiter/tickets`)
Kanban-artige 3-Spalten-Ansicht (Offen / In Bearbeitung / Erledigt) oder einfache Tabelle. Ticket = eskalierter Anruf, der einen Rückruf/Aktion vom Kunden erfordert. Klick → Detail-Drawer mit Verlauf und Kommentaren.

**7. Meine Statistik** (`/mitarbeiter/statistik`)
Wochen-/Monats-Charts: Anrufe pro Tag (Balken), Ø Gesprächsdauer (Line), Verteilung nach Kategorie (Donut), Verteilung nach Kunde (Balken). Zeitraum-Umschalter.

**8. Profil & Vertrag** (`/mitarbeiter/profil`)
Read-only Anzeige der Mitarbeiter-Stammdaten (aus `employees`): Name, Login-Email, Vertragsart, Startdatum, Gehalt (nur eigene Sicht). Passwort-Ändern-Button. Sektion „Meine SIP-Zugangsdaten für Phonerlite" (Anleitung/Placeholder — kommt später aus einer noch anzulegenden Employee-SIP-Config).

### Sichtbarkeits-Regel (Mockup-Ebene bereits vorbereiten)

In allen Datenquellen (Dummy-Arrays) ein `assignedClientIds` Konzept: Mockup-Daten werden clientseitig gegen eine Liste zugewiesener Kunden-IDs gefiltert, damit später beim DB-Anschluss nur der Query gegen `assignments` getauscht werden muss. Ein zentraler Hook `useAssignedClients()` liefert im Mockup ein festes Array und wird später auf Supabase umgestellt.

### Was nicht Teil dieses Schritts ist

- Keine Datenbank-Migrationen (`calls`, `call_notes`, `tickets` etc.).
- Keine sipgate-Edge-Function.
- Keine Realtime-Subscriptions.
- Kein WebRTC-Softphone.

Alles davon kommt in einem Folge-Schritt, sobald die UI steht und du grünes Licht gibst.

### Technische Details

- Neue Dateien: `src/components/mitarbeiter/MitarbeiterLayout.tsx`, `src/components/mitarbeiter/AppSidebar.tsx`, `src/hooks/use-assigned-clients.ts`, `src/lib/mitarbeiter-mock.ts` (zentrale Dummy-Daten).
- Neue Pages: `src/pages/mitarbeiter/Cockpit.tsx`, `Kunden.tsx`, `KundeDetail.tsx`, `LiveAnrufe.tsx`, `Erfassen.tsx`, `Notizen.tsx`, `Tickets.tsx`, `Statistik.tsx`, `Profil.tsx`.
- `src/pages/Mitarbeiter.tsx` wird entfernt (durch Layout ersetzt).
- Routing in `src/App.tsx` erweitert (analog Superadmin, `RequireRole allow={["mitarbeiter"]}`).
- Kein neues npm-Paket nötig — Recharts/lucide/shadcn sind vorhanden.

Sag Bescheid, dann bau ich die Mockups.