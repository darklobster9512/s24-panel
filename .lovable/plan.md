## Ziel

1. Handynummer und E-Mail in der Bewerber-Card (`/mitarbeiter/erfassen`, Recruiting) per Klick ins Clipboard kopieren.
2. Platzhalter in eckigen Klammern im Call-Skript als Variablen behandeln und beim Öffnen automatisch ersetzen.

## 1. Bewerber-Card: Click-to-Copy

In `src/pages/mitarbeiter/RecruitmentErfassen.tsx` werden die `tel:`/`mailto:`-Links durch Buttons ersetzt, die `navigator.clipboard.writeText(...)` aufrufen und eine kurze Bestätigung zeigen (Toast + kurzzeitiges Häkchen-Icon statt Phone/Mail-Icon). Optik bleibt identisch (Icon + Text, Hover-Highlight), Cursor wird `pointer`, Tooltip/`title` „Zum Kopieren klicken".

## 2. Variablen im Call-Skript

**Datenbank** — zwei neue Spalten auf `public.clients` (Migration):
- `call_script_my_name text` (Wert für `[Mein_Name]`)
- `call_script_company_name text` (Wert für `[Firmenname]`)

**Kunden-Wizard** (`src/pages/superadmin/KundenWizard.tsx`, Schritt 5 „Konfiguration"): Wenn „Recruitment-Kunde" aktiv ist, erscheinen über dem Editor zwei Eingabefelder „Mein Name" und „Firmenname". Darunter ein kleiner Hinweis mit den verfügbaren Variablen: `[Bewerber_Name]`, `[Mein_Name]`, `[Firmenname]`. Beide Felder werden beim Speichern/Laden im Wizard-Schema mitgeführt.

**Vorlage** (`src/lib/call-script-template.ts`): Die aktuell uneinheitlichen Platzhalter (`[Name]` sowohl für Bewerber als auch für den Anrufer) werden auf `[Bewerber_Name]`, `[Mein_Name]`, `[Firmenname]` vereinheitlicht.

**Anzeige beim Anruf** (`RecruitmentErfassen.tsx`): Neue kleine Hilfsfunktion (z. B. `src/lib/call-script-vars.ts`), die vor dem Rendern alle `[…]`-Platzhalter im HTML ersetzt:
- `[Bewerber_Name]` → Nachname des Bewerbers (letztes Wort aus dem Namen des Bewerbungsgespräch-Teilnehmers)
- `[Mein_Name]` → `clients.call_script_my_name`
- `[Firmenname]` → `clients.call_script_company_name`, Fallback: Kundenname

Der Client-Query wird um die beiden neuen Spalten erweitert. Ersetzung ist case-insensitiv und toleriert Leerzeichen in den Klammern. Nicht befüllte Variablen bleiben sichtbar stehen und werden dezent hervorgehoben (gelbe Markierung), damit der Mitarbeiter sie erkennt.

## Technische Details

- Ersetzung erfolgt nur zur Anzeige, das gespeicherte Skript bleibt mit Platzhaltern erhalten.
- Nachname-Ableitung: Name trimmen, an Leerzeichen splitten, letztes Segment nehmen; bei einteiligem Namen wird dieser genutzt.
- Migration braucht keine neuen GRANTs (bestehende Tabelle).
