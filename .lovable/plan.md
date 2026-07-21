## Ziel
Den "Daten ausfüllen"-Step (Phase `wizard`) in `src/pages/mitarbeiter/Arbeitsvertrag.tsx` in einen mehrstufigen Sub-Wizard mit vertikaler Stepper-Sidebar links und Formular rechts umbauen. Felder in 3 logische Gruppen aufteilen, alle Inputs mit hilfreichen Placeholder-Texten versehen.

## Layout
```text
+----------------------+-------------------------------+
| 1. Persönliches   ●  |  <Formularfelder Gruppe>      |
| 2. Bankdaten         |                               |
| 3. Sozialversicher.  |  [ Zurück ] [ Weiter/Fertig ] |
+----------------------+-------------------------------+
```
- Linke Spalte: vertikaler Stepper (Nummer-Kreis + Titel + kurzer Untertitel), aktiver Schritt hervorgehoben, erledigte Schritte mit Check-Icon. Steps sind klickbar zur Navigation.
- Rechte Spalte: Panel mit den Feldern der aktuellen Gruppe im 2-Spalten-Grid, unten Navigations-Buttons.
- Auf Mobile stacken (Stepper oben horizontal, Form unten).

## Gruppierung der Felder
1. **Persönliches** – `birth_date`, `birth_place`, `nationality`, `marital_status`
2. **Bankdaten** – `iban`, `bic`, `bank_name`, `tax_id`
3. **Sozialversicherung** – `social_security_number`, `health_insurance`

## Placeholder-Texte
| Feld | Placeholder |
|---|---|
| birth_date | `TT.MM.JJJJ` (Type=date, native) |
| birth_place | `z.B. Berlin` |
| nationality | `z.B. Deutsch` |
| marital_status | `z.B. ledig, verheiratet` |
| iban | `DE00 0000 0000 0000 0000 00` |
| bic | `z.B. DEUTDEFFXXX` |
| bank_name | `z.B. Deutsche Bank` |
| tax_id | `11-stellige Steuer-ID` |
| social_security_number | `z.B. 12 345678 A 901` |
| health_insurance | `z.B. TK, AOK, Barmer` |

## Verhalten
- Neuer lokaler State `subStep: 0 | 1 | 2`.
- "Weiter" validiert nur die Felder der aktuellen Gruppe (`form.trigger([...])`) und schaltet weiter.
- Im letzten Sub-Step heißt der Button "Speichern & signieren" und triggert wie bisher `form.handleSubmit(saveDataMutation.mutate)`.
- "Zurück" im ersten Sub-Step führt zurück zur `preview`-Phase (bestehendes Verhalten).
- `TF`-Hilfskomponente bekommt einen optionalen `placeholder`-Prop.

## Technisches
- Nur `src/pages/mitarbeiter/Arbeitsvertrag.tsx` wird angefasst.
- Stepper als kleine interne Komponente (`SubStepper`) mit den semantischen Tokens (`bg-primary`, `text-primary-foreground`, `border-border/60`, `text-muted-foreground`). Kein Hardcoding von Farben.
- Keine DB-, Route- oder Validierungs-Schema-Änderungen.
