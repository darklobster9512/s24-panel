# Datenbank aus den Telegram-Protokollen wieder befüllen

## Was in den Protokollen steckt (geprüft)

Aus den beiden Exporten lassen sich folgende echte Datensätze auslesen:

- **5 Kunden:** LIMEX Solutions GmbH, Codebricks GmbH, Völler IT Solutions GmbH, Vendis Development Services GmbH, aigis one GmbH
- **636 Bewerbungen** mit Name, E-Mail, Handynummer, Geburtsdatum, Staatsangehörigkeit, Anstellung (Teil-/Vollzeit), Stelle (sekretär/recruiting) und Eingangsdatum
- **129 gebuchte Bewerbungsgespräche** mit Name, Datum, Uhrzeit und Buchungszeitpunkt
- **1.492 Anrufnotizen** (1.336 Recruitment, 156 Inbound) mit Kunde, Mitarbeiter, Anrufer/Bewerber, Nummer, Ergebnis, Dauer, Kategorie/Priorität und dem kompletten Notiztext
- **23 eingereichte Arbeitsverträge** (Name, Vorlage, Anstellungsart, Monatsgehalt, Datum)
- **11 Mitarbeitende**, die Notizen erfasst haben, jeweils fest einem Kunden zugeordnet – daraus ergeben sich die Zuweisungen

## Was ich anlege

1. **Kunden** – die 5 Firmen als vollwertige Einträge (kein Entwurf). Adresse, UST-ID, Logo und Begrüßungstext stehen nicht in den Protokollen und bleiben leer; aigis one GmbH bekommt wieder das Recruiting-Kennzeichen und den Gesprächsleitfaden.
2. **Mitarbeitende & Zugänge** – die 24 von dir genannten Personen mit E-Mail und Passwort als echte Login-Konten.
3. **Zuweisungen** – aus den Notizen abgeleitet, z. B. Michaela Lechter → LIMEX, Alina Reetz → Völler IT, Tom Henke und Kevin Wettin → Vendis, Julian TG → LIMEX und aigis one.
4. **Bewerbungen** – alle 636 mit Originaldatum und Status (angenommen, sobald ein Gespräch gebucht wurde).
5. **Bewerbungsgespräche** – alle 129 Termine, mit der passenden Bewerbung verknüpft.
6. **Anrufnotizen** – alle 1.492 Notizen mit Kunde, Mitarbeiter, Anrufer, Nummer, Ergebnis, Kategorie, Priorität, Dauer und Originaldatum.

## Punkte, die du kennen solltest

- In den Notizen tauchen 5 Namen auf, die nicht in deiner Zugangsliste stehen: **Wolfgang Klar, Patrick Ulmer, Ralf Weber, Sarah Aschoff, Markus Oldach Peters**. Damit ihre Notizen nicht verloren gehen, lege ich sie als Mitarbeitende **ohne Login** an. Sag Bescheid, wenn sie stattdessen weg sollen oder Zugangsdaten bekommen.
- Nicht wiederherstellbar, weil nie in den Meldungen enthalten: Lebenslauf-Dateien, Kundenlogos, Adress- und Bankdaten der Mitarbeitenden, Vertragsvorlagen und die signierten Verträge (die 23 Vertragsmeldungen enthalten nur Name, Vorlage und Gehalt – ich lege daraus keine Scheinverträge an).
- Bewerber-Datensätze enthalten keine Lebenslauf-Anhänge; die Felder bleiben leer.

## Technisches Vorgehen

- Ein Parser liest beide JSON-Exporte, normalisiert Datum/Uhrzeit (Europe/Berlin) und Telefonnummern und erzeugt daraus SQL-Inserts.
- Import über `run_sql` in dieser Reihenfolge: clients → employees (+ Auth-Konten über die bestehende `create-employee-account`-Funktion bzw. Admin-API) → assignments → applications → interview_appointments → call_notes.
- Zuordnung der Gespräche zu Bewerbungen über Name + Handynummer; Notizen über Kundenname und Mitarbeitername.
- Idempotenz: Import läuft nur auf leere Tabellen bzw. mit Duplikatsprüfung über Name + Zeitstempel.
