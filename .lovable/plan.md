# Arbeitsverträge zuweisen und genehmigen

Alle 24 genannten Personen sind als Mitarbeitende angelegt, bisher hat niemand einen Vertrag zugewiesen. Die sechs Vorlagen (20 / 22,5 / 25 / 30 / 35 / 40 Std.) sind vorhanden und aktiv.

## Was passiert

Jede Person bekommt die Vorlage passend zu ihren Wochenstunden:

- 22,5 Std.: Melanie Dreesmann, Patrick Ulmer
- 30 Std.: Heike Kasper, Julia Rogge, Nicole Wurm, Dorian Pitz, Jacqueline Kaleyta, Christiane Rappholz, Nicole Wilde, Daniela Tretter
- 35 Std.: Alina Reetz, Melina Moch, Medina Amara Bozza, Melanie Haase
- 40 Std.: Kevin Wettin, Andreas Klaus, Tom Henke, Lea Stahnke, Stefanie Botros, Vanessa Pfister, Holger Heidemann, Marcel Röll, Cathrin Koschmann, Wolfgang Klar

Status:

- **Zugewiesen, wartet auf Mitarbeiter** (noch nichts eingereicht): Heike Kasper, Melanie Haase, Cathrin Koschmann, Daniela Tretter, Nicole Wilde, Medina Amara Bozza, Julia Rogge, Melina Moch
- **Abgeschlossen / genehmigt**: alle übrigen 16

Zusätzlich werden bei jeder Person Anstellungsart (Teilzeit/Vollzeit) und Monatsgehalt aus der Vorlage übernommen, damit Wizard und Übersicht stimmig sind.

## Punkte zum Wissen

- Für die 16 abgeschlossenen Verträge gibt es keine echte Unterschrift des Mitarbeitenden und kein gespeichertes PDF — diese Daten sind mit der alten Datenbank verloren gegangen. Sie werden als unterschrieben und bestätigt markiert (mit Datum), die Unterschriftsfläche bleibt leer. Sag Bescheid, falls stattdessen eine Namenszug-Grafik automatisch erzeugt werden soll.
- Patrick Ulmer und Wolfgang Klar haben kein Login-Konto; der Vertrag wird trotzdem hinterlegt, sie können ihn ohne Zugang aber nicht sehen.

## Technisch

Reine Datenänderung über `run_sql`: je ein Eintrag in `public.employee_contracts` (employee_id, template_id, status `pending_employee` bzw. `completed`, bei `completed` zusätzlich `signed_at` und `admin_confirmed_at`), plus `UPDATE public.employees SET contract_type, salary` gemäß Vorlage. Keine Codeänderungen nötig — die Verträge erscheinen automatisch unter `/superadmin/arbeitsvertraege` und im Mitarbeiter-Panel.
