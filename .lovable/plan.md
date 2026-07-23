## Änderungen

**1. Logo-Icon über `public/` ausliefern**
- Datei `public/logo-icon.png` anlegen (Kopie des bestehenden Favicon-Bilds, dunkelblauer Kreis mit grünem Hörer).
- In `src/components/superadmin/AppSidebar.tsx`, `src/components/mitarbeiter/AppSidebar.tsx` und `src/pages/Auth.tsx` den Import von `@/assets/logo-icon.png.asset.json` entfernen und `<img src="/logo-icon.png" … />` verwenden. So wird das Icon zuverlässig ausgeliefert (der Asset-CDN-Pointer wird aktuell im Preview nicht aufgelöst).

**2. Passwort-Placeholder (Dot-Punkte)**
- In `src/pages/Auth.tsx` bei beiden Passwort-`Input`-Feldern (Login + Signup) `placeholder="••••••••"` ergänzen, damit im leeren Zustand Dot-Punkte sichtbar sind.

**3. Registrieren-Tab entfernen**
- In `src/pages/Auth.tsx` die `<Tabs>`-Struktur entfernen und nur das Login-Formular rendern.
- `SignupForm`-Komponente und deren Nutzung entfernen (Registrierung erfolgt künftig ausschließlich durch den Superadmin via Mitarbeiter-Wizard).
- Ungenutzte Imports (`Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`) entfernen.

Keine Backend-/DB-Änderungen.
