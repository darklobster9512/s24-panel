## Icon-Update

**Asset**
- Upload `favicon-64x64-3.png` (dunkelblauer Kreis mit grünem Hörer) via `lovable-assets` als CDN-Pointer nach `src/assets/logo-icon.png.asset.json` einbinden, damit es sowohl in React-Komponenten als auch als Favicon nutzbar ist.
- Zusätzlich Kopie nach `public/favicon.png` (überschreibt aktuelles Favicon), damit `<link rel="icon">` das gleiche Bild ausliefert.

**Sidebar (`src/components/superadmin/AdminSidebar.tsx` bzw. Mitarbeiter-Sidebar)**
- Aktuelles Icon vor dem „Sekretariat24"-Logo durch `<img src={logoIcon.url} />` ersetzen, gleiche Größe wie bisher.

**Auth-Seite (`src/pages/Auth.tsx`)**
- Icon vor dem Logo-Text ebenfalls durch das neue Bild ersetzen.

**Favicon (`index.html`)**
- Bleibt `/favicon.png`, Datei wird lediglich durch das neue Bild ersetzt (kein HTML-Change nötig).

Kein Umschalten der Farben mehr – das Original wird 1:1 verwendet.
