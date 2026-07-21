## Kunden-Card auf `/mitarbeiter/erfassen` erweitern

Die Info-Card links (wenn ein Kunde ausgewählt ist) zeigt aktuell nur Logo, Name, Branche, Begrüßung, Firmeninhalt, Ansprechpartner und Weiterleitungs-Status. Alle weiteren Kundendaten sind bereits über `useAssignedClients` verfügbar und müssen nur noch dargestellt werden.

### Änderungen in `src/pages/mitarbeiter/Erfassen.tsx`

Ausgewählter-Kunde-Zweig (ca. Zeile 246–292) erweitern um folgende Blöcke, jeweils mit passendem Icon (`lucide-react`: `Phone`, `Mail`, `Globe`, `MapPin`, `User`, `Building2`, `Hash`, `PhoneForwarded`):

1. **Kontaktblock** (neu, direkt unter Header):
   - Telefon (`client.telefon`) — klickbar als `tel:`-Link
   - E-Mail (`client.email`) — klickbar als `mailto:`-Link
   - Website (`client.website`) — klickbar mit `target="_blank"`
   - Adresse (`client.adresse`)
   Jede Zeile mit Icon links, Wert rechts, Zeilen mit fehlendem Wert werden ausgeblendet.

2. **Begrüßung** — bleibt wie bisher (hervorgehobene Mono-Box).

3. **Firmeninhalt** — bleibt, aber mit Überschrift-Konsistenz.

4. **Ansprechpartner-Block** (erweitert):
   - Name (`ansprechpartner`)
   - Telefon (`ansprechpartnerTel`) — klickbar
   - E-Mail (`ansprechpartnerEmail`) — klickbar
   Fällt komplett weg, wenn alle drei Felder leer sind.

5. **Meta-Zeile** (unten, kompakt):
   - Weiterleitung: aktiv / inaktiv (mit farbigem Dot bzw. `PhoneForwarded`-Icon)
   - USt-ID (`vatId`), falls vorhanden

### Darstellung
- Klare Sektionsüberschriften im bestehenden `text-[10px] uppercase tracking-wider text-muted-foreground` Stil.
- Kontakte als kompakte Liste mit `flex items-center gap-2`, Icon `h-3.5 w-3.5 text-muted-foreground`.
- Links: `hover:text-primary hover:underline`, sonst `text-foreground`.
- Trennung der Blöcke über dezente `border-t border-border/60 pt-3`.
- Card scrollt bei Bedarf (bereits durch Panel gehandhabt).

### Nicht enthalten
- Keine Änderungen an `useAssignedClients`, Datenmodell oder Backend — alle Felder werden bereits gefetcht.
- Keine Änderungen am Anrufer- oder Timer-Bereich.
