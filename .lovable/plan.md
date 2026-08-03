## Ziel
Wenn im Mitarbeiter-Wizard (Schritt 2) „Arbeitsvertrag zuweisen“ aktiviert und eine Vertragsvorlage gewählt wird, sollen **Vertragsart** und **Gehalt (€ / Monat)** automatisch aus der Vorlage übernommen werden.

## Datenlage (geprüft)
`contract_templates` enthält bereits passende Felder:
- Teilzeit – 20 Std./Woche → Kategorie „Teilzeit“, 1.733,00 €
- Teilzeit – 30 Std./Woche → Kategorie „Teilzeit“, 2.600,00 €
- Vollzeit – 40 Std./Woche → Kategorie „Vollzeit“, 3.467,00 €

## Umsetzung (`src/pages/superadmin/MitarbeiterWizard.tsx`)
1. Vorlagen-Query um `category` und `monthly_salary` erweitern (aktuell nur `id,title,version,is_active`).
2. Beim Auswählen einer Vorlage im Select:
   - `contract_type` auf `vollzeit`/`teilzeit` setzen (aus `category`, klein geschrieben; Fallback: aus dem Titel ableiten).
   - `salary` auf `monthly_salary` setzen (als Zahl ohne Nachkomma-Nullen, z. B. `1733`).
   - Beide Felder mit Validierung neu setzen, damit die Schritt-Prüfung sofort grün ist.
3. Werden die Felder danach manuell geändert, bleibt die manuelle Eingabe erhalten (Auto-Fill nur bei Vorlagen-Auswahl, nicht dauerhaft erzwungen).
4. Deaktiviert man die Checkbox wieder, bleiben die übernommenen Werte stehen (sie sind ganz normal editierbar).
5. Kleiner Hinweistext unter dem Vorlagen-Select: „Vertragsart und Gehalt wurden aus der Vorlage übernommen.“

## Nicht betroffen
Keine Datenbank-Änderungen, keine Änderungen am Vertrags-Workflow oder an der PDF-Generierung.
