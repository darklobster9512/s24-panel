## Fix für das verzerrte Sidebar-Icon

- Das Logo in der Superadmin- und Mitarbeiter-Sidebar erhält einen festen quadratischen Wrapper, der beim Collapsen nicht schrumpfen oder gestreckt werden kann.
- Das Bild selbst wird mit fester Maximalgröße sowie `object-contain` und `aspect-square` proportional dargestellt; Breite und Höhe werden nicht mehr unabhängig durch das Sidebar-Layout beeinflusst.
- Überschüssiger Header-Inhalt wird sauber ausgeblendet und das Icon im 48px breiten Mini-Sidebar-Modus exakt zentriert.
- Anschließend wird der Collapse-Zustand im laufenden Preview visuell geprüft, damit das Icon tatsächlich unverzerrt bleibt.