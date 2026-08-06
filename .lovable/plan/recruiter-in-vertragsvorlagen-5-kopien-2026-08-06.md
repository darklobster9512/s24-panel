# Recruiter:in-Vertragsvorlagen (5 Kopien)

## Was entsteht
Fünf neue Vorlagen unter `/superadmin/vertraege` — exakte Kopien der bestehenden Sekretär:in-Vorlagen, nur mit neuem Titel und neuem Aufgabenbereich:

| Titel | Kategorie | Gehalt |
|---|---|---|
| Teilzeit – 20 Std./Woche · Recruiter:in (Homeoffice) | Teilzeit | 1733 € |
| Teilzeit – 22,5 Std./Woche · Recruiter:in (Homeoffice) | Teilzeit | 1950 € |
| Teilzeit – 30 Std./Woche · Recruiter:in (Homeoffice) | Teilzeit | 2600 € |
| Vollzeit - 35 Std./Woche · Recruiter:in (Homeoffice) | Vollzeit | 3033 € |
| Vollzeit – 40 Std./Woche · Recruiter:in (Homeoffice) | Vollzeit | 3467 € |

Alle aktiv, Version 1, Stundenlohn 20,00 € brutto, Wochenstunden je Vorlage unverändert.

## Einzige inhaltliche Änderung: § 2 Tätigkeitsbereich
Die bisherige Aufzählung wird ersetzt durch:

- Kandidat:innen für Kundenunternehmen telefonisch ansprechen und vorqualifizieren
- Telefonische Erstgespräche (Screening-Calls) führen und Ergebnisse dokumentieren
- Interviewtermine zwischen Kandidat:innen und Kundenunternehmen koordinieren
- Bewerberdaten im Bewerbermanagement / CRM der jeweiligen Kunden pflegen
- Zusagen, Absagen und Nachfassaktionen im Namen der Kunden kommunizieren

Alles andere (§ 1, § 3 Vergütung, Arbeitszeiten, Platzhalter wie `{{ vollname }}`, `{{ monatsgehalt }}`) bleibt 1:1 identisch.

## Technisch
Reine Datenänderung: fünf Inserts in `public.contract_templates`, `content_html` aus der jeweiligen Quellvorlage kopiert und nur der `<ul>`-Block in § 2 ersetzt. Kein Code-Änderungsbedarf — die Vorlagen erscheinen automatisch in der Übersicht und im Mitarbeiter-Wizard.
