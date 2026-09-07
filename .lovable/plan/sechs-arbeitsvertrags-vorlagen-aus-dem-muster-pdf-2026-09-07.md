# Sechs Arbeitsvertrags-Vorlagen aus dem Muster-PDF

## Was entsteht
Unter `/superadmin/vertraege` entstehen sechs neue, aktive Vorlagen — Inhalt 1:1 aus dem hochgeladenen Muster (§ 1 bis § 11, Recruiter:in im Homeoffice), nur Wochenstunden und Gehalt unterscheiden sich:

| Titel | Kategorie | Wochenstunden | Monatsgehalt |
|---|---|---|---|
| Teilzeit – 20 Std./Woche · Recruiter:in (Homeoffice) | Teilzeit | 20 | 1.733 € |
| Teilzeit – 22,5 Std./Woche · Recruiter:in (Homeoffice) | Teilzeit | 22,5 | 1.950 € |
| Teilzeit – 25 Std./Woche · Recruiter:in (Homeoffice) | Teilzeit | 25 | 2.167 € |
| Teilzeit – 30 Std./Woche · Recruiter:in (Homeoffice) | Teilzeit | 30 | 2.600 € |
| Vollzeit – 35 Std./Woche · Recruiter:in (Homeoffice) | Vollzeit | 35 | 3.033 € |
| Vollzeit – 40 Std./Woche · Recruiter:in (Homeoffice) | Vollzeit | 40 | 3.467 € |

Berechnung: 20,00 € brutto pro Stunde × Wochenstunden × 4,333 (Wochen pro Monat), kaufmännisch auf volle Euro gerundet. Das bestätigt auch das Muster: 40 Std. → 3.467 €.

## Inhalt der Vorlagen
- Kopf mit Arbeitgeber aigis one GmbH, Simone Heße, Liefergasse 5, 40213 Düsseldorf und Arbeitnehmerdaten als Platzhalter (Name, Adresse).
- § 1 Beginn/Art (Startdatum als Platzhalter, „unbefristetes Teilzeit-/Vollzeitarbeitsverhältnis“ passend zur Vorlage, jeweilige Wochenstundenzahl, Homeoffice-Absatz).
- § 2 Tätigkeitsbereich mit den fünf Recruiting-Aufgaben aus dem Muster.
- § 3 Vergütung mit dem jeweiligen Monatsbetrag, der jeweiligen Stundenobergrenze und dem Stundenlohn 20,00 € brutto.
- § 4 Arbeitszeit, § 5 Probezeit (4 Wochen, 14 Tage Frist), § 6 Arbeitsmittel, § 7 Urlaub (32 Tage), § 8 Vertraulichkeit/DSGVO, § 9 Kündigung, § 10 Schlussbestimmungen, § 11 Geltendes Recht — wörtlich wie im Muster.
- Unterschriftsblock am Ende: Arbeitgeberin Simone Heße (Geschäftsführerin) und Arbeitnehmer:in; die Firmenunterschrift und die Mitarbeiterunterschrift werden wie bisher beim Signieren automatisch eingesetzt.

Die alte leere Vorlage „Neue Vorlage“ wird gelöscht.

## Technisch
Reine Datenänderung: sechs Einträge in `public.contract_templates` mit `content_html`, `category`, `monthly_salary`, `is_active = true`, Version 1. Verwendete Platzhalter: `{{ vollname }}`, `{{ adresse }}`, `{{ startdatum }}`. Kein Code-Änderungsbedarf — die Vorlagen erscheinen automatisch in der Vertragsübersicht und im Mitarbeiter-Wizard.
