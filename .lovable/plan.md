## Ziel

Auf `/superadmin/bewerbungsgespraeche`:
1. Ranking-Spalte in der Tabelle (gleiche Optionen/Farben wie bei Bewerbungen)
2. Status per Dropdown direkt in der Zeile änderbar (statt nur Buttons)
3. Aktivitätsprotokoll-Card unter dem Seitentitel mit E-Mail, Datum/Uhrzeit und ausgeführter Aktion

## Datenbank

Neue Tabelle `public.activity_log`:
- `id uuid pk`, `actor_user_id uuid`, `actor_email text`, `action text`, `entity_type text`, `entity_id uuid`, `details jsonb`, `created_at timestamptz default now()`

Reihenfolge in der Migration: CREATE TABLE → GRANTs (`SELECT, INSERT` für `authenticated`, `ALL` für `service_role`) → RLS aktivieren → Policies:
- SELECT: nur `has_role(auth.uid(),'superadmin')`
- INSERT: nur `has_role(auth.uid(),'superadmin')` und `actor_user_id = auth.uid()`
- Kein UPDATE/DELETE (Protokoll bleibt unveränderlich)

Optional Index auf `created_at desc`.

## Frontend

`src/pages/superadmin/Bewerbungsgespraeche.tsx`:
- Spaltenraster um eine Ranking-Spalte erweitern; `applications(... , ranking)` mitladen
- Ranking-Select pro Zeile (Sehr gut / Gut / Mittel / Schlecht / Kein Ranking) mit den gleichen Farbklassen wie in `Bewerbungen.tsx`; schreibt auf `applications.ranking`
- Status-Select pro Zeile (Offen / Erfolgreich / Fehlgeschlagen / Abgesagt) ersetzt die Häkchen-Buttons; Löschen bleibt
- Klicks auf die Selects stoppen die Zeilen-Navigation (`e.stopPropagation()`)
- Neue Card „Aktivitätsprotokoll" direkt unter dem `PageHeader`: die letzten ~20 Einträge, je Zeile Aktion, betroffener Bewerber, E-Mail des Admins und Datum + Uhrzeit; einklappbar bzw. „Mehr anzeigen"

Kleine Hilfsfunktion `logActivity()` (z. B. `src/lib/activityLog.ts`), die den aktuellen User aus der Supabase-Session zieht und den Eintrag schreibt. Aufgerufen bei: Status geändert, Ranking geändert, Termin gelöscht. Ebenfalls eingebunden in `BewerbungsgespraechDetail.tsx` (Status/Ranking/Notiz gespeichert), damit das Protokoll vollständig ist.

## Hinweise

- Das Protokoll wird nur beim Schreiben durch das Panel gefüllt; historische Änderungen erscheinen nicht rückwirkend.
- Ranking bleibt eine Eigenschaft der Bewerbung, ist also in beiden Ansichten synchron.
