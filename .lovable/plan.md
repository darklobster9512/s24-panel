# Favicon mit invertierten Farben setzen

## Ziel
Das hochgeladene Telefon-Icon als Favicon verwenden – mit vertauschten Farben: grüner Hintergrund → Sidebar-Dunkelblau (`#130f40`), dunkelblaues Telefon → Branding-Grün (`#7bed9f`).

## Umsetzung
1. Neues Favicon per `imagegen--edit_image` aus dem Upload generieren: gleicher Bildaufbau (abgerundetes Quadrat mit Telefon-Icon), aber Hintergrund `#130f40` und Telefon `#7bed9f`. Speichern als `public/favicon.png`.
2. In `index.html` den bestehenden Favicon-Link auf `/favicon.png` (Typ `image/png`) umstellen.
3. Alte `public/favicon.ico` löschen, damit Browser nicht das Default-Icon laden.
