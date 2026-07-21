Ziel: Die USt-ID soll nicht mehr in der Kunden-Info-Card auf der Anruf-Erfassungsseite angezeigt werden.

Aktueller Zustand (bestätigt via `src/pages/mitarbeiter/Erfassen.tsx`):
- Unterhalb der Kunden-Card (Reihe mit Weiterleitung-Pille) gibt es eine USt-ID-Pille (`client.vatId`), die mit einem Hash-Icon ausgegeben wird.

Geplante Änderung:
1. In `src/pages/mitarbeiter/Erfassen.tsx` den Code-Block der USt-ID-Pille (Zeilen 344–349) entfernen.
2. Das `Hash` Icon aus dem `lucide-react` Import entfernen, falls es danach nicht mehr benötigt wird.
3. Visuell überprüfen, dass die Kunden-Card nach wie vor Telefon, E-Mail, Website, Adresse, Begrüßung, Firmeninhalt, Ansprechpartner und Weiterleitung-Status anzeigt.

Keine Datenbank- oder API-Änderungen erforderlich; das Feld bleibt in der Datenbank, wird nur nicht mehr im UI gerendert.