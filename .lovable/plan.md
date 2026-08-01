## Ziel
Die rechte Spalte auf `/auth` wirkt leer. Ergänzt wird eine funktionierende „Angemeldet bleiben“-Option plus ein dezenter Support-Hinweis. Kein „Passwort vergessen“.

## 1. „Angemeldet bleiben“ (funktional)
- Checkbox unter dem Passwortfeld, standardmäßig aktiviert.
- Verhalten: aktiviert = Session bleibt in `localStorage` (wie heute). Deaktiviert = Session nur für die Browser-Sitzung (`sessionStorage`), also Logout beim Schließen des Browsers.
- Technisch: der Supabase-Client in `src/integrations/supabase/client.ts` bekommt einen Storage-Adapter, der zur Laufzeit zwischen `localStorage` und `sessionStorage` umschaltet (Auswahl selbst in `localStorage` gemerkt). Kein Umbau von `use-auth.tsx` nötig.

## 2. Dezenter Support-Hinweis
- Unter dem Anmelden-Button, klein und in `text-muted-foreground`:
  „Probleme beim Anmelden? info@sekretariat-24.de“ (E-Mail als `mailto:`-Link in Akzentfarbe).
- Darüber eine feine Trennlinie, damit der untere Bereich Struktur bekommt statt Leere.

## 3. Kein Passwort-Reset
- Kein „Passwort vergessen?“-Link, keine `/reset-password`-Seite.

## Technische Details
- Dateien: `src/pages/Auth.tsx` (Checkbox + Support-Zeile), `src/integrations/supabase/client.ts` (Storage-Adapter).
- Bestehende shadcn-Komponenten (`Checkbox`, `Separator`, `Label`) und Design-Tokens — keine hartkodierten Farben.
