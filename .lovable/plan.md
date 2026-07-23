## Ranking-Spalte für Bewerbungen

Neue Spalte "Ranking" in `/superadmin/bewerbungen`, mit vier Stufen: Sehr gut, Gut, Mittel, Schlecht. Sortierung bleibt unverändert (nach Eingang).

### Datenbank
- Migration auf `public.applications`: neue Spalte `ranking text` (nullable, kein Default).
- Kein Enum, damit später leicht erweiterbar; Werte: `sehr_gut | gut | mittel | schlecht | null`.

### UI (`src/pages/superadmin/Bewerbungen.tsx`)
- Grid-Header/Zeilen bekommen zusätzliche Spalte "Ranking" (Spaltenbreite ~140px).
- Inline `Select` in jeder Zeile mit den 4 Optionen + "—" (kein Ranking). Click stoppt Row-Propagation, damit sich das Sheet nicht öffnet.
- Farbige Badges/Dot je Stufe (grün / mint / gelb / rot) über das bestehende Design-Token-System (`bg-primary`, `bg-muted`, `text-destructive` etc.), keine Hardcodes.
- Update via `supabase.from('applications').update({ ranking }).eq('id', …)`; Realtime aktualisiert die anderen Sessions.

### Detail-Sheet
- Neues Feld "Ranking" analog zum Status-Select, synchron mit der Tabelle.

### TypeScript
- Lokaler `Application`-Type um `ranking: string | null` erweitern.

### Nicht geändert
- Sortierreihenfolge, Filter, RLS-Policies (bestehende Update-Policy deckt die neue Spalte ab).
