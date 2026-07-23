Plan: „Termin-Link kopieren"-Button im Bewerbungs-Detail-Sheet

1. Ziel
Im Bewerbungs-Detail-Sheet (rechte Sidebar unter `/superadmin/bewerbungen`) soll neben „Termin-Link senden" ein weiterer Button erscheinen, der den öffentlichen Bewerbungsgespräch-Link in die Zwischenablage kopiert.

2. Technische Umsetzung

2.1 Datenmodell
- `applications`-Tabelle hat bereits `booking_token uuid` (verifiziert über bestehende `sendInvite`-Logik).
- Der Application-Typ in `src/pages/superadmin/Bewerbungen.tsx` enthält `booking_token` noch nicht — wird ergänzt.

2.2 URL-Format
- Öffentliche Buchungsseite: `/bewerbungsgespraech/:token` (bereits in `src/App.tsx` vorhanden).
- Link: `${window.location.origin}/bewerbungsgespraech/${booking_token}`.

2.3 Neue Funktion `copyBookingLink`
- Prüft, ob `selected.booking_token` vorhanden ist.
- Falls nicht, lädt den Token per Supabase-Query nach (einmaliger Fallback, damit auch ältere Bewerbungen funktionieren, die vor Öffnen des Sheets keinen Token hatten).
- Schreibt die URL in die Zwischenablage (`navigator.clipboard.writeText`).
- Zeigt Toast: „Termin-Link kopiert".
- Fehlerfall: Toast „Link konnte nicht kopiert werden".

2.4 UI-Änderung
- In der Button-Gruppe im Sheet (Zeilen 474–498) wird ein neuer Button `variant="outline"` eingefügt:
  - Icon: `Copy` (bereits importiert).
  - Label: „Termin-Link kopieren".
  - Aktion: `copyBookingLink(selected)`.
  - Disabled: solange keine `booking_token` geladen werden kann.
- Reihenfolge der Buttons:
  1. „Termin-Link senden" (primary)
  2. „Termin-Link kopieren" (outline)
  3. „Lebenslauf öffnen" (outline)
  4. „Löschen" (destructive)

3. Keine Änderungen an
- Edge Functions, Datenbank-Schema oder anderen Seiten.
- Die bestehende `sendInvite`-Funktion bleibt unverändert; der neue Button arbeitet unabhängig davon.

4. Akzeptanzkriterien
- Im Sheet einer Bewerbung ist ein „Termin-Link kopieren"-Button sichtbar.
- Klick kopiert den Link `/bewerbungsgespraech/<token>` in die Zwischenablage.
- Erfolgsmeldung wird angezeigt.
- Button funktioniert sowohl für frisch genehmigte Bewerbungen als auch für solche, bei denen der Token nachträglich geladen werden muss.