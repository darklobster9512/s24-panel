## Ursache (verifiziert)

Das Projekt nutzt Tailwind v4 (`@tailwindcss/vite`), aber das Typography-Plugin (`@tailwindcss/typography`) ist **nicht** installiert — in `package.json` gibt es keinen Eintrag, und `src/styles.css` enthält keine `prose`-Definitionen. Die `prose`-Klassen im TipTap-Editor (`TipTapEditor.tsx`) und in der Skript-Anzeige (`RecruitmentErfassen.tsx`, Zeile 317) sind daher wirkungslos. Durch Tailwinds Preflight-Reset haben `<p>` keine Abstände (Absätze "verschwinden") und `<ul>/<ol>` keine Aufzählungszeichen.

Der Editor hat bereits Buttons für Aufzählung und nummerierte Liste (StarterKit) — sie erzeugen Listen, die aber unsichtbar/unformatiert dargestellt werden.

## Umsetzung

1. **Typography-Styles bereitstellen**
   - `@tailwindcss/typography` installieren und in `src/styles.css` per `@plugin "@tailwindcss/typography";` aktivieren (Tailwind-v4-Syntax).
   - Alternativ, falls das Plugin Probleme macht: eine eigene `.rich-text`-Klasse in `styles.css` mit Regeln für `p`, `h1–h3`, `ul/ol/li`, `strong`, `em`, `a`, `blockquote` — nur diese eine Stelle, mit Design-Tokens.

2. **Editor-Fläche** (`src/components/superadmin/vertraege/TipTapEditor.tsx`)
   - Editor-Attribut-Klassen so ergänzen, dass Absatzabstände und Listenpunkte während des Schreibens sichtbar sind (Listen mit `list-disc`/`list-decimal` innerhalb der Prose-Regeln).
   - Leere Absätze (Leerzeilen) erhalten eine Mindesthöhe, damit bewusste Zeilenabstände sichtbar bleiben.

3. **Anzeige beim Mitarbeiter** (`src/pages/mitarbeiter/RecruitmentErfassen.tsx`)
   - Der Container mit `dangerouslySetInnerHTML` bekommt dieselben Styles, sodass die Formatierung im Portal 1:1 wie im Editor aussieht (inkl. Absätze, Bullets, Nummerierung).

4. **Konsistenzcheck**
   - Gleiche Styles auch dort anwenden, wo Vertragsvorlagen mit demselben Editor gerendert werden, damit die Darstellung überall identisch ist.

## Ergebnis

Absätze und Leerzeilen im Call-Skript werden gespeichert *und* angezeigt, Aufzählungen sind im Editor nutzbar und erscheinen mit Punkten bzw. Nummern in der Mitarbeiter-Ansicht.
