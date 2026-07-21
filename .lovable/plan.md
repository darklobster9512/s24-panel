## Anrufer-Gedächtnis: Scoping pro Kunde bestätigen

Das ist bereits so umgesetzt — ich stelle es hier nochmal klar und prüfe, dass nichts leakt.

### Aktueller Stand
- Tabelle `caller_contacts` hat `UNIQUE (client_id, phone_number)` — Einträge sind an den jeweiligen Kunden gebunden.
- Beim Speichern in `Erfassen.tsx` wird `upsert` mit **beiden** Feldern (`client_id` + normalisierte `phone_number`) gemacht.
- Beim Autofill wird per `.eq('client_id', ...)` **und** `.eq('phone_number', ...)` gesucht.

### Was ich zusätzlich absichere
1. Autofill-Query in `Erfassen.tsx` reviewen und sicherstellen, dass **niemals** ohne `client_id` gefiltert wird (kein Fallback über alle Kunden).
2. RLS-Policy auf `caller_contacts` prüfen, dass ein Mitarbeiter nur Einträge der ihm zugewiesenen Kunden lesen kann — sonst könnte ein anderer Kunde theoretisch Daten sehen.
3. „Bekannter Anrufer"-Badge nur zeigen, wenn der Treffer wirklich zum aktuellen `client_id` gehört (Guard beim State-Setzen).
4. Kurzer manueller Check: gleiche Nummer bei Kunde A speichern → bei Kunde B darf Name/E-Mail leer bleiben und kein Badge erscheinen.

Keine Schema-Änderung nötig — nur Verifikation und ggf. kleine Guards im Frontend/RLS.