## Ausgangslage
- Aktuelles Projekt läuft auf **TanStack Start** (mit SSR, `src/routes/`, `src/server.ts`, `createServerFn`).
- Referenz `vic-exploit` ist ein **reines Vite + React SPA** ohne SSR: `vite.config.ts` nur `react()` + `tailwindcss()`, `src/main.tsx` als Client-Entry, `src/App.tsx`, `react-router-dom`, Seiten in `src/pages/`.
- Aktueller Build-Fehler kommt daher, dass `@supabase/supabase-js` nicht installiert ist — wird im Zuge der Migration gelöst.

## Ziel
1. Build auf gleiches Setup wie `vic-exploit` umstellen (Vite SPA, kein SSR, kein Cloudflare Worker, kein TanStack Router).
2. `/auth` Seite mit 50/50 Card (links Animation, rechts Login/Registrieren).
3. Supabase Auth + 3 Rollen (`superadmin`, `kunde`, `mitarbeiter`).
4. Mockup-Dashboards pro Rolle auf **`/superadmin`, `/kunde`, `/mitarbeiter`** im Assistify-Pro-Stil, Logotext „Assistify Pro".

## Teil A — Migration zu Vite SPA (wie vic-exploit)

### Entfernen
- `src/server.ts`, `src/start.ts`, `src/router.tsx`, `src/routeTree.gen.ts`
- `src/routes/` komplett (Inhalt wird migriert)
- `src/lib/error-capture.ts`, `src/lib/error-page.ts`, `src/lib/lovable-error-reporting.ts` (SSR-spezifisch)
- `src/integrations/supabase/auth-middleware.ts`, `auth-attacher.ts`, `client.server.ts` (Server-only, für SPA nicht nötig)
- `.lovable/project.json` template → `vite_react_shadcn_ts`

### package.json — Dependencies austauschen
- Entfernen: `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-router-devtools`, `@tanstack/router-plugin`, `@lovable.dev/vite-tanstack-config`, `nitro`, `wrangler` etc.
- Hinzufügen (wie vic-exploit): `@supabase/supabase-js`, `react-router-dom@6`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `tailwindcss@4`, `tw-animate-css`, `framer-motion`, Radix/shadcn Pakete bleiben. Scripts: `dev`, `build`, `build:dev`, `preview`.

