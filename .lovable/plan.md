## Ziel
Beim Wechsel der Reiter im `/mitarbeiter`-Panel soll die neue Seite erst erscheinen, wenn alle benötigten Daten geladen sind. Aktuell rendert jede Seite sofort mit Platzhaltern („—", leere Listen) und füllt sich dann nach und nach — was als „nachladen" wahrgenommen wird.

## Ansatz
Einheitliches Pattern über alle Mitarbeiter-Seiten: **React Query mit Suspense**. Der `<Suspense>`-Fallback existiert bereits in `MitarbeiterLayout` (zentraler Spinner um den `<Outlet />`). Wenn die Seiten ihre Daten via `useSuspenseQuery` laden, hält React die Navigation automatisch zurück und zeigt den Layout-Spinner, bis alles bereit ist.

## Änderungen pro Seite

1. **`src/hooks/use-assigned-clients.ts`**
   - Auf `useSuspenseQuery` umstellen (inkl. Logo-URLs im selben Query, damit Kunden + Logos atomar geladen werden).
   - Rückgabe bleibt API-kompatibel, `loading`/`error` entfallen (Suspense/ErrorBoundary übernehmen).

2. **`src/pages/mitarbeiter/Cockpit.tsx`**
   - `useState` + `useEffect` durch mehrere `useSuspenseQuery` ersetzen: Employee-Profil, Anrufe heute/gestern, letzte Anrufe, offene Rückrufe.
   - Alle Queries parallel → Seite erscheint erst, wenn alle fertig.

3. **`src/pages/mitarbeiter/Kunden.tsx`**
   - Nutzt den umgestellten `useAssignedClients`-Hook; lokale `loading`/`error`-Branches entfernen.

4. **`src/pages/mitarbeiter/LiveAnrufe.tsx`, `Notizen.tsx`, `Statistik.tsx`, `KundeDetail.tsx`, `Arbeitsvertrag.tsx`, `Profil.tsx`**
   - Daten-Fetching auf `useSuspenseQuery` migrieren. Interne Skeleton-/Spinner-Zwischenzustände entfernen — dafür sorgt der zentrale Layout-Fallback.
   - Realtime-Subscriptions (z.B. LiveAnrufe) bleiben unverändert; nur der Initial-Load nutzt Suspense.

5. **`src/components/mitarbeiter/MitarbeiterLayout.tsx`**
   - `Suspense`-Fallback minimal aufhübschen (bereits vorhanden) — optional, damit der Übergang sauber wirkt. Header bleibt sichtbar, nur der Main-Bereich zeigt den Loader.

6. **Optionale ErrorBoundary** um den `<Outlet />` für saubere Fehleranzeige, da `useSuspenseQuery` Fehler wirft.

## Nicht-Ziele
- Kein Refactor der Superadmin-Seiten.
- Keine Änderung an Datenmodellen, Edge Functions oder RLS.
- Kein Prefetching auf Sidebar-Hover (könnte später ergänzt werden).

## Technische Details
- React Query ist bereits im Projekt aktiv (Auth, Employees, Contracts). Kein neues Package nötig.
- `useSuspenseQuery` erfordert React 18 (vorhanden). Der bestehende Layout-`<Suspense>` fängt sowohl Lazy-Route-Loading als auch Query-Suspense ab — ein einziger Loader für alles.
- `queryKey`s werden pro Seite/Filter stabil gehalten, damit React Query Cachet greift und beim Rück-Wechsel keine Ladezeit mehr entsteht (nur beim allerersten Besuch).