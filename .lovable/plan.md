# Fix: „unsupported color function oklab" beim PDF-Generieren

## Ursache

`html2canvas` (v1.x) kann moderne CSS-Farbfunktionen wie `oklab()` / `oklch()` nicht parsen. Unser Design-System (Tailwind v4 Tokens in `src/styles.css`) verwendet aber genau diese Farbfunktionen. Sobald in der Vorschau ein Element mit einer solchen Farbe gerendert wird (Border, Text, Hintergrund), bricht der Canvas-Rendervorgang mit dieser Meldung ab.

## Lösung

Drop-in-Ersatz durch `html2canvas-pro` – ein aktiv gepflegter Fork mit exakt derselben API, der `oklab`, `oklch`, `color()` und `lab()` unterstützt.

### Änderungen

1. **Dependency**
   - `html2canvas-pro` hinzufügen
   - `html2canvas` entfernen (nicht mehr benötigt)

2. **`src/pages/superadmin/ArbeitsvertragDetail.tsx`**
   - Import umstellen:
     ```ts
     import html2canvas from "html2canvas-pro";
     ```
   - Rest des `confirmMutation`-Codes bleibt unverändert (API ist identisch: `scale`, `backgroundColor`, `useCORS`).

## Warum kein manueller Farb-Override?

Alternativ könnte man das Preview-DOM vor dem Rendern in einen Container mit forcierten sRGB-Farben klonen, aber das würde bei jedem neuen Token wieder brechen. `html2canvas-pro` löst das Problem strukturell und dauerhaft.

## Verifikation

- `/superadmin/arbeitsvertraege/:id` öffnen
- Auf „Bestätigen und PDF generieren" klicken
- PDF sollte erzeugt, hochgeladen und der Vertrag auf `completed` gesetzt werden
- Kein Konsolen-Error mehr
