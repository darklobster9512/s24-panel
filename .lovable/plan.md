## Ausgangslage

- Stellenanzeige (sekretariat-24.de/karriere): **20 € pro Stunde**, Teilzeit/Vollzeit, Homeoffice.
- Bestehende Vorlage „Teilzeit – 20 Std./Woche · Sekretär:in (Homeoffice)" hat aktuell **1.600,00 €** hinterlegt — das passt nicht zu 20 €/Std.

## Berechnung (auf volle Euro gerundet)

Monatsgehalt = Wochenstunden × 20 € × 4,333 (13 Wochen / 3 Monate), kaufmännisch gerundet:

```text
20 Std./Woche  →  1.733,33 €  →  1.733,00 €
30 Std./Woche  →  2.600,00 €  →  2.600,00 €
40 Std./Woche  →  3.466,67 €  →  3.467,00 €
```

Es werden keine Nachkommacent-Beträge verwendet — alle Vorlagen enden auf ,00.

## Umsetzung

1. **Bestehende Vorlage aktualisieren (20 Std.)**
   - `monthly_salary` von 1.600,00 auf **1.733,00** setzen.
   - Im Vertragstext (§ Vergütung) Betrag und Herleitung anpassen: „20 € pro Stunde; bei 20 Stunden pro Woche entspricht dies durchschnittlich 1.733,00 € brutto monatlich."

2. **Neue Vorlage: Teilzeit – 30 Std./Woche**
   - Kopie der bestehenden Vorlage, Kategorie „Teilzeit", `monthly_salary` = **2.600,00**.
   - Im Text: „30 Stunden pro Woche", Vergütungsabsatz entsprechend, Urlaubsanspruch anteilig.

3. **Neue Vorlage: Vollzeit – 40 Std./Woche**
   - Kategorie „Vollzeit", `monthly_salary` = **3.467,00**.
   - Im Text: „unbefristetes Vollzeitarbeitsverhältnis", „40 Stunden pro Woche", voller Urlaubsanspruch, Vergütungsabsatz entsprechend.

Alle drei Vorlagen behalten identische Struktur (Arbeitgeber-/Arbeitnehmerblock, Platzhalter `{{ vollname }}`, `{{ startdatum }}`, `{{ monatsgehalt }}` etc.), damit PDF-Generierung und Signatur-Workflow unverändert funktionieren.

## Technische Details

- Datenänderungen laufen über das Insert/Update-Tool auf `public.contract_templates` (keine Schemaänderung nötig).
- Neue Vorlagen mit `is_active = true`, `version = 1`; sie erscheinen automatisch unter `/superadmin/vertraege` und in der Vertragsauswahl im Mitarbeiter-Wizard.
- Beträge werden im Text als „X.XXX,00 €" formatiert.
