# Zeiten blockieren für Bewerbungsgespräche

Neue Sektion in `/superadmin/einstellungen` direkt unter der Bewerbungsgespräch-Einladungs-Sektion, mit der einzelne Termin-Slots (Datum + Uhrzeit) blockiert werden können — analog zum Referenzprojekt.

## Was der Nutzer sieht

- Panel "Bewerbungsgespräch · Zeiten blockieren"
- Links: Kalender zur Datumsauswahl (Vergangenheit deaktiviert)
- Rechts: Raster aller Slots des gewählten Tages (aus Slot-Start/Ende/Intervall). Klick auf einen Slot blockiert ihn, erneuter Klick gibt ihn frei. Blockierte Slots sind rot markiert; bereits gebuchte Slots sind sichtbar und nicht klickbar.
- Optionales Feld "Grund" (z. B. Urlaub, Meeting), das beim Blockieren gespeichert wird
- Darunter eine Liste aller kommenden Blockierungen, nach Datum gruppiert, jeweils mit Grund und Entfernen-Button
- Abgelaufene Blockierungen (Datum in der Vergangenheit) werden automatisch aufgeräumt

## Wirkung auf die Buchungsseite

Blockierte Slots werden auf der öffentlichen Buchungsseite `/bewerbungsgespraech/:token` genauso ausgeblendet/deaktiviert wie bereits gebuchte Slots. Zusätzlich verhindert die Buchungslogik serverseitig, dass ein blockierter Slot gebucht werden kann.

## Technische Umsetzung

Datenbank (Migration):
- Neue Tabelle `public.interview_blocked_slots`: `id`, `blocked_date` (date), `blocked_time` (time), `reason` (text, nullable), `created_by`, `created_at`; Unique auf (`blocked_date`, `blocked_time`)
- GRANTs: `SELECT/INSERT/DELETE` für `authenticated`, `ALL` für `service_role`; kein anon-Grant (öffentlicher Zugriff läuft über die bestehende Security-Definer-RPC)
- RLS: Lesen/Schreiben/Löschen nur für `has_role(auth.uid(), 'superadmin')`
- `list_booked_interview_slots()` erweitern: liefert zusätzlich die blockierten Slots (mit Kennzeichnung `blocked`), damit die öffentliche Seite sie ohne direkten Tabellenzugriff sieht
- `book_interview_slot()` erweitern: `RAISE EXCEPTION 'slot_blocked'`, wenn Datum/Zeit blockiert ist

Frontend:
- Neue Komponente `src/components/superadmin/InterviewBlockedSlots.tsx` (Kalender + Slot-Raster + Liste), eingebunden in `src/pages/superadmin/Einstellungen.tsx` unterhalb der Einladungs-Sektion; nutzt die vorhandenen Slot-Einstellungen aus `app_settings`
- `src/pages/BewerbungsgespraechPublic.tsx`: blockierte Slots aus der RPC-Antwort filtern und Fehlermeldung für `slot_blocked` ergänzen
