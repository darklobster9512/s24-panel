Überall im Projekt den Schreibfehler „Sekreteriat24“ in „Sekretariat24“ korrigieren.

Betroffene Bereiche:

- **Frontend**
  - `src/pages/Index.tsx` – Hero-Titel
  - `src/pages/Auth.tsx` – Logo in Auth-Card
  - `src/components/DashboardShell.tsx` – Shell-Logo
  - `src/components/superadmin/AppSidebar.tsx` – Sidebar-Logo
  - `src/components/mitarbeiter/AppSidebar.tsx` – Sidebar-Logo
  - `src/lib/applicationEmail.ts` – Default-Logo-Text und Kommentar
  - `src/lib/render-contract.ts` – Default-Firma im Vertrag
  - `src/pages/superadmin/Einstellungen.tsx` – Placeholder und Preview-Defaults

- **Edge Function**
  - `supabase/functions/submit-application/index.ts` – Default-Firma/Logo-Text in E-Mail

- **Datenbank-Migrationen** (nur für sauberen Initialzustand bei neuen Instanzen)
  - `supabase/migrations/20260722132649_fb338d6b-b16b-4fd0-96ac-eaebe9547b2c.sql` – Default-Werte in `app_settings`
  - `supabase/migrations/20260722134023_6f311249-5674-40c5-aaba-2def203341a6.sql` – E-Mail-Body-Defaults

Vorgehen:
1. Sicherstellen, dass keine Datei im geänderten Zustand offen ist.
2. Systematisch alle Vorkommen von `Sekreteriat24` und `Sekreteriat` (im Split-Logo) durch `Sekretariat24` bzw. `Sekretariat` ersetzen.
3. Edge Function `submit-application` neu deployen.
4. Build ausführen und ggf. Vorschau prüfen.

Keine funktionalen Änderungen, reine Text- und Branding-Korrektur.