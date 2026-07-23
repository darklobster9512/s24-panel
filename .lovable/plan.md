# Head-Metadaten setzen & Lovable-Hinweise

## index.html anpassen
- `<title>` → `Sekretariat24 – Callcenter & Sekretariats-Panel`
- `<meta name="description">` → `Sekretariat24 – Digitales Portal für Anrufannahme, Kundenverwaltung und Mitarbeiter-Cockpit.`
- Ergänzen: `og:title`, `og:description`, `og:type=website`, `twitter:card=summary_large_image`, `twitter:title`, `twitter:description` mit denselben Texten.
- `<html lang="de">` bleibt.

## Lovable-Referenzen
Codeweite Suche ergab nur zwei Treffer, beide gehören zur Lovable-Infrastruktur und dürfen nicht angefasst werden:
- `bunfig.toml` – `@lovable.dev/*` Paketnamen (interne Build-Abhängigkeiten).
- `AGENTS.md` – Lovable-Sync-Hinweis in geschützten `<!-- LOVABLE:BEGIN/END -->` Markern (wird automatisch verwaltet).

Es sind keine für Endnutzer sichtbaren Lovable-Hinweise im Code (kein "Built with Lovable"-Badge, keine Lovable-Links im UI, kein Lovable-Branding in `index.html`). Daher nichts zu entfernen. Falls du damit den Default-Titel `Assistify Pro` gemeint hast: der wird oben durch `Sekretariat24` ersetzt.
