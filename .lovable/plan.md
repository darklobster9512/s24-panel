## Problem

Die Sidebar rendert sofort `Live-Anrufe` als Default, weil `useOutboundProfile()` beim Login noch lädt (`data === undefined`). Erst wenn die Supabase-Abfrage zurückkommt, wird auf `Bewerbungsgespräche` umgeschaltet — das erzeugt das sichtbare Umspringen.

## Lösung

**1. Profil-Modus persistent cachen (`src/hooks/use-outbound-profile.ts`)**
- Nach erfolgreichem Query das Ergebnis pro User in `localStorage` schreiben (Key: `outbound-profile:<userId>`).
- Diesen Wert beim Mount als `initialData` (mit `initialDataUpdatedAt`) an React Query geben, damit beim erneuten Login/Reload sofort der korrekte Modus steht und im Hintergrund revalidiert wird.
- `staleTime` beibehalten, damit Navigationswechsel keinen Refetch auslösen.

**2. Kein falscher Default beim allererster Laden (`src/components/mitarbeiter/AppSidebar.tsx`)**
- `isLoading`/`isPending` aus dem Hook mitnehmen.
- Solange noch kein Wert (weder Cache noch Response) vorliegt: an dieser Stelle einen dezenten Skeleton-Menüeintrag rendern statt `Live-Anrufe`. So gibt es nie einen sichtbaren Wechsel zwischen zwei echten Reitern.

**3. Gleiches Verhalten für abhängige Routen**
- Prüfen, dass `/mitarbeiter/erfassen` und die Route-Weiche für `Bewerbungsgespräche` denselben Hook-Zustand nutzen und beim Laden nicht kurzzeitig die Inbound-Variante rendern (ansonsten dort ebenfalls Skeleton statt Default).

## Technische Details
- Nur Frontend, keine DB-Änderung.
- localStorage-Cache enthält nur `employeeId`, `outboundRecruitment`, `clientId` — keine sensiblen Daten.
- Cache wird beim Logout bzw. bei User-Wechsel durch den userId-Key automatisch ungültig.
