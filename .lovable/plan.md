# Lebenslauf direkt in Bewerbungs-Sidebar anzeigen

## Ziel
Wenn am `/superadmin/bewerbungen` eine Bewerbung angeklickt wird, öffnet sich rechts die Detail-Sidebar. Diese Sidebar soll erweitert werden, sodass der Lebenslauf (PDF/Bild) direkt **links an die Sidebar angehängt** angezeigt wird — also zweispaltig innerhalb des Sheets: links Lebenslauf-Vorschau, rechts die bestehenden Info-Felder & Aktionen. Das separate Vorschau-Dialog-Popup fällt damit weg.

## Datei
`src/pages/superadmin/Bewerbungen.tsx`

## Änderungen

### 1. Lebenslauf-URL beim Öffnen der Sidebar automatisch laden
- Neuer State `cvUrl: string | null` und `cvLoading: boolean`.
- `useEffect`, der reagiert, wenn `selected` gesetzt wird: falls `selected.lebenslauf_path` existiert, automatisch `supabase.storage.from("applications").createSignedUrl(...)` aufrufen und `cvUrl` setzen. Beim Schließen/Switch der Bewerbung zurücksetzen.
- Die bestehende `openLebenslauf`-Funktion wird nicht mehr gebraucht (Popup entfällt); die Logik wandert in den Effect.

### 2. Sheet auf zweispaltiges Layout erweitern
- `SheetContent` von `sm:max-w-lg` auf breiteres `sm:max-w-5xl` (o.ä.) setzen.
- Inhalt als `flex`-Row: linker Pane (feste Breite ~60%, scrollbar) = Lebenslauf-Vorschau; rechter Pane (~40%, scrollbar) = bestehende Felder + Aktionen.
- Vorschau-Rendering wie bisher im Dialog: PDF als `<iframe>`, Bild als `<img>`, sonst Hinweis „Vorschau nicht möglich" + Download-Link. Wenn kein Lebenslauf vorhanden: im linken Pane Platzhalter „Kein Lebenslauf hochgeladen".
- Schließen-Button (X) bleibt oben rechts funktionsfähig.

### 3. Entfernen des separaten Vorschau-Dialogs
- `preview`-State und der `<Dialog>`-Block werden entfernt.
- „Lebenslauf öffnen"-Button wird zu „In neuem Tab öffnen" (öffnet `cvUrl` via `<a target=_blank>`) oder ganz weggelassen, da die Vorschau inline ist. Behalten als optionaler „Extern öffnen"-Link.

## Technische Details
- Signed-URL-Gültigkeit: 10 Minuten wie bisher.
- Mime-Erkennung aus `selected.lebenslauf_mime`.
- Responsive: auf schmalen Viewports (< sm) Stack untereinander (Vorschau oben, Felder unten) via `flex-col sm:flex-row`.
- Keine Änderungen an DB, Storage oder Edge Functions.

## Nicht Teil dieses Plans
- Die Tabellen-/Spalten-Ansicht der Bewerbungsliste bleibt unverändert.
- Keine Änderungen an Ranking/Status-Logik.
