# Neue Vertragsvorlage: Teilzeit 22,5 Std./Woche

## Was entsteht
Eine weitere Vorlage unter `/superadmin/vertraege`, aufgebaut wie die bestehenden Vorlagen.

- Titel: `Teilzeit – 22,5 Std./Woche · Sekretär:in (Homeoffice)` (gleiches Schema wie die anderen Titel)
- Kategorie: `Teilzeit`
- Gehalt: **1950 €/Monat** (22,5 h × 20 €/h × 52 ÷ 12 = exakt 1950, keine Kommastellen)
- Status: aktiv, Version 1

## Inhalt
Der Vertragstext wird 1:1 von der bestehenden Teilzeit-Vorlage übernommen; angepasst werden nur:
- Wochenarbeitszeit: 22,5 Stunden
- Tägliche Arbeitszeit: Montag bis Freitag je 4,5 Stunden, 08:30–14:00 Uhr, inkl. 60 Minuten unbezahlter Pause
- Beschäftigungsform bleibt „Teilzeit“

Alle Platzhalter (`{{ vollname }}`, `{{ monatsgehalt }}`, Adresse, Startdatum usw.) bleiben unverändert erhalten.

## Technisch
Ein einzelner Insert in `public.contract_templates` mit angepasstem `content_html`. Kein Code-Änderungsbedarf — die Vorlage erscheint automatisch in der Übersicht und im Mitarbeiter-Wizard unter „Arbeitsvertrag zuweisen“ (mit automatischer Übernahme von Vertragsart und Gehalt).
