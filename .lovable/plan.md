## Problem 1 — "Full-page reload" beim Reiter-Wechsel

Ursache: In `src/App.tsx` sind alle Superadmin-Seiten per `lazy()` geladen und die `<Suspense>`-Grenze umfasst das gesamte `<Routes>`. Beim Wechsel zwischen z. B. `/superadmin/kunden` und `/superadmin/anrufe` wird beim ersten Aufruf jedes Chunks der `PageFallback` (Vollbild-Spinner) gezeigt — dadurch verschwindet auch Sidebar/Header kurz und es wirkt wie ein Reload.

Fix (klein, gezielt):
1. Alle Superadmin-Seiten **eager** importieren statt `lazy()` — es sind Mockups, sehr leicht. `SuperadminLayout` selbst darf lazy bleiben, das kostet nur einmal beim ersten Betreten von `/superadmin`.
2. In `SuperadminLayout.tsx` eine zusätzliche innere `<Suspense>`-Grenze um den `<Outlet />` ziehen mit einem lokalen, kleinen Loader (nur im Content-Bereich, nicht Vollbild). So bleibt beim Navigieren die Sidebar stehen — auch für zukünftige, evtl. lazy geladene Unterseiten.

Ergebnis: Sidebar + Header bleiben beim Reiter-Wechsel stehen, kein Vollbild-Flash mehr.

## Problem 2 — Fehlende Platzhalter im "Kunde anlegen"-Wizard

In `src/pages/superadmin/KundenWizard.tsx` haben die meisten Felder keinen `placeholder`. Ich ergänze sinnvolle Beispieltexte für alle Eingabefelder:

- Unternehmen: „Muster GmbH"
- Website: „https://muster.de" (bereits vorhanden)
- Branche: „Handwerk, IT, Kanzlei, …"
- USt-ID: „DE123456789"
- Firmeninhalt: „Kurze Beschreibung was das Unternehmen macht…"
- Straße & Hausnummer: „Musterstraße 12"
- PLZ: „10115"
- Stadt: „Berlin"
- Telefon (Firma): „+49 30 1234567"
- E-Mail (Firma): „info@muster.de"
- Ansprechpartner Name: „Max Mustermann"
- Ansprechpartner Telefon: „+49 170 1234567"
- Ansprechpartner E-Mail: „max@muster.de"
- Begrüßungstext: bereits vorhanden

Technisch: `TextField` gibt `placeholder` schon durch — nur pro Feld setzen. Für die zwei `Textarea`-Felder direkt `placeholder` am `<Textarea>` ergänzen.

## Betroffene Dateien

- `src/App.tsx` — Superadmin-Seiten von `lazy` auf normale Imports umstellen.
- `src/components/superadmin/SuperadminLayout.tsx` — kleine `<Suspense>`-Grenze mit lokalem Loader um den `<Outlet />`.
- `src/pages/superadmin/KundenWizard.tsx` — Platzhalter an allen Wizard-Feldern ergänzen.

Nicht verändert: Routing-Pfade, Datenbank, Rollen-Guard.