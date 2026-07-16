## Änderung

Signup-Formular in `src/pages/Auth.tsx` vereinfachen:

- Entfernen: „Vollständiger Name", „Unternehmen" und Rollenauswahl (Kunde/Mitarbeiter)
- Beibehalten: nur E-Mail und Passwort
- `supabase.auth.signUp` ohne `options.data` — keine Metadaten mehr
- Neue User bekommen weiterhin über den bestehenden `handle_new_user`-Trigger automatisch die Default-Rolle `kunde`

Keine anderen Änderungen (Layout, Branding, Login-Tab, Dashboards, DB bleiben unangetastet).