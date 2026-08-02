## Änderungen in `src/pages/mitarbeiter/RecruitmentErfassen.tsx`

**1. Reihenfolge tauschen (linke Spalte)**
- Panel „Bewerber" nach oben, Panel „Kunde" darunter.

**2. Call-Skript inline statt Popup**
- Dialog komplett entfernen (inkl. `Dialog`-Imports).
- Button „Call-Skript öffnen" wird zu einem Toggle („Call-Skript öffnen" / „Call-Skript schließen", mit Chevron-Icon).
- Bei geöffnetem Zustand wird das Skript als aufklappender Bereich direkt in der linken Spalte unter der Kunden-Card gerendert (volle Länge, kein inneres Scrollen — man scrollt die Seite).
- Ist kein Skript gepflegt, bleibt der bestehende Toast-Hinweis.

**3. Rechte Spalte sticky**
- Die rechte Spalte (Timer, Aktionen & Ergebnis, Speichern) bekommt `lg:sticky lg:top-6 lg:self-start`, damit sie beim Scrollen durch das lange Skript sichtbar bleibt.
- Grid-Container auf `items-start` gesetzt, damit Sticky greift.
- Auf Mobil/Tablet bleibt das Verhalten normal untereinander.

## Technisches
- Nur Präsentationsebene; Datenlogik, Timer und Speichern bleiben unverändert.
- Falls ein übergeordneter Layout-Container `overflow` setzt, wird das geprüft und ggf. angepasst, da Sticky sonst nicht funktioniert.
