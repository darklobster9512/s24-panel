# Störungs-Hinweis auf /auth

## Was der Nutzer sieht

Über der Überschrift „Willkommen zurück" im Login-Formular (`src/pages/Auth.tsx`, `FormPanel`) erscheint ein dezenter Hinweis-Banner:

- Gelb/bernsteinfarbener Hinweis-Stil (passend zur bestehenden Glass-Optik), mit kleinem Warn-Icon.
- Text: „Wir haben aktuell technische Störungen. Bis 12:00 Uhr habt ihr erst einmal frei."
- Bleibt rein optisch/deskriptiv — kein Timer, kein automatisches Ausblenden, keine Backend-Logik.

## Technik

- Eine kleine Banner-Komponente direkt in `FormPanel` oberhalb des `<div className="mb-8">` mit der Überschrift.
- Keine Datenbank-, Edge-Function- oder Routing-Änderungen.
- Optional später leicht per Textänderung zu entfernen.
