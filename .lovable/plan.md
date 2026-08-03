## Ziel
In Schritt 1 („Person“) des Mitarbeiter-Wizards eine durchsuchbare Dropdown-Auswahl für Bewerber ergänzen. Nach Auswahl werden Vorname, Nachname, persönliche E-Mail und persönliche Telefonnummer automatisch übernommen (weiterhin manuell überschreibbar).

## Umsetzung
- Neue Query in `MitarbeiterWizard.tsx`, die aus `applications` die Felder `id, vorname, nachname, email, handynummer, status, ranking` lädt (sortiert nach Erstelldatum, neueste zuerst).
- Neue Komponente `BewerberSelect` (Combobox aus `Popover` + `Command` der bestehenden UI-Bibliothek) mit Suchfeld über Name und E-Mail.
- Anzeige pro Eintrag: „Vorname Nachname“ plus E-Mail als Zusatzzeile, optional Status-Badge.
- Bei Auswahl: `form.setValue` für `first_name`, `last_name`, `personal_email`, `personal_phone` (mit Validierung/Dirty-Flag), Toast-Bestätigung.
- Zusätzlicher „Auswahl aufheben“-Eintrag, der die Verknüpfung entfernt (Felder bleiben unverändert, damit nichts versehentlich gelöscht wird).
- Platzierung: über den vier Eingabefeldern, volle Breite; Hinweistext „Optional – Felder werden automatisch befüllt“.

## Technische Details
- Keine Datenbankänderung nötig; `applications` enthält alle benötigten Felder.
- Im Bearbeiten-Modus wird die Auswahl nicht vorbelegt (kein Verknüpfungsfeld in `employees`); die Combobox dient rein zum Vorbefüllen.
- Ladezustand und leerer Zustand („Keine Bewerber gefunden“) werden abgefangen.
