# Recruiter:in-Vorlagen: verbliebene Sekretariats-Formulierungen korrigieren

Beim Kopieren wurde nur § 2 (Aufgaben) angepasst. In allen 5 Recruiter:in-Vorlagen steht in § 1 weiterhin die alte Berufsbezeichnung, und in § 6 (Vertraulichkeit) noch „Anrufer:innen".

## Änderungen in allen 5 Recruiter:in-Vorlagen

1. § 1 Beginn und Art des Arbeitsverhältnisses

   Vorher: Der Arbeitnehmer wird als **Sekretär:in / Telefonservice-Mitarbeiter:in (m/w/d)** beschäftigt.

   Nachher: Der Arbeitnehmer wird als **Recruiter:in / Talent-Acquisition-Mitarbeiter:in (m/w/d)** beschäftigt.

2. § Vertraulichkeit und Datenschutz

   Vorher: „… personenbezogene Daten von Anrufer:innen sowie für alle Daten der Kundenunternehmen."

   Nachher: „… personenbezogene Daten von Kandidat:innen und Bewerber:innen sowie für alle Daten der Kundenunternehmen."

Alles Übrige (Stundenlohn 20,00 €, Wochenstunden, Gehälter, Platzhalter) bleibt unverändert. Die Sekretär:in-Vorlagen werden nicht angefasst.

## Technisch
Reine Datenänderung: gezielte Textersetzung im `content_html` der Vorlagen mit `Recruiter:in` im Titel. Danach Kontrollabfrage, dass kein „Sekretär", „Telefonservice" oder „Anrufer" mehr enthalten ist.