### Neue/geänderte Kern-Dateien
- `vite.config.ts` — 1:1 wie vic-exploit (`react()` + `tailwindcss()`, alias `@`, Port 8080).
- `index.html` — SPA Entry mit `<div id="root">` und `/src/main.tsx`.
- `src/main.tsx` — `createRoot().render(<BrowserRouter><App /></BrowserRouter>)`.
- `src/App.tsx` — Routes, `QueryClientProvider`, `<Toaster />` (sonner), `TooltipProvider`.
- `src/integrations/supabase/client.ts` — reiner Browser-Client (`localStorage`, `persistSession: true`), liest `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `tsconfig.json` — SPA-Konfig.

### Seiten (`src/pages/`)
- `Index.tsx` — bestehende Sekreteriat24 Hero migrieren
- `Auth.tsx`
- `Superadmin.tsx`
- `Kunde.tsx`
- `Mitarbeiter.tsx`
- `NotFound.tsx`

## Teil B — Supabase Rollen-System

Migration:
1. Enum `app_role` (`superadmin`, `kunde`, `mitarbeiter`)
2. `public.profiles` (user_id → auth.users, full_name, company)
3. `public.user_roles` (user_id, role, unique(user_id, role))
4. GRANTs + RLS enabled
5. Security-Definer Funktion `public.has_role(_user_id uuid, _role app_role)`
6. RLS Policies: user liest/updated eigenes Profil und eigene Rollen; superadmin verwaltet alles
7. Trigger `handle_new_user`: bei Signup Profil anlegen + Default-Rolle `kunde`

Rollen-Auswahl bei Registrierung: nur `kunde` oder `mitarbeiter`. `superadmin` wird ausschließlich manuell in DB gesetzt.

## Teil C — `/auth` Seite

- Zentrierte Card `max-w-5xl`, `grid md:grid-cols-2`, `rounded-2xl`, `shadow-mockup`.
- **Links** (`bg-ink-deep` + `bg-mesh`, weißer Text):
  - Logotext „Assistify Pro"
  - Animierte Wave-Bars, floating Chat-Bubbles mit `framer-motion`, Headset-Icon
  - Tagline + 3 Feature-Bullets
- **Rechts** (`bg-card`):
  - Shadcn `Tabs` „Anmelden" / „Registrieren"
  - Login: Email + Passwort → `supabase.auth.signInWithPassword`
  - Registrieren: Name, Email, Passwort, Rollen-Select (Kunde / Mitarbeiter) → `supabase.auth.signUp` mit `emailRedirectTo: window.location.origin`, dann `user_roles` Insert
  - Nach Login: Rolle laden → `navigate` zu `/superadmin`, `/kunde` oder `/mitarbeiter`
  - Zod-Validierung, Fehler via `toast.error`

## Teil D — Rollen-basiertes Routing

- `src/hooks/useAuth.ts` — hört auf `onAuthStateChange`, liefert `{ user, role, loading }`.
- `src/components/ProtectedRoute.tsx` — redirected zu `/auth` wenn kein User, zu passendem Dashboard wenn Rolle nicht passt.
- Routen in `App.tsx`:
  - `/` → Hero (public)
  - `/auth` → Auth (public, redirect wenn eingeloggt)
  - `/superadmin` (nur superadmin)
  - `/kunde` (nur kunde)
  - `/mitarbeiter` (nur mitarbeiter)
  - `*` → NotFound

## Teil E — Mockup-Dashboards (Assistify-Pro-Stil)

Gemeinsame Layout-Komponenten:
- `DashboardLayout.tsx` — Sidebar (bg-ink-deep) + Topbar + Content
- `Sidebar.tsx` — Logo „Assistify Pro", Nav je Rolle, Logout unten
- `StatCard.tsx`, `SectionCard.tsx`

**`/superadmin`** — Plattformübersicht
- KPI: Kunden gesamt, Mitarbeiter aktiv, Anrufe heute, Umsatz Monat
- Tabellen „Kunden" + „Mitarbeiter" (Mocks)
- Line-Chart Anrufvolumen (Recharts)

**`/kunde`** — Portal
- KPI: Meine Anrufe, Nachrichten, Termine, offene Tickets
- Liste letzter Anrufe/Nachrichten
- Button „Neuen Auftrag anlegen"

**`/mitarbeiter`** — Callcenter-Agent-Panel
- Aktueller-Anruf-Widget mit Wave-Animation + Status-Toggle
- Queue-Liste, zugewiesene Kunden
- Tagesstatistik

Daten sind hardcoded Mocks — keine echten Tabellen außer profiles/user_roles.

## Teil F — Design-Tokens (aus Assistify Pro)

`src/styles.css`:
- Farbtokens: `--primary #7bed9f`, `--ink #0f1a2e`, `--ink-deep #130f40`, `--surface #f6f9f7` etc.
- Utilities: `bg-mesh`, `bg-grid`, `bg-dots`, `bg-ink-deep`, `shadow-glow`, `shadow-mockup`, `animate-marquee`
- Keyframes: `wave-bar`, `marquee`
- Inter Font via `<link>` in `index.html`

## Reihenfolge
1. Migration (Teil A) — package.json, vite.config, main.tsx, App.tsx, index.html, Aufräumen, Hero portieren, `bun install`
2. Supabase Migration (Teil B)
3. Design-Tokens (Teil F)
4. `/auth` (Teil C) + Auth-Hook + ProtectedRoute (Teil D)
5. Dashboards (Teil E)

## Offene Fragen / Annahmen
- **Email-Bestätigung:** Empfehle in Supabase Auth „Confirm email" deaktivieren, damit Registrieren direkt einloggt. OK?
- **Mitarbeiter-Registrierung:** Selbstregistrierung als `mitarbeiter` erlaubt (einfacher). Alternativ nur per Superadmin-Einladung — sag Bescheid falls gewünscht.
- **Sekreteriat24 Hero** bleibt auf `/` unverändert.
- **Migration ist destruktiv** — TanStack-Start-Setup wird vollständig entfernt; Hero-UI bleibt inhaltlich erhalten, wird ins SPA-Format portiert.
