# Favicon per Pixel-Recoloring statt AI-Neuzeichnung

## Problem
Die `imagegen--edit_image` Version hat das Telefon-Icon neu gezeichnet und die Form verändert (anderer Hörer, andere Proportionen). Statt ein KI-Modell darum zu bitten, tausche ich die Farben pixelweise – so bleibt die Form exakt identisch zur Vorlage.

## Vorgehen
1. Python-Skript mit PIL im Sandbox laufen lassen, das das Original (`/mnt/user-uploads/favicon-64x64-2.png`) einliest.
2. Pro Pixel:
   - Grüntöne (nahe `#7bed9f`) → `#130f40`
   - Dunkelblau-Töne (nahe `#130f40` / dunkles Navy) → `#7bed9f`
   - Toleranzbereich pro Kanal, damit Anti-Aliasing-Kanten sauber mitgeswappt werden (Interpolation entlang der Farbdistanz statt harter Schwelle).
   - Transparente Pixel bleiben transparent.
3. Ergebnis als `public/favicon.png` speichern (überschreibt die aktuelle, falsche Version). Auflösung des Originals beibehalten.
4. `index.html` bleibt unverändert (referenziert bereits `/favicon.png`).
