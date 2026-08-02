## Ziel

Die bestehende Vorlage „Teilzeit - 20 Stunden/Woche" enthält noch den Text aus dem Referenzprojekt (Online-Prozess Tester/in, App-Testing). Sie wird inhaltlich auf die reale Stelle aus der Karriereseite umgeschrieben: **Sekretärin im Homeoffice (m/w/d)** – Telefonservice für Kundenunternehmen, 100 % Homeoffice, festes Monatsgehalt.

Arbeitgeberblock (aigis one GmbH, Simone Heße, Liefergasse 5, 40213 Düsseldorf) bleibt unverändert. Es wird keine neue Vorlage angelegt – die bestehende wird überschrieben (Version hochgezählt).

## Neuer Vertragsinhalt

- **§ 1 Beginn und Art des Arbeitsverhältnisses** – Beginn `{{ startdatum }}`, Tätigkeit als **Sekretärin / Telefonservice-Mitarbeiter/in (m/w/d)**, unbefristet, Teilzeit 20 Std./Woche, ausschließlich Homeoffice innerhalb Deutschlands, ruhiger Arbeitsplatz ohne Hintergrundgeräusche.
- **§ 2 Tätigkeitsbereich** (aus der Stellenanzeige):
  - Entgegennahme von Anrufen im Namen der jeweiligen Kundenunternehmen
  - Saubere Dokumentation von Nachrichten und Anliegen
  - Koordination von Terminen und Organisation von Rückrufen
  - Pflege von Daten in CRM- und Ticketsystemen der Kunden
  - Freundlicher, verbindlicher Kontakt zu Anrufer:innen
  - Einhaltung der Gesprächsleitfäden und Qualitätsvorgaben
  - Hinweis auf strukturierte Einarbeitung/Onboarding und Schulungen
- **§ 3 Vergütung** – festes Monatsgehalt `{{ monatsgehalt }}` brutto, abgegolten sind bis zu 20 Arbeitsstunden pro Woche; Auszahlung zum Monatsende auf das benannte Konto; freiwillige Bonuszahlungen ohne Rechtsanspruch.
- **§ 4 Arbeitszeit** – planbare Schichten nach Dienstplan, Abstimmung im Voraus, Verlässlichkeit/Pünktlichkeit bei Schichtbeginn, Erreichbarkeit während der Schicht.
- **§ 5 Probezeit** – unverändert (4 Wochen, 14 Tage Kündigungsfrist).
- **§ 6 Arbeitsmittel** – eigener Computer/Laptop, Headset und stabile Internetverbindung als Voraussetzung (statt Tablet/Smartphone-Formulierung); Zugänge zu den Systemen stellt der Arbeitgeber.
- **§ 7 Urlaub** – unverändert (32 Tage, Tippfehler „pro jahr" → „pro Jahr" korrigiert).
- **§ 8 Vertraulichkeit und Datenschutz** – erweitert um Telefonie-Bezug: besondere Verschwiegenheit über Anruferdaten und Kundendaten, DSGVO-konforme Verarbeitung, keine Aufzeichnung/Weitergabe von Gesprächsinhalten.
- **§ 9 Kündigung**, **§ 10 Schlussbestimmungen**, **§ 11 Geltendes Recht** – unverändert.

Der bestehende Kopfblock (Arbeitgeber/Arbeitnehmer mit `{{ vollname }}`, `{{ strasse }}`, `{{ plz }}`, `{{ stadt }}`) und alle Platzhalter bleiben erhalten, ebenso die Formatierung (zentrierter Kopf, `<h2>`-Paragraphen, Bulletlisten) – damit greifen die bereits reduzierten Abstände der `.contract-preview`-Klasse weiterhin.

## Technische Umsetzung

- Ein Daten-Update auf `contract_templates` (Zeile `6aef9913-…`):
  - `content_html` = neuer Vertragstext
  - `title` = „Teilzeit – 20 Std./Woche · Sekretärin (Homeoffice)"
  - `version` = 2, `updated_at` = now()
  - `monthly_salary` bleibt bei 1.600,00 € (jederzeit im Editor änderbar; sag Bescheid, wenn ein anderer Betrag rein soll)
- Keine Schema-Änderung, keine Code-Änderung nötig. Bereits signierte Verträge (`employee_contracts`) sind nicht betroffen, da PDFs separat gespeichert sind.
