# Mitarbeiter-Panel: Cockpit und Statistik für Outbound-Recruiter

## Was ich geprüft habe

- In der Datenbank existieren insgesamt nur **3 Anrufe** in `sipgate_calls`. Alle Kennzahlen im Cockpit (Anrufe heute, Ø Gesprächszeit, Letzte Anrufe) lesen ausschließlich aus dieser Tabelle und nur für **zugewiesene Kunden**. Für Outbound-Recruiter gibt es dort schlicht keine Daten — deshalb sind die Cards leer. Das ist kein Ladefehler, sondern eine falsche Datenquelle für diese Rolle.
- Die erfassten Gespräche der Recruiter liegen in `call_notes` inklusive Dauer: z. B. Wolfgang Klar 23 Notizen (21 mit Dauer, Ø ~11 Min), Markus Oldach Peters 26 Notizen (17 mit Dauer). Die Daten werden also getrackt.
- Die Statistik-Seite nutzt für Outbound bereits `call_notes`. Warum die Grafik „Ø Gesprächsdauer" trotzdem leer bleibt, ist noch **nicht bestätigt** — das muss zuerst im eingeloggten Zustand reproduziert werden (mögliche Ursachen: Konto ohne gesetztes `outbound_recruitment`-Flag, Zeitzonen-Versatz bei der Tages-Zuordnung, oder Notizen ohne Dauer).

## Vorgehen

### 1. Ursache der leeren Gesprächsdauer-Grafik bestätigen
Mit einem echten Recruiter-Konto einloggen, `/mitarbeiter/statistik` aufrufen und prüfen, welche Werte ankommen (Anzahl Gespräche, Ø Dauer, Tages-Buckets). Erst danach gezielt fixen.

Bereits absehbare Korrekturen:
- Tages-Buckets werden per UTC-Datum gebildet, die Beschriftung aber lokal (Berlin) erzeugt. Gespräche am späten Abend landen dadurch im falschen Tag bzw. in gar keinem Bucket. Umstellung auf durchgehend lokale Datums-Schlüssel.
- Notizen mit `dauer_sekunden = 0` (Timer nicht gestartet) fließen korrekt nicht in den Durchschnitt ein; wenn an einem Tag alle 0 sind, bleibt die Linie leer. Statt einer leeren Fläche wird dann ein Hinweis „Keine Gesprächsdauer erfasst" gezeigt.
- Fallback: Statistik nicht mehr strikt an das `outbound_recruitment`-Flag koppeln. Wenn keine Inbound-Anrufe vorliegen, aber Notizen mit Dauer existieren, werden diese als Quelle genutzt — unabhängig vom Flag.

### 2. Cockpit für Outbound-Recruiter umbauen
Das Cockpit bekommt eine eigene Variante, wenn der Mitarbeiter Outbound-Recruiter ist (bzw. keine Inbound-Anrufe hat):

- **Gespräche heute** — Anzahl `call_notes` von heute (Vergleich zu gestern)
- **Ø Gesprächszeit** — Mittelwert `dauer_sekunden` der heutigen Notizen
- **Gesamtzeit heute** — Summe der Gesprächsdauer
- **Offene Rückrufe** — bleibt wie bisher
- **Letzte Gespräche** — statt Anrufliste die letzten erfassten Notizen (Name, Nummer, Kategorie, Dauer, Zeitpunkt), verlinkt auf `/mitarbeiter/notizen`
- Panel „Meine Kunden" bleibt; bei Recruitment-Kunden zusätzlich Link zu den Bewerbungsgesprächen

Für klassische Sekretariats-Mitarbeiter bleibt das Cockpit unverändert.

### 3. Live-Aktualisierung
Das Cockpit abonniert wie die Statistik `call_notes` per Realtime, damit die Cards direkt nach dem Speichern eines Gesprächs aktualisieren.

## Technische Details

- `src/pages/mitarbeiter/Cockpit.tsx`: neue Datenquelle `call_notes` (gefiltert auf `employee_id`) parallel zu `sipgate_calls`; Auswahl der angezeigten Variante über `employees.outbound_recruitment` bzw. Datenlage.
- Gemeinsame Helfer für Tages-Buckets und Dauer-Berechnung in eine kleine Datei auslagern, damit Cockpit und Statistik dieselbe Logik nutzen.
- `src/pages/mitarbeiter/Statistik.tsx`: lokale Datums-Schlüssel, Quellenauswahl mit Fallback, klarere Leerzustände.
- Keine Datenbank-Änderungen nötig.
