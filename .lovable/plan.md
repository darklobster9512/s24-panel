## Problem
In `src/pages/superadmin/MitarbeiterWizard.tsx` steht an derselben Stelle im Footer entweder der „Weiter“-Button (`type="button"`) oder – im letzten Schritt – der „Mitarbeiter anlegen“-Button (`type="submit"`).

Klickt man in Schritt 2 auf „Weiter“, setzt der Klick-Handler den Schritt auf 3, React rendert das Element neu, und derselbe DOM-Button trägt nun `type="submit"`. Der Browser wertet die Default-Aktion des Klicks erst nach dem Handler aus – und löst dann das Form-Submit aus. Ergebnis: Der Mitarbeiter inkl. Auth-Account wird sofort beim Wechsel zu Schritt 3 angelegt.

Zusätzlich löst Enter in einem der optionalen Felder in Schritt 3 ebenfalls direkt das Anlegen aus (implicit submission).

## Lösung
1. **Getrennte Buttons statt Umschalten desselben Elements:** „Weiter“ und „Mitarbeiter anlegen“ bekommen jeweils einen stabilen `key`, damit React sie nicht als dasselbe Element wiederverwendet.
2. **Kein `type="submit"` mehr:** Der Anlegen-Button wird `type="button"` und ruft im `onClick` explizit `form.handleSubmit(onSubmit)()` auf. Damit kann kein Klick-Default und kein Enter-Druck ungewollt absenden.
3. **Sicherheitsnetz:** `onSubmit` bricht ab, wenn nicht der letzte Schritt aktiv ist – so wird auch bei einem versehentlichen Submit (z. B. Enter) nichts angelegt.
4. **Form-Element:** `onSubmit={form.handleSubmit(onSubmit)}` bleibt bestehen (für Barrierefreiheit), greift aber durch die Guard nur im letzten Schritt.

## Nicht betroffen
„Als Entwurf speichern“ verhält sich unverändert; Datenbank, Edge Function und Vertragszuweisung bleiben identisch.
