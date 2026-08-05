# Outbound-Bewerbungsgespräche im Superadmin-Panel

Neuer Reiter im Superadmin-Dashboard, in dem die Bewerbungsgespräche der Outbound-Caller eingesehen werden können – pro Caller auswählbar, rein lesend.

## Funktionsumfang

- Neuer Sidebar-Eintrag "Outbound-Gespräche" in der Gruppe "Betrieb", Route `/superadmin/outbound-gespraeche` (nur Superadmin).
- Oben ein Dropdown mit allen Mitarbeitern, für die Outbound-Recruitment aktiviert ist (Vor-/Nachname). Standard: erster Eintrag.
- Darunter die Terminliste des gewählten Callers, mit den Ansichten "Anstehend" und "Vergangen", Suche, Blättern und manueller Aktualisierung – gleiche Darstellung wie im Mitarbeiter-Panel (Datum/Uhrzeit-Gruppierung, Name, Telefon, E-Mail, Anstellung, Status-Badge, Notizen).
- Keine Aktionen: keine Statusänderung, kein Panel-Link, keine Erinnerung. Reine Ansicht.
- Wenn kein Outbound-Mitarbeiter existiert oder kein API-Key hinterlegt ist, wird ein Hinweis statt der Liste angezeigt.

## Technische Umsetzung

- `supabase/functions/caller-api-proxy/index.ts`: zusätzlicher Zugriffsweg. Ist der aufrufende User Superadmin (`has_role`), darf er ein `employee_id` im Body mitschicken; der Proxy lädt dann den `caller_api_key` dieses Mitarbeiters (nur wenn `outbound_recruitment` aktiv). Für Superadmins werden ausschließlich die Lese-Aktionen `meta` und `list_interviews` zugelassen. Der bestehende Mitarbeiter-Pfad bleibt unverändert. API-Keys verlassen den Server weiterhin nicht.
- `src/hooks/use-caller-api.ts`: optionaler `employeeId`-Parameter für `callerApi`, `listInterviews`, `listUpcomingInterviews`, der an den Proxy durchgereicht wird (bestehende Aufrufe bleiben kompatibel).
- Neue Seite `src/pages/superadmin/OutboundGespraeche.tsx`: Query auf `employees` (`outbound_recruitment = true`, nicht Entwurf) für das Dropdown, danach React-Query-Abfragen mit `employeeId` in den Query-Keys; Read-only-Variante der Listendarstellung aus `src/pages/mitarbeiter/Bewerbungsgespraeche.tsx`.
- `src/App.tsx`: Route im Superadmin-Block registrieren.
- `src/components/superadmin/AppSidebar.tsx`: Eintrag in `opsItems` ergänzen (Icon `PhoneOutgoing`), für Manager nicht sichtbar.

Keine Datenbankänderungen nötig.
