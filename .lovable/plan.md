# PLZ und Stadt in einer Zeile

Im Adressblock der Vertragsvorlagen stehen `{{ plz }}` und `{{ stadt }}` aktuell in zwei getrennten Absätzen untereinander. Sie sollen in einer Zeile stehen: `12345 Musterstadt`.

## Was geändert wird

1. **Alle 5 Vertragsvorlagen** (20h, 22,5h, 30h, 35h, 40h): Die beiden Absätze `{{ plz }}` und `{{ stadt }}` werden zu einem Absatz `{{ plz }} {{ stadt }}` zusammengefasst. Rest des Dokuments bleibt unverändert.

2. **Bereits eingereichte Arbeitsverträge**: Die 3 Verträge mit Status „Wartet auf Bestätigung“ werden beim Öffnen live aus der Vorlage gerendert — sie zeigen die Korrektur also automatisch, sobald die Vorlagen angepasst sind. Kein zusätzlicher Eingriff nötig.

3. **Bereits abgeschlossener Vertrag (1 Stück)**: Dessen PDF ist fest gespeichert und ändert sich nicht mehr. Auf Wunsch kann das PDF neu erzeugt werden – bitte sagen, ob das gewünscht ist.

## Technisch

- Datenänderung per `UPDATE` auf `public.contract_templates`: Ersetzen von
  `<p style="text-align: center;">{{ plz }}</p><p style="text-align: center;">{{ stadt }}</p>`
  durch
  `<p style="text-align: center;">{{ plz }} {{ stadt }}</p>`
- Kein Codeänderung nötig; `renderContractHtml` füllt die Platzhalter weiterhin unverändert.
