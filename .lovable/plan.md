# Zuweisungen umkehren: Branding-Cards mit Mitarbeitern

## Ziel
Die Seite `/superadmin/zuweisungen` wird umgedreht: Statt einer Sektion pro Mitarbeiter (mit Kunden-Cards darin) gibt es künftig eine Sektion pro Branding/Kunde, in der die zugewiesenen Mitarbeiter als Karten angezeigt werden. Der "+"-Button öffnet ein Popup mit allen noch nicht zugewiesenen Mitarbeitern.

## Was sich ändert (nur `src/pages/superadmin/Zuweisungen.tsx`)
Keine Datenbankänderung — die `assignments`-Tabelle ist bereits Many-to-Many und kann beide Richten abbilden.

1. **Layout-Richtung umdrehen**
   - Es wird über `clients` iteriert (nicht über `employees`).
   - Jede Panel-Card zeigt oben das Branding: Logo, Firmenname, Branche, Anzahl zugewiesener Mitarbeiter.
   - Darin ein Grid mit Mitarbeiter-Cards (Avatar-Initialen, Name, Login-E-Mail, Vertragstyp-Badge) und einer Entfernen-X pro Karte.
   - "+"-Karte unten im Grid öffnet den Dialog.

2. **Dialog umfunktionieren**
   - Statt "Kunde für {Mitarbeiter} zuweisen" → "Mitarbeiter für {Branding} zuweisen".
   - Die Liste zeigt verfügbare Mitarbeiter (die diesem Branding noch nicht zugewiesen sind), mit Suche nach Namen/E-Mail.
   - `assignClient` / `removeAssignment` bleiben logisch gleich, nur die Parameterreihenfolge/UI-Beschriftung passt sich an (Mitarbeiter wird dem Client zugewiesen, nicht umgekehrt).

3. **Mapping anpassen**
   - `byEmployee` (Map employee_id → assignments) wird zu `byClient` (Map client_id → assignments).
   - `employeesById` Map ergänzen, damit in jeder Branding-Card die Mitarbeiter aufgelöst werden können.
   - Logo-Signing-Logik bleibt unverändert (läuft über clients).

4. **Leerstand / Empty States**
   - Wenn keine Brandings existieren → Hinweis "Lege zuerst einen Kunden an" mit Link zu `/superadmin/kunden/anlegen`.
   - Brandings ohne Mitarbeiter zeigen trotzdem das Panel mit nur der "+"-Karte.

5. **Header-Subtitle** leicht anpassen: "Weise Brandings die Mitarbeiter zu, die dafür Calls und Notizen anlegen dürfen."

## Was gleich bleibt
- Supabase-Queries (`employees`, `clients`, `assignments`), Storage-Signing, optimistic Update-/Remove-Logik, RLS, Routing — alles unverändert.

## Technische Details
- Datei: `src/pages/superadmin/Zuweisungen.tsx`
- Keine Migration, keine neuen Abhängigkeiten, keine anderen Dateien.
