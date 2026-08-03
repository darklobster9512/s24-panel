# Korrektur der Vertragsvorlagen

## 1. Zusatzsatz aus der 22,5h-Vorlage entfernen
In der neuen Vorlage „Teilzeit – 22,5 Std./Woche · Sekretär:in (Homeoffice)“ wird der eigenmächtig ergänzte Satz vollständig gelöscht:

> Die tägliche Arbeitszeit von Montag bis Freitag je 4,5 Stunden wird in der Zeit von 08:30 bis 14:00 Uhr geleistet, inklusive einer unbezahlten Pause von 60 Minuten.

Danach ist der Text zu 100 % identisch mit den anderen Vorlagen — nur die Wochenstunden (22,5) unterscheiden sich.

## 2. „bei durchschnittlich 4,33 Wochen pro Monat“ streichen
In **allen** Vorlagen wird der Zusatz aus § 3 Vergütung entfernt. Der Satz lautet danach:

> Die Vergütung basiert auf einem Stundenlohn von 20,00 € brutto.

Betroffen sind alle aktiven Vorlagen (20h, 30h, 35h, 40h, 22,5h).

## Technisch
Reine Datenänderung in `public.contract_templates` per Textersetzung im `content_html`. Kein Code-Änderungsbedarf. Bereits erzeugte PDFs bleiben unverändert; neue Verträge nutzen automatisch den korrigierten Text.
