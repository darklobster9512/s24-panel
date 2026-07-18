Verbesserung der /mitarbeiter/kunden Kundenübersicht.

Ziel
- Die Kundenliste soll als übersichtliche, volle Breite Karten-Liste statt als 3-Spalten-Grid dargestellt werden.
- Pro Karte sollen auf den ersten Blick mehr relevante Informationen sichtbar sein.
- Das Kundenlogo soll nicht mehr als kleines, abgerundetes Icon aussehen, sondern als erste Spalte der Karte fungieren und vollständig sichtbar sein.

Geplante Änderungen in `src/pages/mitarbeiter/Kunden.tsx`
1. Layout-Wechsel
   - Entferne das aktuelle `grid sm:grid-cols-2 lg:grid-cols-3`.
   - Jede Kundenkarte wird eine einzelne, volle Breite Zeile (`flex` oder `grid` mit 3 Bereichen: Logo, Infos, Aktionen).

2. Logo als erste Spalte
   - Logo links, in einem festen breiten Bereich (z. B. `w-40` oder `w-48`), mit quadratischem/gerundetem Rahmen.
   - Bild wird mit `object-contain` dargestellt, damit es vollständig sichtbar ist und nicht beschnitten wird.
   - Fallback: Initialen des Kunden in einem neutralen Platzhalter.

3. Mehr Infos auf einen Blick
   - Hauptinfo-Bereich: Unternehmensname, Branche, Firmeninhalt (2-3 Zeilen gekürzt), Telefon, E-Mail.
   - Rechter Bereich: Weiterleitungs-Status-Badge, ggf. Aktionen/Link zur Detailseite.

4. Styling
   - Beibehaltung der bestehenden Design-Token (`bg-card`, `border-border/60`, `rounded-2xl`, `shadow-card-elegant`).
   - Hover- und Fokus-States bleiben erhalten.
   - Suchleiste bleibt oben bestehen.

5. Keine Backend-Änderungen
   - Die notwendigen Daten (Firma, Branche, Telefon, E-Mail, Website, Firmeninhalt, Weiterleitung, Logo) sind bereits über `useAssignedClients` verfügbar.

Mockup der neuen Kartenstruktur:

```text
+---------------------------------------------------------+
|  +------+  Unternehmen GmbH          [Weiterleitung]    |
|  |      |  Branche                   [Nur Notiz]         |
|  | LOGO |  📞 0123 456789                                    |
|  |      |  ✉ info@firma.de                                   |
|  +------+  Kurzer Firmeninhalt (2 Zeilen)                     |
|  +----------------------------------------------------+|      |
|  +-----------------------------------------------------+
```